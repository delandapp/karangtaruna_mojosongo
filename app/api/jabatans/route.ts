import { prisma } from "@/lib/prisma";
import { createJabatanSchema } from "@/lib/validations/jabatan.schema";
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
  dropdown: z.coerce.boolean().default(false),
});

// ──────────────────────────────────────────────────────────
// GET /api/jabatans
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, dropdown } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    // ── Mode Dropdown ────────────────────────────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.JABATANS.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const { hits } = await searchDocuments(
        ELASTIC_INDICES.JABATANS,
        { match_all: {} },
        {
          size: 10000,
          sort: [{ nama_jabatan: { order: "asc" } }],
          _source: ["id", "nama_jabatan"],
        },
      );

      await setCache(cacheKey, hits, DEFAULT_CACHE_TTL);
      return successResponse(hits, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const cacheKey = `${REDIS_KEYS.JABATANS.ALL}:page:${page}:limit:${limit}`;

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
            fields: ["nama_jabatan", "deskripsi_jabatan"],
            type: "best_fields" as const,
            fuzziness: "AUTO" as const,
          },
        }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.JABATANS,
      esQuery,
      { from: skip, size: limit, sort: [{ dibuat_pada: { order: "desc" } }] },
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
// POST /api/jabatans
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createJabatanSchema.parse(body);

    const newJabatan = await prisma.m_jabatan.create({
      data: {
        nama_jabatan: validatedData.nama_jabatan,
        deskripsi_jabatan: validatedData.deskripsi_jabatan,
      },
    });

    // Invalidate cache
    await indexDocument(
      ELASTIC_INDICES.JABATANS,
      String(newJabatan.id),
      newJabatan,
    );
    await invalidateCachePrefix(REDIS_KEYS.JABATANS.ALL_PREFIX);
    return successResponse(newJabatan, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
