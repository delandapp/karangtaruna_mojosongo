import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

const getKelurahanCacheKey = (kecamatanKode: string | null) => 
  `wilayah:kelurahan:kecamatan:${kecamatanKode || 'all'}`;

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const kecamatanKode = searchParams.get("kecamatan_kode");

    const cacheKey = getKelurahanCacheKey(kecamatanKode);
    
    // 1. Cek Cache Redis
    const cachedData = await getCache<any[]>(cacheKey);
    if (cachedData) {
       return successResponse(cachedData, 200);
    }

    // 2. Bangun Query
    const whereCondition = kecamatanKode 
      ? { m_kecamatan: { kode_wilayah: kecamatanKode } } 
      : {};

    const kelurahanList = await prisma.m_kelurahan.findMany({
      where: whereCondition,
      orderBy: { nama: 'asc' },
      select: {
         id: true,
         kode_wilayah: true,
         nama: true,
         m_kecamatan_id: true
      }
    });

    // 3. Set Cache 
    await setCache(cacheKey, kelurahanList, DEFAULT_CACHE_TTL);

    return successResponse(kelurahanList, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
