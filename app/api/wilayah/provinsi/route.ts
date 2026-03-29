import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { provinsiSchema, wilayahQuerySchema } from "@/lib/validations/wilayah.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { REDIS_KEYS, ELASTIC_INDICES } from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    if (!dropdown) {
      const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/provinsi", "GET");
      if (!hasAccess) {
        return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data provinsi.", "FORBIDDEN");
      }
    }

    if (dropdown) {
      const dropdownCacheKey = `${REDIS_KEYS.PROVINSI.ALL}:dropdown`;
      const cachedDropdown = await getCache<{ data: any[] }>(dropdownCacheKey);
      if (cachedDropdown) {
        return successResponse(cachedDropdown.data, 200);
      }

      const { hits } = await searchDocuments(ELASTIC_INDICES.PROVINSI, { match_all: {} }, {
        size: 10000,
        _source: ["id", "kode_wilayah", "nama"],
        sort: [{ nama: "asc" }],
      });

      return successResponse(hits, 200);
    }

    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || undefined;

    const { page, limit, search: searchQuery } = wilayahQuerySchema.parse({
      page: pageStr,
      limit: limitStr,
      search,
    });

    const skip = (page - 1) * limit;

    const cacheKey = `${REDIS_KEYS.PROVINSI.ALL}:page:${page}:limit:${limit}`;
    if (!searchQuery) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    const esQuery = searchQuery
      ? {
        multi_match: {
          query: searchQuery,
          fields: ["nama", "kode_wilayah"],
          type: "phrase_prefix" as const,
        },
      }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(ELASTIC_INDICES.PROVINSI, esQuery, {
      from: skip,
      size: limit,
      sort: [{ nama: "asc" }],
    });

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/provinsi", "POST");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membuat data provinsi.", "FORBIDDEN");
    }

    const body = await req.json();
    const validatedData = provinsiSchema.parse(body);

    const existing = await prisma.m_provinsi.findUnique({
      where: { kode_wilayah: validatedData.kode_wilayah },
    });

    if (existing) {
      return errorResponse(400, "Kode wilayah provinsi sudah digunakan");
    }

    const newData = await prisma.m_provinsi.create({
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
      },
    });
    return successResponse(newData, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
