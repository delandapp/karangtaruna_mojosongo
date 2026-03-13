import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePerusahaanSchema } from "@/lib/validations/perusahaan.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix, redis } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

interface RouteProps {
  params: Promise<{ id: string }>;
}

// ──────────────────────────────────────────────────────────
// GET /api/perusahaan/:id — Detail Perusahaan
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/perusahaan", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data perusahaan.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return errorResponse(400, "ID Perusahaan tidak valid", "BAD_REQUEST");
    }

    // 1. Cek Cache Redis
    const cacheKey = REDIS_KEYS.PERUSAHAAN.SINGLE(itemId);
    const cachedItem = await getCache<any>(cacheKey);
    if (cachedItem) {
      return successResponse(cachedItem, 200);
    }

    // 2. Ambil dari database
    const item = await prisma.m_perusahaan.findUnique({
      where: { id: itemId },
      include: {
          sektor: true,
          skala: true,
          m_provinsi: true,
          m_kota: true,
          m_kecamatan: true,
          m_kelurahan: true,
      },
    });

    if (!item) {
      return errorResponse(404, "Data perusahaan tidak ditemukan", "NOT_FOUND");
    }

    // 3. Simpan ke cache
    await setCache(cacheKey, item, DEFAULT_CACHE_TTL);

    return successResponse(item, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/perusahaan/:id — Update Perusahaan
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/perusahaan", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin mengubah data perusahaan.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return errorResponse(400, "ID Perusahaan tidak valid", "BAD_REQUEST");
    }

    // 1. Periksa apakah data ada
    const existing = await prisma.m_perusahaan.findUnique({ where: { id: itemId } });
    if (!existing) {
      return errorResponse(404, "Data perusahaan tidak ditemukan", "NOT_FOUND");
    }

    const body = await req.json();

    // 2. Validasi Zod
    const validatedData = updatePerusahaanSchema.parse(body);

    // 3. Update ke database
    const updatedItem = await prisma.m_perusahaan.update({
      where: { id: itemId },
      data: validatedData,
      include: {
          sektor: true,
          skala: true,
          m_provinsi: true,
          m_kota: true,
          m_kecamatan: true,
          m_kelurahan: true,
      },
    });

    // 4. Sinkronisasi Cache
    const cacheKey = REDIS_KEYS.PERUSAHAAN.SINGLE(itemId);
    await setCache(cacheKey, updatedItem, DEFAULT_CACHE_TTL);
    await invalidateCachePrefix(REDIS_KEYS.PERUSAHAAN.ALL_PREFIX);

    return successResponse(updatedItem, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/perusahaan/:id — Hapus Perusahaan
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/perusahaan", "DELETE");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin menghapus data perusahaan.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return errorResponse(400, "ID Perusahaan tidak valid", "BAD_REQUEST");
    }

    // 1. Periksa apakah data ada
    const existing = await prisma.m_perusahaan.findUnique({ where: { id: itemId } });
    if (!existing) {
      return errorResponse(404, "Data perusahaan tidak ditemukan", "NOT_FOUND");
    }

    // 2. Hapus dari database (akan error/cascade dengan Sponsor tergantung skema)
    await prisma.m_perusahaan.delete({ where: { id: itemId } });

    // 3. Bersihkan cache
    const cacheKey = REDIS_KEYS.PERUSAHAAN.SINGLE(itemId);
    await redis.del(cacheKey);
    await invalidateCachePrefix(REDIS_KEYS.PERUSAHAAN.ALL_PREFIX);

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
