import { prisma } from "@/lib/prisma";
import {
  bulkCreateHakAksesSchema,
  paginationSchema,
} from "@/lib/validations/hak-akses.schema";
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
// GET /api/hak-akses — List dengan Pagination, Search & Dropdown
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, dropdown } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    // ── Mode Dropdown ────────────────────────────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.HAK_AKSES.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const { hits } = await searchDocuments(
        ELASTIC_INDICES.HAK_AKSES,
        { match_all: {} },
        {
          size: 10000,
          sort: [{ endpoint: { order: "asc" } }, { method: { order: "asc" } }],
        },
      );

      await setCache(cacheKey, hits, DEFAULT_CACHE_TTL);
      return successResponse(hits, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const cacheKey = `${REDIS_KEYS.HAK_AKSES.ALL}:page:${page}:limit:${limit}`;

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
            fields: ["nama_fitur", "endpoint"],
            type: "best_fields" as const,
            fuzziness: "AUTO" as const,
          },
        }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.HAK_AKSES,
      esQuery,
      {
        from: skip,
        size: limit,
        sort: [{ endpoint: { order: "asc" } }, { method: { order: "asc" } }],
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
// POST /api/hak-akses — Bulk Create Hak Akses
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = bulkCreateHakAksesSchema.parse(body);

    const insertedRecords = await prisma.$transaction(
      validatedData.map((hakAksesInput) => {
        const { rules, ...hakAksesData } = hakAksesInput;

        return prisma.m_hak_akses.create({
          data: {
            ...hakAksesData,
            rules:
              rules && rules.length > 0
                ? {
                    create: rules.map((r) => ({
                      m_level_id: r.m_level_id,
                      m_jabatan_id: r.m_jabatan_id,
                    })),
                  }
                : undefined,
          },
        });
      }),
    );

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(REDIS_KEYS.HAK_AKSES.ALL_PREFIX);

    return successResponse(insertedRecords, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
