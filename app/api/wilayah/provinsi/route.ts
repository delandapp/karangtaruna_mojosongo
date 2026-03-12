import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// Cache key helper for Wilayah
const getProvinsiCacheKey = () => `wilayah:provinsi:all`;

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const cacheKey = getProvinsiCacheKey();
    
    // 1. Cek Cache Redis
    const cachedData = await getCache<any[]>(cacheKey);
    if (cachedData) {
       return successResponse(cachedData, 200);
    }

    // 2. Query ke Database dengan urutan Abjad
    const provinsiList = await prisma.m_provinsi.findMany({
      orderBy: { nama: 'asc' },
      select: {
         id: true,
         kode_wilayah: true,
         nama: true
      }
    });

    // 3. Set Cache 
    await setCache(cacheKey, provinsiList, DEFAULT_CACHE_TTL);

    return successResponse(provinsiList, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
