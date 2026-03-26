import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { kotaSchema } from "@/lib/validations/wilayah.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix, redis } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

export const GET = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kota", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const cacheKey = REDIS_KEYS.KOTA.SINGLE(id);
    const cachedData = await getCache(cacheKey);
    if (cachedData) return successResponse(cachedData, 200);

    const data = await prisma.m_kota.findUnique({
      where: { id },
      include: {
        m_provinsi: { select: { nama: true } }
      }
    });

    if (!data) return errorResponse(404, "Kota tidak ditemukan", "NOT_FOUND");

    await setCache(cacheKey, data, DEFAULT_CACHE_TTL);
    return successResponse(data, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kota", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const body = await req.json();
    const validatedData = kotaSchema.parse(body);

    const existingData = await prisma.m_kota.findUnique({ where: { id } });
    if (!existingData) return errorResponse(404, "Kota tidak ditemukan", "NOT_FOUND");

    // Check kode wilayah uniqueness if changed
    if (existingData.kode_wilayah !== validatedData.kode_wilayah) {
      const codeExists = await prisma.m_kota.findUnique({
        where: { kode_wilayah: validatedData.kode_wilayah },
      });
      if (codeExists) {
        return errorResponse(400, "Kode wilayah kota sudah digunakan");
      }
    }

    const updatedData = await prisma.m_kota.update({
      where: { id },
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
        m_provinsi_id: validatedData.m_provinsi_id,
      },
      include: {
        m_provinsi: { select: { nama: true } }
      }
    });

    await invalidateCachePrefix(REDIS_KEYS.KOTA.ALL_PREFIX);
    await invalidateCachePrefix(`${REDIS_KEYS.KOTA.ALL}:dropdown`);
    
    await invalidateCachePrefix(`${REDIS_KEYS.KECAMATAN.ALL_PREFIX}`);
    await invalidateCachePrefix(`${REDIS_KEYS.KECAMATAN.ALL}:dropdown`);

    const cacheKey = REDIS_KEYS.KOTA.SINGLE(id);
    await setCache(cacheKey, updatedData, DEFAULT_CACHE_TTL);

    return successResponse(updatedData, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kota", "DELETE");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    // Relational check
    const referencedKecamatan = await prisma.m_kecamatan.findFirst({
      where: { m_kota_id: id },
    });
    
    if (referencedKecamatan) {
      return errorResponse(400, "Kota tidak dapat dihapus karena masih menjadi rujukan lokasi kecamatan.");
    }

    await prisma.m_kota.delete({ where: { id } });

    await invalidateCachePrefix(REDIS_KEYS.KOTA.ALL_PREFIX);
    await invalidateCachePrefix(`${REDIS_KEYS.KOTA.ALL}:dropdown`);
    await redis.del(REDIS_KEYS.KOTA.SINGLE(id));

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
