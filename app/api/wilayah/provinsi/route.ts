import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { provinsiSchema, wilayahQuerySchema } from "@/lib/validations/wilayah.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { redis, getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
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

      const list = await prisma.m_provinsi.findMany({
        select: { id: true, kode_wilayah: true, nama: true },
        orderBy: { nama: "asc" },
      });

      await setCache(dropdownCacheKey, { data: list }, DEFAULT_CACHE_TTL);
      return successResponse(list, 200);
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

    const whereCondition = searchQuery
      ? {
        OR: [
          { nama: { contains: searchQuery, mode: "insensitive" as const } },
          { kode_wilayah: { contains: searchQuery, mode: "insensitive" as const } },
        ]
      }
      : {};

    const [dataList, total] = await Promise.all([
      prisma.m_provinsi.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { nama: "asc" },
      }),
      prisma.m_provinsi.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    if (!searchQuery) {
      await setCache(cacheKey, { data: dataList, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(dataList, meta, 200);
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

    await invalidateCachePrefix(REDIS_KEYS.PROVINSI.ALL_PREFIX);
    await invalidateCachePrefix(`${REDIS_KEYS.PROVINSI.ALL}:dropdown`);

    const singleCacheKey = REDIS_KEYS.PROVINSI.SINGLE(Number(newData.id));
    await setCache(singleCacheKey, newData, DEFAULT_CACHE_TTL);

    return successResponse(newData, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
