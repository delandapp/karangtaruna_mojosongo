import { prisma } from "@/lib/prisma";
import { createPerusahaanSchema } from "@/lib/validations/perusahaan.schema";
import { paginationSchema } from "@/lib/validations/level.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { REDIS_KEYS, ELASTIC_INDICES } from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

// ──────────────────────────────────────────────────────────
// GET /api/perusahaan — List dengan Pagination & Search & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/perusahaan", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data perusahaan.", "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.PERUSAHAAN.ALL}:dropdown`;
      const cached = await getCache<{ data: any[] }>(cacheKey);
      if (cached) return successResponse(cached.data, 200);

      const result = await searchDocuments(ELASTIC_INDICES.PERUSAHAAN,
        { match_all: {} },
        { sort: [{ nama: { order: "asc" } }], _source: ["id", "nama"], size: 10000 },
      );
      const items = result.hits;
      return successResponse(items, 200);
    }

    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || undefined;
    
    // Custom filters
    const m_sektor_industri_id = searchParams.get("m_sektor_industri_id");
    const m_skala_perusahaan_id = searchParams.get("m_skala_perusahaan_id");

    // 1. Validasi Query Param
    const { page, limit, search: searchQuery } = paginationSchema.parse({
      page: pageStr,
      limit: limitStr,
      search,
    });

    const skip = (page - 1) * limit;

    // 2. Cek Cache Redis (hanya untuk non-search & non-filter)
    const isBasicQuery = !searchQuery && !m_sektor_industri_id && !m_skala_perusahaan_id;
    const cacheKey = `${REDIS_KEYS.PERUSAHAAN.ALL}:page:${page}:limit:${limit}:sektor:${m_sektor_industri_id || 'all'}:skala:${m_skala_perusahaan_id || 'all'}`;
    
    // Untuk cache yang lebih pintar karena filternya kompleks:
    if (isBasicQuery) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    // 3. Bangun query Elasticsearch
    const must: any[] = [];
    const filter: any[] = [];

    if (searchQuery) {
      must.push({
        multi_match: {
          query: searchQuery,
          fields: ["nama", "nama_kontak"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }
    if (m_sektor_industri_id) {
      filter.push({ term: { m_sektor_industri_id: parseInt(m_sektor_industri_id, 10) } });
    }
    if (m_skala_perusahaan_id) {
      filter.push({ term: { m_skala_perusahaan_id: parseInt(m_skala_perusahaan_id, 10) } });
    }

    const esQuery = must.length > 0 || filter.length > 0
      ? { bool: { must: must.length > 0 ? must : [{ match_all: {} }], filter } }
      : { match_all: {} };

    const result = await searchDocuments(ELASTIC_INDICES.PERUSAHAAN, esQuery, {
      from: skip,
      size: limit,
      sort: [{ dibuat_pada: { order: "desc" } }],
    });

    const total = result.total;
    const items = result.hits;
    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    return paginatedResponse(items, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/perusahaan — Buat Data Perusahaan
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/perusahaan", "POST");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membuat data perusahaan.", "FORBIDDEN");
    }

    const body = await req.json();

    // 1. Validasi Zod
    const validatedData = createPerusahaanSchema.parse(body);

    // 2. Simpan ke database
    const newItem = await prisma.m_perusahaan.create({
      data: validatedData,
    });

    return successResponse(newItem, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
