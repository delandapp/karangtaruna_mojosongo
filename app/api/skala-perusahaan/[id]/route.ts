import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSkalaPerusahaanSchema } from "@/lib/validations/perusahaan.schema";
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
// GET /api/skala-perusahaan/:id — Detail Skala Perusahaan
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/skala-perusahaan", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data skala perusahaan.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return errorResponse(400, "ID Skala Perusahaan tidak valid", "BAD_REQUEST");
    }

    // 1. Cek Cache Redis
    const cacheKey = REDIS_KEYS.SKALA_PERUSAHAAN.SINGLE(itemId);
    const cachedItem = await getCache<any>(cacheKey);
    if (cachedItem) {
      return successResponse(cachedItem, 200);
    }

    // 2. Ambil dari database
    const item = await prisma.m_skala_perusahaan.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return errorResponse(404, "Data skala perusahaan tidak ditemukan", "NOT_FOUND");
    }

    // 3. Simpan ke cache
    await setCache(cacheKey, item, DEFAULT_CACHE_TTL);

    return successResponse(item, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/skala-perusahaan/:id — Update Skala Perusahaan
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/skala-perusahaan", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin mengubah data skala perusahaan.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return errorResponse(400, "ID Skala Perusahaan tidak valid", "BAD_REQUEST");
    }

    // 1. Periksa apakah data ada
    const existing = await prisma.m_skala_perusahaan.findUnique({ where: { id: itemId } });
    if (!existing) {
      return errorResponse(404, "Data skala perusahaan tidak ditemukan", "NOT_FOUND");
    }

    const body = await req.json();

    // 2. Validasi Zod
    const validatedData = updateSkalaPerusahaanSchema.parse(body);

    // 3. Cek duplikasi jika nama berubah
    if (validatedData.nama !== existing.nama) {
      const nameExists = await prisma.m_skala_perusahaan.findUnique({
        where: { nama: validatedData.nama }
      });
      if (nameExists) return errorResponse(409, "Nama Skala Perusahaan sudah ada", "CONFLICT");
    }

    // 4. Update ke database
    const updatedItem = await prisma.m_skala_perusahaan.update({
      where: { id: itemId },
      data: validatedData,
    });

    // 5. Sinkronisasi Cache
    const cacheKey = REDIS_KEYS.SKALA_PERUSAHAAN.SINGLE(itemId);
    await setCache(cacheKey, updatedItem, DEFAULT_CACHE_TTL);
    await invalidateCachePrefix(REDIS_KEYS.SKALA_PERUSAHAAN.ALL_PREFIX);

    return successResponse(updatedItem, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/skala-perusahaan/:id — Hapus Skala Perusahaan
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/skala-perusahaan", "DELETE");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin menghapus data skala perusahaan.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return errorResponse(400, "ID Skala Perusahaan tidak valid", "BAD_REQUEST");
    }

    // 1. Periksa apakah data ada
    const existing = await prisma.m_skala_perusahaan.findUnique({ where: { id: itemId } });
    if (!existing) {
      return errorResponse(404, "Data skala perusahaan tidak ditemukan", "NOT_FOUND");
    }

    // 2. Hapus dari database (Prisma mungkin error saat terikat ke Perusahaan)
    await prisma.m_skala_perusahaan.delete({ where: { id: itemId } });

    // 3. Bersihkan cache
    const cacheKey = REDIS_KEYS.SKALA_PERUSAHAAN.SINGLE(itemId);
    await redis.del(cacheKey);
    await invalidateCachePrefix(REDIS_KEYS.SKALA_PERUSAHAAN.ALL_PREFIX);

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
