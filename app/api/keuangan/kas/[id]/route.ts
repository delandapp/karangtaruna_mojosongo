import { prisma } from "@/lib/prisma";
import { updateKasSchema } from "@/lib/validations/keuangan.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { invalidateCachePrefix } from "@/lib/redis";

interface RouteProps {
  params: Promise<{ id: string }>;
}

// ──────────────────────────────────────────────────────────
// GET /api/keuangan/kas/[id] — Detail Transaksi Kas
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const { id: idStr } = await props.params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const record = await prisma.m_kas.findUnique({
      where: { id },
      include: {
        dicatat_oleh: { select: { id: true, nama_lengkap: true } },
        disetujui_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    if (!record) {
      return errorResponse(404, "Transaksi kas tidak ditemukan", "NOT_FOUND");
    }

    return successResponse(record, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/keuangan/kas/[id] — Edit Transaksi Kas
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { userId, m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const { id: idStr } = await props.params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.m_kas.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(404, "Transaksi kas tidak ditemukan", "NOT_FOUND");
    }

    // Hanya ijinkan edit jika status masih 'menunggu_persetujuan', kecuali jika superuser/admin
    const isAdmin = req.user.level === "superuser" || req.user.level === "admin";
    if (existing.status !== "menunggu_persetujuan" && !isAdmin) {
      return errorResponse(400, "Transaksi yang sudah disetujui/ditolak tidak dapat diubah.", "BAD_REQUEST");
    }

    const body = await req.json();
    const data = updateKasSchema.parse(body);

    const updateData: any = {
      jenis_kas: data.jenis_kas,
      sumber_tujuan: data.sumber_tujuan,
      jumlah: data.jumlah,
      deskripsi: data.deskripsi,
      bukti_url: data.bukti_url,
      tanggal: data.tanggal ? new Date(data.tanggal) : undefined,
      catatan: data.catatan,
    };

    // Jika admin memperbarui status secara manual lewat PUT
    if (data.status && data.status !== existing.status && isAdmin) {
      updateData.status = data.status;
      updateData.disetujui_oleh_id = userId;
      updateData.disetujui_pada = new Date();
    }

    const updated = await prisma.m_kas.update({
      where: { id },
      data: updateData,
      include: {
        dicatat_oleh: { select: { id: true, nama_lengkap: true } },
        disetujui_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    // Invalidate caches
    await invalidateCachePrefix("keuangan:kas:*");

    return successResponse(updated, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/keuangan/kas/[id] — Hapus Transaksi Kas
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "DELETE");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const { id: idStr } = await props.params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.m_kas.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(404, "Transaksi kas tidak ditemukan", "NOT_FOUND");
    }

    // Hanya ijinkan hapus jika status masih 'menunggu_persetujuan' (kecuali admin)
    const isAdmin = req.user.level === "superuser" || req.user.level === "admin";
    if (existing.status !== "menunggu_persetujuan" && !isAdmin) {
      return errorResponse(400, "Transaksi yang sudah disetujui/ditolak tidak dapat dihapus.", "BAD_REQUEST");
    }

    await prisma.m_kas.delete({ where: { id } });

    // Invalidate caches
    await invalidateCachePrefix("keuangan:kas:*");

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
