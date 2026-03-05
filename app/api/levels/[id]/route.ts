import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateLevelSchema } from "@/lib/validations/level.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix, redis } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { id } = await props.params;
    const levelId = parseInt(id, 10);

    if (isNaN(levelId)) {
      return errorResponse(400, "ID Level tidak valid", "BAD_REQUEST");
    }

    const cacheKey = REDIS_KEYS.LEVELS.SINGLE(levelId);

    // 1. Cek Cache Redis
    const cachedLevel = await getCache<any>(cacheKey);
    if (cachedLevel) {
      return successResponse(cachedLevel, 200);
    }

    // 2. Ambil dari Database
    const level = await prisma.m_level.findUnique({
      where: { id: levelId },
    });

    if (!level) {
      return errorResponse(404, "Level tidak ditemukan", "NOT_FOUND");
    }

    // 3. Simpan ke Cache
    await setCache(cacheKey, level, DEFAULT_CACHE_TTL);

    return successResponse(level, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { id } = await props.params;
    const levelId = parseInt(id, 10);
    const body = await req.json();

    if (isNaN(levelId)) {
      return errorResponse(400, "ID Level tidak valid", "BAD_REQUEST");
    }

    const validatedData = updateLevelSchema.parse(body);

    const updatedLevel = await prisma.m_level.update({
      where: { id: levelId },
      data: {
        nama_level: validatedData.nama_level,
      },
    });

    // Validasi Sinkronisasi & Optimasi
    // a. Invalidate list keseluruhan, b. Update existing specific item cache
    const cacheKey = REDIS_KEYS.LEVELS.SINGLE(levelId);

    // Update local single id
    await setCache(cacheKey, updatedLevel, DEFAULT_CACHE_TTL);

    // Invalidate pagination / all keys list
    await invalidateCachePrefix(REDIS_KEYS.LEVELS.ALL_PREFIX);

    return successResponse(updatedLevel, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { id } = await props.params;
    const levelId = parseInt(id, 10);

    if (isNaN(levelId)) {
      return errorResponse(400, "ID Level tidak valid", "BAD_REQUEST");
    }

    await prisma.m_level.delete({
      where: { id: levelId },
    });

    const cacheKey = REDIS_KEYS.LEVELS.SINGLE(levelId);

    // Hapus single cache specific
    await redis.del(cacheKey);
    // Invalidate rekap table master cache
    await invalidateCachePrefix(REDIS_KEYS.LEVELS.ALL_PREFIX);

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
