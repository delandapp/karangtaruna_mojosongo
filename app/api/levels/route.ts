import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createLevelSchema,
  paginationSchema,
} from "@/lib/validations/level.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { REDIS_KEYS, ELASTIC_INDICES } from "@/lib/constants";
import { searchDocuments, getDocument } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/levels", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data level.", "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    if (dropdown) {
      const dropdownCacheKey = `${REDIS_KEYS.LEVELS.ALL}:dropdown`;
      const cachedDropdown = await getCache<{ data: any[] }>(dropdownCacheKey);
      if (cachedDropdown) {
        return successResponse(cachedDropdown.data, 200);
      }

      // Fallback to Elasticsearch
      const { hits } = await searchDocuments(
        ELASTIC_INDICES.LEVELS,
        { match_all: {} },
        { size: 1000, sort: [{ id: { order: "asc" } }] },
      );
      return successResponse(hits, 200);
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
    const cacheKey = `${REDIS_KEYS.LEVELS.ALL}:page:${page}:limit:${limit}`;
    if (!searchQuery) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    // 3. Query Elasticsearch
    const query = searchQuery
      ? { multi_match: { query: searchQuery, fields: ["nama_level"] } }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.LEVELS,
      query,
      { from: skip, size: limit, sort: [{ createdAt: { order: "desc" } }] },
    );

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

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/levels", "POST");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membuat data level.", "FORBIDDEN");
    }

    const body = await req.json();

    // 1. Zod Validation
    const validatedData = createLevelSchema.parse(body);

    // 2. Simpan ke Database (CDC → Kafka → ES + Redis)
    const newLevel = await prisma.m_level.create({
      data: {
        nama_level: validatedData.nama_level,
      },
    });

    return successResponse(newLevel, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
