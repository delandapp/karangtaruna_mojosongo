import { prisma } from "@/lib/prisma";
import { updateSkalaPerusahaanSchema } from "@/lib/validations/perusahaan.schema";
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

    // 1. Ambil dari Elasticsearch
    const item = await getDocument(ELASTIC_INDICES.SKALA_PERUSAHAAN, String(itemId));

    if (!item) {
      return errorResponse(404, "Data skala perusahaan tidak ditemukan", "NOT_FOUND");
    }

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

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
