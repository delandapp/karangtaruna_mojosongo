import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { kecamatanSchema, wilayahQuerySchema } from "@/lib/validations/wilayah.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { Prisma } from "@prisma/client";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    if (!dropdown) {
      const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kecamatan", "GET");
      if (!hasAccess) {
        return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data kecamatan.", "FORBIDDEN");
      }
    }
    const m_kota_id = searchParams.get("m_kota_id");
    const m_provinsi_id = searchParams.get("m_provinsi_id");

    let whereCondition: Prisma.m_kecamatanWhereInput = {};
    
    if (m_kota_id) {
       whereCondition.m_kota_id = parseInt(m_kota_id, 10);
    } else if (m_provinsi_id) {
       whereCondition.m_kota = { m_provinsi_id: parseInt(m_provinsi_id, 10) };
    }

    if (dropdown) {
      const dropdownCacheKey = `${REDIS_KEYS.KECAMATAN.ALL}:dropdown:kota:${m_kota_id || 'all'}:prov:${m_provinsi_id || 'all'}`;
      const cachedDropdown = await getCache<{ data: any[] }>(dropdownCacheKey);
      if (cachedDropdown) {
        return successResponse(cachedDropdown.data, 200);
      }

      const list = await prisma.m_kecamatan.findMany({
        where: whereCondition,
        select: { id: true, kode_wilayah: true, nama: true, m_kota_id: true },
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

    const cacheKey = `${REDIS_KEYS.KECAMATAN.ALL}:kota:${m_kota_id || 'all'}:prov:${m_provinsi_id || 'all'}:page:${page}:limit:${limit}`;
    if (!searchQuery) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    if (searchQuery) {
      whereCondition.OR = [
        { nama: { contains: searchQuery, mode: "insensitive" } },
        { kode_wilayah: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    const [dataList, total] = await Promise.all([
      prisma.m_kecamatan.findMany({
        where: whereCondition,
        include: {
          m_kota: { select: { nama: true, m_provinsi_id: true } }
        },
        skip,
        take: limit,
        orderBy: { nama: "asc" },
      }),
      prisma.m_kecamatan.count({ where: whereCondition }),
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

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kecamatan", "POST");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const body = await req.json();
    const validatedData = kecamatanSchema.parse(body);

    const existing = await prisma.m_kecamatan.findUnique({
      where: { kode_wilayah: validatedData.kode_wilayah },
    });

    if (existing) {
      return errorResponse(400, "Kode wilayah kecamatan sudah digunakan");
    }

    const newData = await prisma.m_kecamatan.create({
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
        m_kota_id: validatedData.m_kota_id,
      },
    });

    await invalidateCachePrefix(REDIS_KEYS.KECAMATAN.ALL_PREFIX);
    await invalidateCachePrefix(`${REDIS_KEYS.KECAMATAN.ALL}:dropdown`);

    const singleCacheKey = REDIS_KEYS.KECAMATAN.SINGLE(Number(newData.id));
    await setCache(singleCacheKey, newData, DEFAULT_CACHE_TTL);

    return successResponse(newData, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
