import { prisma } from "@/lib/prisma";
import { createRapatSchema } from "@/lib/validations/rapat.schema";
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

import { z } from "zod";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  event_id: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/rapat — List dengan Pagination, Search & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, event_id, status } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    const skip = (page - 1) * limit;
    const isFiltered = !!(event_id || status || search);

    // Cek cache hanya untuk non-filter
    const cacheKey = `${REDIS_KEYS.RAPAT.ALL}:page:${page}:limit:${limit}`;
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
          fields: ["judul", "lokasi", "notulensi"],
          fuzziness: "AUTO",
        },
      });
    }
    if (event_id) filter.push({ term: { event_id } });
    if (status) filter.push({ term: { status } });

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
      ELASTIC_INDICES.RAPAT,
      esQuery,
      {
        from: skip,
        size: limit,
        sort: [{ tanggal_rapat: { order: "desc" } }],
      },
    );

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache hanya untuk query tanpa filter
    if (!isFiltered) {
      await setCache(cacheKey, { data: hits, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/rapat — Buat Rapat Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userId } = req.user;
    const data = createRapatSchema.parse(await req.json());

    // Validasi event_id jika diberikan
    if (data.event_id) {
      const eventExists = await prisma.event.findUnique({
        where: { id: data.event_id },
        select: { id: true },
      });
      if (!eventExists)
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
    }

    const rapat = await prisma.rapat.create({
      data: {
        dibuat_oleh_id: userId,
        event_id: data.event_id,
        judul: data.judul,
        tanggal_rapat: data.tanggal_rapat,
        lokasi: data.lokasi,
        notulensi: data.notulensi,
        status: data.status,
        agenda: data.agenda as any,
        action_items: data.action_items as any,
      },
      include: {
        event: { select: { id: true, nama_event: true, kode_event: true } },
        dibuat_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    // Invalidate cache
    await indexDocument(ELASTIC_INDICES.RAPAT, String(rapat.id), rapat);
    await invalidateCachePrefix(REDIS_KEYS.RAPAT.ALL_PREFIX);
    return successResponse(rapat, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
