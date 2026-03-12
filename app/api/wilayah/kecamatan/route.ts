import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

const getKecamatanCacheKey = (kotaKode: string | null) => 
  `wilayah:kecamatan:kota:${kotaKode || 'all'}`;

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const kotaKode = searchParams.get("kota_kode");

    const cacheKey = getKecamatanCacheKey(kotaKode);
    
    // 1. Cek Cache Redis
    const cachedData = await getCache<any[]>(cacheKey);
    if (cachedData) {
       return successResponse(cachedData, 200);
    }

    // 2. Bangun Query
    const whereCondition = kotaKode 
      ? { m_kota: { kode_wilayah: kotaKode } } 
      : {};

    const kecamatanList = await prisma.m_kecamatan.findMany({
      where: whereCondition,
      orderBy: { nama: 'asc' },
      select: {
         id: true,
         kode_wilayah: true,
         nama: true,
         m_kota_id: true
      }
    });

    // 3. Set Cache 
    await setCache(cacheKey, kecamatanList, DEFAULT_CACHE_TTL);

    return successResponse(kecamatanList, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
