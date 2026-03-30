import { prisma } from "@/lib/prisma";
import { createPerusahaanSchema } from "@/lib/validations/perusahaan.schema";
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
  m_sektor_industri_id: z.coerce.number().int().positive().optional(),
  m_skala_perusahaan_id: z.coerce.number().int().positive().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/perusahaan — List dengan Pagination, Search & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const {
      page,
      limit,
      search,
      dropdown,
      m_sektor_industri_id,
      m_skala_perusahaan_id,
    } = listQuerySchema.parse(Object.fromEntries(searchParams));

    // ── Mode Dropdown ────────────────────────────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.PERUSAHAAN.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const { hits } = await searchDocuments(
        ELASTIC_INDICES.PERUSAHAAN,
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
    const isFiltered = !!(
      search ||
      m_sektor_industri_id ||
      m_skala_perusahaan_id
    );

    const cacheKey = `${REDIS_KEYS.PERUSAHAAN.ALL}:page:${page}:limit:${limit}:sektor:${m_sektor_industri_id ?? "all"}:skala:${m_skala_perusahaan_id ?? "all"}`;

    // Cek cache hanya untuk query dasar (tanpa search)
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    // Build Elasticsearch query
    const must: Record<string, unknown>[] = [];
    const filter: Record<string, unknown>[] = [];

    if (search) {
      must.push({
        multi_match: {
          query: search,
          fields: ["nama", "nama_kontak"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }

    if (m_sektor_industri_id) {
      filter.push({ term: { m_sektor_industri_id } });
    }

    if (m_skala_perusahaan_id) {
      filter.push({ term: { m_skala_perusahaan_id } });
    }

    const esQuery =
      must.length > 0 || filter.length > 0
        ? {
            bool: {
              must: must.length > 0 ? must : [{ match_all: {} }],
              filter,
            },
          }
        : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.PERUSAHAAN,
      esQuery,
      {
        from: skip,
        size: limit,
        sort: [{ dibuat_pada: { order: "desc" } }],
      },
    );

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache hanya untuk query tanpa filter/search
    if (!isFiltered) {
      await setCache(cacheKey, { data: hits, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/perusahaan — Buat Data Perusahaan
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createPerusahaanSchema.parse(body);

    const newItem = await prisma.m_perusahaan.create({
      data: validatedData,
    });

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(REDIS_KEYS.PERUSAHAAN.ALL_PREFIX);

    return successResponse(newItem, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
