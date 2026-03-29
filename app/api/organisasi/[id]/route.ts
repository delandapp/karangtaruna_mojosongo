import { prisma } from "@/lib/prisma";
import { updateOrganisasiSchema } from "@/lib/validations/organisasi.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { ELASTIC_INDICES } from "@/lib/constants";
import { getDocument } from "@/lib/elasticsearch";
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

    // 1. Ambil dari Elasticsearch
    const organisasi = await getDocument(ELASTIC_INDICES.ORGANISASI, String(organisasiId));

    if (!organisasi) {
      return errorResponse(404, "Data organisasi tidak ditemukan", "NOT_FOUND");
    }

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
        kode_wilayah_induk_kelurahan: validatedData.kode_wilayah_induk_kelurahan,
        kode_wilayah_induk_kecamatan: validatedData.kode_wilayah_induk_kecamatan,
        kode_wilayah_induk_kota: validatedData.kode_wilayah_induk_kota,
        kode_wilayah_induk_provinsi: validatedData.kode_wilayah_induk_provinsi,
        no_handphone: validatedData.no_handphone,
        email: validatedData.email,
        alamat: validatedData.alamat,
        logo_url: validatedData.logo_url,
        visi: validatedData.visi,
        misi: validatedData.misi,
        media_sosial: validatedData.media_sosial ?? undefined,
      },
    });

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

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
