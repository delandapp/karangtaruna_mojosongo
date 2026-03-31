import { prisma } from "@/lib/prisma";
import {
  provinsiSchema,
  wilayahQuerySchema,
} from "@/lib/validations/wilayah.schema";
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

// ──────────────────────────────────────────────────────────
// GET /api/wilayah/provinsi — List dengan Pagination, Search & Dropdown
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    // ── Mode Dropdown (untuk select input) ───────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.PROVINSI.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const { hits } = await searchDocuments(
        ELASTIC_INDICES.PROVINSI,
        { match_all: {} },
        {
          size: 10000,
          _source: ["id", "kode_wilayah", "nama"],
          sort: [{ "nama.keyword": { order: "asc" } }],
        },
      );

      await setCache(cacheKey, hits, DEFAULT_CACHE_TTL);
      return successResponse(hits, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const { page, limit, search } = wilayahQuerySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
    });

    const skip = (page - 1) * limit;
    const cacheKey = `${REDIS_KEYS.PROVINSI.ALL}:page:${page}:limit:${limit}`;

    // Cek cache hanya untuk non-search
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
            fields: ["nama", "kode_wilayah"],
            type: "phrase_prefix" as const,
          },
        }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.PROVINSI,
      esQuery,
      {
        from: skip,
        size: limit,
        sort: [{ "nama.keyword": { order: "asc" } }],
      },
    );

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache jika bukan pencarian
    if (!search) {
      await setCache(cacheKey, { data: hits, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/wilayah/provinsi — Tambah Provinsi
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = provinsiSchema.parse(body);

    const existing = await prisma.m_provinsi.findUnique({
      where: { kode_wilayah: validatedData.kode_wilayah },
      select: { id: true },
    });
    if (existing) {
      return errorResponse(
        409,
        "Kode wilayah provinsi sudah digunakan",
        "CONFLICT",
      );
    }

    const newData = await prisma.m_provinsi.create({
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
      },
    });

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(REDIS_KEYS.PROVINSI.ALL_PREFIX);

    return successResponse(newData, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
