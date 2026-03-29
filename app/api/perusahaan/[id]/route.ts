import { prisma } from "@/lib/prisma";
import { updatePerusahaanSchema } from "@/lib/validations/perusahaan.schema";
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

    // 1. Ambil dari Elasticsearch
    const item = await getDocument(ELASTIC_INDICES.PERUSAHAAN, String(itemId));

    if (!item) {
      return errorResponse(404, "Data perusahaan tidak ditemukan", "NOT_FOUND");
    }

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

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
