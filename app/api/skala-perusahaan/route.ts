import { prisma } from "@/lib/prisma";
import { createSkalaPerusahaanSchema } from "@/lib/validations/perusahaan.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import {
  REDIS_KEYS,
  ELASTIC_INDICES,
  DEFAULT_CACHE_TTL,
} from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { z } from "zod";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  dropdown: z.coerce.boolean().default(false),
});

// ──────────────────────────────────────────────────────────
// GET /api/skala-perusahaan — List dengan Pagination, Search & Dropdown
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, dropdown } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    // ── Mode Dropdown ────────────────────────────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.SKALA_PERUSAHAAN.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const { hits } = await searchDocuments(
        ELASTIC_INDICES.SKALA_PERUSAHAAN,
        { match_all: {} },
        {
          size: 10000,
          sort: [{ nama: { order: "asc" } }],
          _source: ["id", "nama"],
        },
      );

      await setCache(cacheKey, hits, DEFAULT_CACHE_TTL);
      return successResponse(hits, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const cacheKey = `${REDIS_KEYS.SKALA_PERUSAHAAN.ALL}:page:${page}:limit:${limit}`;

    if (!search) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const esQuery = search
      ? {
          multi_match: {
            query: search,
            fields: ["nama"],
            type: "best_fields" as const,
            fuzziness: "AUTO",
          },
        }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.SKALA_PERUSAHAAN,
      esQuery,
      {
        from: skip,
        size: limit,
        sort: [{ nama: { order: "asc" } }],
      },
    );

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    if (!search) {
      await setCache(cacheKey, { data: hits, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/skala-perusahaan — Buat Data Skala Perusahaan
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createSkalaPerusahaanSchema.parse(body);

    const exists = await prisma.m_skala_perusahaan.findUnique({
      where: { nama: validatedData.nama },
      select: { id: true },
    });
    if (exists)
      return errorResponse(409, "Nama Skala Perusahaan sudah ada", "CONFLICT");

    const newItem = await prisma.m_skala_perusahaan.create({
      data: validatedData,
    });

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(REDIS_KEYS.SKALA_PERUSAHAAN.ALL_PREFIX);

    return successResponse(newItem, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
