import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaUpdateQrCode } from "@/lib/validations/qrcode.schema";

type RouteContext = { params: Promise<{ id: string }> };

// ──────────────────────────────────────────────────────────
// GET /api/qr-code/[id] — Detail QR Code
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    const qrcode = await prisma.m_qr_code.findFirst({
      where: {
        id,
        dihapus_pada: null,
        dibuat_oleh_id: req.user.userId,
      },
    });

    if (!qrcode) {
      return errorResponse(404, "QR Code tidak ditemukan", "NOT_FOUND");
    }

    return successResponse(qrcode);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// PATCH /api/qr-code/[id] — Update QR Code
// ──────────────────────────────────────────────────────────
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    const body = await req.json();
    const parsed = schemaUpdateQrCode.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    // Check ownership & existence
    const existing = await prisma.m_qr_code.findFirst({
      where: {
        id,
        dihapus_pada: null,
        dibuat_oleh_id: req.user.userId,
      },
    });

    if (!existing) {
      return errorResponse(404, "QR Code tidak ditemukan", "NOT_FOUND");
    }

    const updateData = parsed.data;

    const qrcode = await prisma.m_qr_code.update({
      where: { id },
      data: {
        judul: updateData.judul,
        konten: updateData.konten,
        tipe_konten: updateData.tipe_konten,
        warna_depan: updateData.warna_depan,
        warna_belakang: updateData.warna_belakang,
        gaya_titik: updateData.gaya_titik,
        gaya_sudut_luar: updateData.gaya_sudut_luar,
        gaya_sudut_dalam: updateData.gaya_sudut_dalam,
        warna_sudut_luar: updateData.warna_sudut_luar !== undefined ? (updateData.warna_sudut_luar || null) : undefined,
        warna_sudut_dalam: updateData.warna_sudut_dalam !== undefined ? (updateData.warna_sudut_dalam || null) : undefined,
        logo_url: updateData.logo_url !== undefined ? (updateData.logo_url || null) : undefined,
        logo_ukuran: updateData.logo_ukuran,
        logo_margin: updateData.logo_margin,
        logo_hapus_bg: updateData.logo_hapus_bg,
        ukuran: updateData.ukuran,
        margin: updateData.margin,
        level_koreksi: updateData.level_koreksi,
      },
    });

    return successResponse(qrcode);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/qr-code/[id] — Soft Delete QR Code
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    const existing = await prisma.m_qr_code.findFirst({
      where: {
        id,
        dihapus_pada: null,
        dibuat_oleh_id: req.user.userId,
      },
    });

    if (!existing) {
      return errorResponse(404, "QR Code tidak ditemukan", "NOT_FOUND");
    }

    await prisma.m_qr_code.update({
      where: { id },
      data: { dihapus_pada: new Date() },
    });

    return successResponse({ message: "QR Code berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
});
