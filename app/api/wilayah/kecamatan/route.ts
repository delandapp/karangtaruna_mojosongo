import { prisma } from "@/lib/prisma";
import {
  kecamatanSchema,
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
// GET /api/wilayah/kecamatan — List dengan Pagination, Search & Dropdown
// Filter opsional: ?m_kota_id=1 atau ?m_provinsi_id=1
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";
    const m_kota_id = searchParams.get("m_kota_id")
      ? parseInt(searchParams.get("m_kota_id")!, 10)
      : undefined;
    const m_provinsi_id = searchParams.get("m_provinsi_id")
      ? parseInt(searchParams.get("m_provinsi_id")!, 10)
      : undefined;

    // ── Mode Dropdown (untuk select input) ───────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.KECAMATAN.ALL}:dropdown:kota:${m_kota_id ?? "all"}:prov:${m_provinsi_id ?? "all"}`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const must: Record<string, unknown>[] = [];
      if (m_kota_id) {
        must.push({ term: { m_kota_id } });
      } else if (m_provinsi_id) {
        must.push({ term: { "m_kota.m_provinsi_id": m_provinsi_id } });
      }

      const esQuery = must.length > 0 ? { bool: { must } } : { match_all: {} };

      const { hits } = await searchDocuments(
        ELASTIC_INDICES.KECAMATAN,
        esQuery,
        {
          size: 10000,
          _source: ["id", "kode_wilayah", "nama", "m_kota_id"],
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
    const isFiltered = !!(search || m_kota_id || m_provinsi_id);

    const cacheKey = `${REDIS_KEYS.KECAMATAN.ALL}:kota:${m_kota_id ?? "all"}:prov:${m_provinsi_id ?? "all"}:page:${page}:limit:${limit}`;

    // Cek cache hanya untuk non-filter
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    // Build Elasticsearch query
    const must: Record<string, unknown>[] = [];
    if (m_kota_id) {
      must.push({ term: { m_kota_id } });
    } else if (m_provinsi_id) {
      must.push({ term: { "m_kota.m_provinsi_id": m_provinsi_id } });
    }
    if (search) {
      must.push({
        multi_match: {
          query: search,
          fields: ["nama", "kode_wilayah"],
          type: "phrase_prefix" as const,
        },
      });
    }

    const esQuery = must.length > 0 ? { bool: { must } } : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.KECAMATAN,
      esQuery,
      {
        from: skip,
        size: limit,
        sort: [{ "nama.keyword": { order: "asc" } }],
      },
    );

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache jika tidak ada filter
    if (!isFiltered) {
      await setCache(cacheKey, { data: hits, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/wilayah/kecamatan — Tambah Kecamatan
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = kecamatanSchema.parse(body);

    // Cek duplikasi kode wilayah
    const existing = await prisma.m_kecamatan.findUnique({
      where: { kode_wilayah: validatedData.kode_wilayah },
      select: { id: true },
    });
    if (existing) {
      return errorResponse(
        409,
        "Kode wilayah kecamatan sudah digunakan",
        "CONFLICT",
      );
    }

    // Verifikasi kota induk
    const kotaExists = await prisma.m_kota.findUnique({
      where: { id: validatedData.m_kota_id },
      select: { id: true },
    });
    if (!kotaExists) {
      return errorResponse(404, "Kota induk tidak ditemukan", "NOT_FOUND");
    }

    const newData = await prisma.m_kecamatan.create({
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
        m_kota_id: validatedData.m_kota_id,
      },
    });

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(REDIS_KEYS.KECAMATAN.ALL_PREFIX);

    return successResponse(newData, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
