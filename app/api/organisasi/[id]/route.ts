import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateOrganisasiSchema } from "@/lib/validations/organisasi.schema";
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
// GET /api/organisasi/:id — Detail Organisasi
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/organisasi", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data organisasi.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const organisasiId = parseInt(id, 10);

    if (isNaN(organisasiId)) {
      return errorResponse(400, "ID Organisasi tidak valid", "BAD_REQUEST");
    }

    // 1. Cek Cache Redis
    const cacheKey = REDIS_KEYS.ORGANISASI.SINGLE(organisasiId);
    const cachedOrganisasi = await getCache<any>(cacheKey);
    if (cachedOrganisasi) {
      return successResponse(cachedOrganisasi, 200);
    }

    // 2. Ambil dari database
    const organisasi = await prisma.m_organisasi.findUnique({
      where: { id: organisasiId },
    });

    if (!organisasi) {
      return errorResponse(404, "Data organisasi tidak ditemukan", "NOT_FOUND");
    }

    // 3. Simpan ke cache
    await setCache(cacheKey, organisasi, DEFAULT_CACHE_TTL);

    return successResponse(organisasi, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/organisasi/:id — Update Organisasi
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/organisasi", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin mengubah data organisasi.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const organisasiId = parseInt(id, 10);

    if (isNaN(organisasiId)) {
      return errorResponse(400, "ID Organisasi tidak valid", "BAD_REQUEST");
    }

    // 1. Periksa apakah data ada
    const existing = await prisma.m_organisasi.findUnique({ where: { id: organisasiId } });
    if (!existing) {
      return errorResponse(404, "Data organisasi tidak ditemukan", "NOT_FOUND");
    }

    const body = await req.json();

    // 2. Validasi Zod
    const validatedData = updateOrganisasiSchema.parse(body);

    // 3. Update ke database
    const updatedOrganisasi = await prisma.m_organisasi.update({
      where: { id: organisasiId },
      data: {
        nama_org: validatedData.nama_org,
        kelurahan: validatedData.kelurahan,
        kecamatan: validatedData.kecamatan,
        kota: validatedData.kota,
        provinsi: validatedData.provinsi,
        no_handphone: validatedData.no_handphone,
        email: validatedData.email,
        alamat: validatedData.alamat,
        logo_url: validatedData.logo_url,
        visi: validatedData.visi,
        misi: validatedData.misi,
        media_sosial: validatedData.media_sosial ?? undefined,
      },
    });

    // 4. Sinkronisasi Cache
    const cacheKey = REDIS_KEYS.ORGANISASI.SINGLE(organisasiId);
    await setCache(cacheKey, updatedOrganisasi, DEFAULT_CACHE_TTL);
    await invalidateCachePrefix(REDIS_KEYS.ORGANISASI.ALL_PREFIX);

    return successResponse(updatedOrganisasi, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/organisasi/:id — Hapus Organisasi
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/organisasi", "DELETE");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin menghapus data organisasi.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const organisasiId = parseInt(id, 10);

    if (isNaN(organisasiId)) {
      return errorResponse(400, "ID Organisasi tidak valid", "BAD_REQUEST");
    }

    // 1. Periksa apakah data ada
    const existing = await prisma.m_organisasi.findUnique({ where: { id: organisasiId } });
    if (!existing) {
      return errorResponse(404, "Data organisasi tidak ditemukan", "NOT_FOUND");
    }

    // 2. Hapus dari database
    await prisma.m_organisasi.delete({ where: { id: organisasiId } });

    // 3. Bersihkan cache
    const cacheKey = REDIS_KEYS.ORGANISASI.SINGLE(organisasiId);
    await redis.del(cacheKey);
    await invalidateCachePrefix(REDIS_KEYS.ORGANISASI.ALL_PREFIX);

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
