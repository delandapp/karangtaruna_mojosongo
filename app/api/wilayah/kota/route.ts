import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

const getKotaCacheKey = (provinsiKode: string | null) => 
  `wilayah:kota:provinsi:${provinsiKode || 'all'}`;

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const provinsiKode = searchParams.get("provinsi_kode");

    const cacheKey = getKotaCacheKey(provinsiKode);
    
    // 1. Cek Cache Redis
    const cachedData = await getCache<any[]>(cacheKey);
    if (cachedData) {
       return successResponse(cachedData, 200);
    }

    // 2. Bangun Query
    const whereCondition = provinsiKode 
      ? { m_provinsi: { kode_wilayah: provinsiKode } } 
      : {};

    const kotaList = await prisma.m_kota.findMany({
      where: whereCondition,
      orderBy: { nama: 'asc' },
      select: {
         id: true,
         kode_wilayah: true,
         nama: true,
         m_provinsi_id: true
      }
    });

    // 3. Set Cache 
    await setCache(cacheKey, kotaList, DEFAULT_CACHE_TTL);

    return successResponse(kotaList, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
