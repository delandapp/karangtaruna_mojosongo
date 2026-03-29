import { prisma } from "@/lib/prisma";
import { createSektorIndustriSchema } from "@/lib/validations/perusahaan.schema";
import { paginationSchema } from "@/lib/validations/level.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { REDIS_KEYS, ELASTIC_INDICES } from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

// ──────────────────────────────────────────────────────────
// GET /api/sektor-industri — List dengan Pagination & Search & Dropdown
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/sektor-industri", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data sektor industri.", "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.SEKTOR_INDUSTRI.ALL}:dropdown`;
      const cached = await getCache<{ data: any[] }>(cacheKey);
      if (cached) return successResponse(cached.data, 200);

      const result = await searchDocuments(ELASTIC_INDICES.SEKTOR_INDUSTRI,
        { match_all: {} },
        { sort: [{ nama_sektor: { order: "asc" } }], _source: ["id", "nama_sektor"], size: 10000 },
      );
      const items = result.hits;
      return successResponse(items, 200);
    }

    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || undefined;

    // 1. Validasi Query Param
    const { page, limit, search: searchQuery } = paginationSchema.parse({
      page: pageStr,
      limit: limitStr,
      search,
    });

    const skip = (page - 1) * limit;

    // 2. Cek Cache Redis (hanya untuk non-search)
    const cacheKey = `${REDIS_KEYS.SEKTOR_INDUSTRI.ALL}:page:${page}:limit:${limit}`;
    if (!searchQuery) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    // 3. Bangun query Elasticsearch
    const esQuery = searchQuery
      ? {
          multi_match: {
            query: searchQuery,
            fields: ["nama_sektor", "deskripsi_sektor"],
            type: "best_fields" as const,
            fuzziness: "AUTO",
          },
        }
      : { match_all: {} };

    const result = await searchDocuments(ELASTIC_INDICES.SEKTOR_INDUSTRI, esQuery, {
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
// POST /api/sektor-industri — Buat Data Sektor Industri
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/sektor-industri", "POST");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membuat data sektor industri.", "FORBIDDEN");
    }

    const body = await req.json();

    // 1. Validasi Zod
    const validatedData = createSektorIndustriSchema.parse(body);

    // 2. Cek duplikasi
    const exists = await prisma.m_sektor_industri.findUnique({
      where: { nama_sektor: validatedData.nama_sektor },
    });
    if (exists) return errorResponse(409, "Nama Sektor Industri sudah ada", "CONFLICT");

    // 3. Simpan ke database
    const newItem = await prisma.m_sektor_industri.create({
      data: validatedData,
    });

    return successResponse(newItem, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
