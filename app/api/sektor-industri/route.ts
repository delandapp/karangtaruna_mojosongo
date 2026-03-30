import { prisma } from "@/lib/prisma";
import { createSektorIndustriSchema } from "@/lib/validations/perusahaan.schema";
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
// GET /api/sektor-industri — List dengan Pagination, Search & Dropdown
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, dropdown } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    // ── Mode Dropdown ────────────────────────────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.SEKTOR_INDUSTRI.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const { hits } = await searchDocuments(
        ELASTIC_INDICES.SEKTOR_INDUSTRI,
        { match_all: {} },
        {
          size: 10000,
          sort: [{ nama_sektor: { order: "asc" } }],
          _source: ["id", "nama_sektor"],
        },
      );

      await setCache(cacheKey, hits, DEFAULT_CACHE_TTL);
      return successResponse(hits, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const cacheKey = `${REDIS_KEYS.SEKTOR_INDUSTRI.ALL}:page:${page}:limit:${limit}`;

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
            fields: ["nama_sektor", "deskripsi_sektor"],
            type: "best_fields" as const,
            fuzziness: "AUTO",
          },
        }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.SEKTOR_INDUSTRI,
      esQuery,
      {
        from: skip,
        size: limit,
        sort: [{ dibuat_pada: { order: "desc" } }],
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
// POST /api/sektor-industri — Buat Data Sektor Industri
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createSektorIndustriSchema.parse(body);

    // Cek duplikasi
    const exists = await prisma.m_sektor_industri.findUnique({
      where: { nama_sektor: validatedData.nama_sektor },
      select: { id: true },
    });
    if (exists)
      return errorResponse(409, "Nama Sektor Industri sudah ada", "CONFLICT");

    const newItem = await prisma.m_sektor_industri.create({
      data: validatedData,
    });

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(REDIS_KEYS.SEKTOR_INDUSTRI.ALL_PREFIX);

    return successResponse(newItem, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
