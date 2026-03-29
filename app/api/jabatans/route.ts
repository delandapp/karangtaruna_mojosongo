import { prisma } from "@/lib/prisma";
import { createJabatanSchema } from "@/lib/validations/jabatan.schema";
import { paginationSchema } from "@/lib/validations/level.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { ELASTIC_INDICES } from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/jabatans", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data jabatan.", "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    if (dropdown) {
      const dropdownCacheKey = "jabatan:all:dropdown";
      const cachedDropdown = await getCache<{ data: any[] }>(dropdownCacheKey);
      if (cachedDropdown) {
        return successResponse(cachedDropdown.data, 200);
      }

      const { hits: jabatansResult } = await searchDocuments<{ id: string; nama_jabatan: string }>(
        ELASTIC_INDICES.JABATANS,
        { match_all: {} },
        { size: 10000, sort: [{ nama_jabatan: "asc" }], _source: ["id", "nama_jabatan"] },
      );

      return successResponse(jabatansResult, 200);
    }

    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || undefined;

    // 1. Validasi Query Param
    const {
      page,
      limit,
      search: searchQuery,
    } = paginationSchema.parse({
      page: pageStr,
      limit: limitStr,
      search,
    });

    const skip = (page - 1) * limit;

    // 2. Cek Cache Redis (Hanya berlaku untuk non-search)
    const cacheKey = `jabatan:all:page:${page}:limit:${limit}`;
    if (!searchQuery) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    // 3. Query Elasticsearch
    const esQuery = searchQuery
      ? {
        multi_match: {
          query: searchQuery,
          fields: ["nama_jabatan", "deskripsi_jabatan"],
          type: "best_fields" as const,
          fuzziness: "AUTO" as const,
        },
      }
      : { match_all: {} };

    const { hits: jabatans, total } = await searchDocuments(
      ELASTIC_INDICES.JABATANS,
      esQuery,
      { from: skip, size: limit, sort: [{ createdAt: "desc" }] },
    );

    const totalPages = Math.ceil(total / limit);
    const meta = {
      page,
      limit,
      total,
      totalPages,
    };

    return paginatedResponse(jabatans, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/jabatans", "POST");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membuat data jabatan.", "FORBIDDEN");
    }

    const body = await req.json();

    // 1. Zod Validation
    const validatedData = createJabatanSchema.parse(body);

    // 2. Simpan ke Database
    const newJabatan = await prisma.m_jabatan.create({
      data: {
        nama_jabatan: validatedData.nama_jabatan,
        deskripsi_jabatan: validatedData.deskripsi_jabatan,
      },
    });

    return successResponse(newJabatan, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
