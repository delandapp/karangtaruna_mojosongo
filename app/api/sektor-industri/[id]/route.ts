import { prisma } from "@/lib/prisma";
import { updateSektorIndustriSchema } from "@/lib/validations/perusahaan.schema";
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
// GET /api/sektor-industri/:id — Detail Sektor Industri
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/sektor-industri", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data sektor industri.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return errorResponse(400, "ID Sektor Industri tidak valid", "BAD_REQUEST");
    }

    // 1. Ambil dari Elasticsearch
    const item = await getDocument(ELASTIC_INDICES.SEKTOR_INDUSTRI, String(itemId));

    if (!item) {
      return errorResponse(404, "Data sektor industri tidak ditemukan", "NOT_FOUND");
    }

    return successResponse(item, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/sektor-industri/:id — Update Sektor Industri
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/sektor-industri", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin mengubah data sektor industri.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return errorResponse(400, "ID Sektor Industri tidak valid", "BAD_REQUEST");
    }

    // 1. Periksa apakah data ada
    const existing = await prisma.m_sektor_industri.findUnique({ where: { id: itemId } });
    if (!existing) {
      return errorResponse(404, "Data sektor industri tidak ditemukan", "NOT_FOUND");
    }

    const body = await req.json();

    // 2. Validasi Zod
    const validatedData = updateSektorIndustriSchema.parse(body);

    // 3. Cek duplikasi jika nama berubah
    if (validatedData.nama_sektor !== existing.nama_sektor) {
      const nameExists = await prisma.m_sektor_industri.findUnique({
        where: { nama_sektor: validatedData.nama_sektor }
      });
      if (nameExists) return errorResponse(409, "Nama Sektor Industri sudah ada", "CONFLICT");
    }

    // 4. Update ke database
    const updatedItem = await prisma.m_sektor_industri.update({
      where: { id: itemId },
      data: validatedData,
    });

    return successResponse(updatedItem, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/sektor-industri/:id — Hapus Sektor Industri
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/sektor-industri", "DELETE");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin menghapus data sektor industri.", "FORBIDDEN");
    }

    const { id } = await props.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return errorResponse(400, "ID Sektor Industri tidak valid", "BAD_REQUEST");
    }

    // 1. Periksa apakah data ada
    const existing = await prisma.m_sektor_industri.findUnique({ where: { id: itemId } });
    if (!existing) {
      return errorResponse(404, "Data sektor industri tidak ditemukan", "NOT_FOUND");
    }

    // 2. Hapus dari database (Prisma mungkin error saat terikat ke Perusahaan jika constraint berlaku, ini dihandle catch block by Prisma Error jika constraint Failed)
    await prisma.m_sektor_industri.delete({ where: { id: itemId } });

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
