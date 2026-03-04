import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateJabatanSchema } from "@/lib/validations/jabatan.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix, redis } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const { id } = await props.params;
    const jabatanId = parseInt(id, 10);

    if (isNaN(jabatanId)) {
      return errorResponse(400, "ID Jabatan tidak valid", "BAD_REQUEST");
    }

    const cacheKey = REDIS_KEYS.JABATANS.SINGLE(jabatanId);

    // 1. Cek Cache Redis
    const cachedJabatan = await getCache<any>(cacheKey);
    if (cachedJabatan) {
      return successResponse(cachedJabatan, 200);
    }

    // 2. Ambil dari Database
    const jabatan = await prisma.m_jabatan.findUnique({
      where: { id: jabatanId },
    });

    if (!jabatan) {
      return errorResponse(404, "Jabatan tidak ditemukan", "NOT_FOUND");
    }

    // 3. Simpan ke Cache
    await setCache(cacheKey, jabatan, DEFAULT_CACHE_TTL);

    return successResponse(jabatan, 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, props: RouteProps) {
  try {
    const { id } = await props.params;
    const jabatanId = parseInt(id, 10);
    const body = await req.json();

    if (isNaN(jabatanId)) {
      return errorResponse(400, "ID Jabatan tidak valid", "BAD_REQUEST");
    }

    const validatedData = updateJabatanSchema.parse(body);

    const updatedJabatan = await prisma.m_jabatan.update({
      where: { id: jabatanId },
      data: {
        nama_jabatan: validatedData.nama_jabatan,
        deskripsi_jabatan: validatedData.deskripsi_jabatan,
      },
    });

    // Validasi Sinkronisasi & Optimasi
    const cacheKey = REDIS_KEYS.JABATANS.SINGLE(jabatanId);

    // Update local single id di Redis
    await setCache(cacheKey, updatedJabatan, DEFAULT_CACHE_TTL);

    // Invalidate rekap table master cache
    await invalidateCachePrefix(REDIS_KEYS.JABATANS.ALL_PREFIX);

    return successResponse(updatedJabatan, 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, props: RouteProps) {
  try {
    const { id } = await props.params;
    const jabatanId = parseInt(id, 10);

    if (isNaN(jabatanId)) {
      return errorResponse(400, "ID Jabatan tidak valid", "BAD_REQUEST");
    }

    await prisma.m_jabatan.delete({
      where: { id: jabatanId },
    });

    const cacheKey = REDIS_KEYS.JABATANS.SINGLE(jabatanId);

    await redis.del(cacheKey);
    await invalidateCachePrefix(REDIS_KEYS.JABATANS.ALL_PREFIX);

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
