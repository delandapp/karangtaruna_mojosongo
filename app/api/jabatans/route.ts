import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJabatanSchema } from "@/lib/validations/jabatan.schema";
import { paginationSchema } from "@/lib/validations/level.schema"; // Resusing pagination validation
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { redis, getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
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
      const dropdownCacheKey = `${REDIS_KEYS.JABATANS.ALL}:dropdown`;
      const cachedDropdown = await getCache<{ data: any[] }>(dropdownCacheKey);
      if (cachedDropdown) {
        return successResponse(cachedDropdown.data, 200);
      }

      const jabatansResult = await prisma.m_jabatan.findMany({
        select: { id: true, nama_jabatan: true },
        orderBy: { nama_jabatan: "asc" },
      });

      await setCache(dropdownCacheKey, { data: jabatansResult }, DEFAULT_CACHE_TTL);
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
    const cacheKey = `${REDIS_KEYS.JABATANS.ALL}:page:${page}:limit:${limit}`;
    if (!searchQuery) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    // 3. Bangun Query Prisma
    const whereCondition = searchQuery
      ? {
        nama_jabatan: {
          contains: searchQuery,
          mode: "insensitive" as const,
        },
      }
      : {};

    const [jabatans, total] = await Promise.all([
      prisma.m_jabatan.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.m_jabatan.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = {
      page,
      limit,
      total,
      totalPages,
    };

    // 4. Set ke Cache jika bukan query pencarian
    if (!searchQuery) {
      await setCache(cacheKey, { data: jabatans, meta }, DEFAULT_CACHE_TTL);
    }

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

    // 3. Optimasi Cache Beban Server (Invalidation)
    await invalidateCachePrefix(REDIS_KEYS.JABATANS.ALL_PREFIX);
    await invalidateCachePrefix(`${REDIS_KEYS.JABATANS.ALL}:dropdown`);

    // 4. Set individually
    const singleCacheKey = REDIS_KEYS.JABATANS.SINGLE(newJabatan.id);
    await setCache(singleCacheKey, newJabatan, DEFAULT_CACHE_TTL);

    return successResponse(newJabatan, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
