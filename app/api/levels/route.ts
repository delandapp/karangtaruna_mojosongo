import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createLevelSchema,
  paginationSchema,
} from "@/lib/validations/level.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import {
  REDIS_KEYS,
  ELASTIC_INDICES,
  DEFAULT_CACHE_TTL,
} from "@/lib/constants";
import {
  searchDocuments,
  indexDocument,
  deleteDocument,
} from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// ──────────────────────────────────────────────────────────
// GET /api/levels — List dengan Pagination, Search & Dropdown
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    // ── Mode Dropdown (untuk select input) ───────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.LEVELS.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const { hits } = await searchDocuments(
        ELASTIC_INDICES.LEVELS,
        { match_all: {} },
        {
          size: 1000,
          sort: [{ id: { order: "asc" } }],
          _source: ["id", "nama_level"],
        },
      );

      await setCache(cacheKey, hits, DEFAULT_CACHE_TTL);
      return successResponse(hits, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const {
      page,
      limit,
      search: searchQuery,
    } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
    });

    const skip = (page - 1) * limit;
    const cacheKey = `${REDIS_KEYS.LEVELS.ALL}:page:${page}:limit:${limit}`;

    // Cek cache hanya untuk non-search
    if (!searchQuery) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const esQuery = searchQuery
      ? { multi_match: { query: searchQuery, fields: ["nama_level"] } }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.LEVELS,
      esQuery,
      { from: skip, size: limit, sort: [{ dibuat_pada: { order: "desc" } }] },
    );

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache jika bukan pencarian
    if (!searchQuery) {
      await setCache(cacheKey, { data: hits, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/levels — Buat Level Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createLevelSchema.parse(body);

    const newLevel = await prisma.m_level.create({
      data: { nama_level: validatedData.nama_level },
    });

    // Invalidate cache
    await indexDocument(ELASTIC_INDICES.LEVELS, String(newLevel.id), newLevel);
    await invalidateCachePrefix(REDIS_KEYS.LEVELS.ALL_PREFIX);
    return successResponse(newLevel, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
