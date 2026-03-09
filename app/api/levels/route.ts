import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createLevelSchema,
  paginationSchema,
} from "@/lib/validations/level.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { redis, getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
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

      const levelsResult = await prisma.m_level.findMany({
        select: { id: true, nama_level: true },
        orderBy: { nama_level: "asc" },
      });

      await setCache(dropdownCacheKey, { data: levelsResult }, DEFAULT_CACHE_TTL);
      return successResponse(levelsResult, 200);
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
    // Jika ada pencarian, lebih baik tidak di cache untuk membatasi ukuran memory redis key
    const cacheKey = `${REDIS_KEYS.LEVELS.ALL}:page:${page}:limit:${limit}`;
    if (!searchQuery) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    // 3. Bangun Query Prisma
    const whereCondition = searchQuery
      ? {
        nama_level: {
          contains: searchQuery,
          mode: "insensitive" as const,
        },
      }
      : {};

    const [levels, total] = await Promise.all([
      prisma.m_level.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.m_level.count({ where: whereCondition }),
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
      await setCache(cacheKey, { data: levels, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(levels, meta, 200);
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

    // 2. Simpan ke Database
    const newLevel = await prisma.m_level.create({
      data: {
        nama_level: validatedData.nama_level,
      },
    });

    // 3. Optimasi Cache Beban Server (Invalidation)
    // Ketika ada penambahan data baru, invalidate semua cache pagination "master:levels:all:*"
    await invalidateCachePrefix(REDIS_KEYS.LEVELS.ALL_PREFIX);
    await invalidateCachePrefix(`${REDIS_KEYS.LEVELS.ALL}:dropdown`);

    // 4. Kita juga bisa set directly cache untuk master:levels:{id} ini
    const singleCacheKey = REDIS_KEYS.LEVELS.SINGLE(newLevel.id);
    await setCache(singleCacheKey, newLevel, DEFAULT_CACHE_TTL);

    return successResponse(newLevel, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
