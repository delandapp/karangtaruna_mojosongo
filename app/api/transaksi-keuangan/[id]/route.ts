import { prisma } from "@/lib/prisma";
import { updateTransaksiKeuanganSchema } from "@/lib/validations/keuangan.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { id: idStr } = await props.params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const cacheKey = `transaksi_keuangan:${id}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return successResponse(cached, 200);

    const transaksi = await prisma.transaksi_keuangan.findUnique({
      where: { id },
      include: {
        dicatat_oleh: { select: { id: true, nama_lengkap: true } },
        disetujui_oleh: { select: { id: true, nama_lengkap: true } },
        anggaran: { select: { id: true, skenario: true, versi: true, event: { select: { nama_event: true } } } },
        item_anggaran: { select: { id: true, deskripsi: true, kategori: true } },
      },
    });

    if (!transaksi) return errorResponse(404, "Transaksi tidak ditemukan", "NOT_FOUND");

    await setCache(cacheKey, transaksi, DEFAULT_CACHE_TTL);
    
    return successResponse(transaksi, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { userId, m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "PUT");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { id: idStr } = await props.params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.transaksi_keuangan.findUnique({
      where: { id },
      include: { anggaran: { select: { event_id: true } } }
    });
    if (!existing) return errorResponse(404, "Transaksi tidak ditemukan", "NOT_FOUND");

    const body = await req.json();
    const data = updateTransaksiKeuanganSchema.parse(body);

    // Validation for item_anggaran_id matching
    if (data.item_anggaran_id) {
      const itemExists = await prisma.item_anggaran.findUnique({
        where: { id: data.item_anggaran_id, anggaran_id: existing.anggaran_id },
        select: { id: true }
      });
      if (!itemExists) return errorResponse(404, "Item Anggaran tidak valid untuk transaksi ini", "NOT_FOUND");
    }

    const updateData: any = {
      item_anggaran_id: data.item_anggaran_id !== undefined ? data.item_anggaran_id : existing.item_anggaran_id,
      jenis_transaksi: data.jenis_transaksi,
      jumlah: data.jumlah,
      deskripsi: data.deskripsi,
      bukti_url: data.bukti_url,
      tanggal_transaksi: data.tanggal_transaksi ? new Date(data.tanggal_transaksi) : undefined,
      catatan: data.catatan,
    };

    // If status is updated to 'disetujui' or 'dibayar', record approver
    if (data.status && data.status !== existing.status) {
      updateData.status = data.status;
      if (['disetujui', 'dibayar', 'ditolak'].includes(data.status)) {
        updateData.disetujui_oleh_id = userId;
        updateData.disetujui_pada = new Date();
      }
    }

    const transaksi = await prisma.transaksi_keuangan.update({
      where: { id },
      data: updateData,
      include: {
        dicatat_oleh: { select: { id: true, nama_lengkap: true } },
        disetujui_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    await invalidateCachePrefix("transaksi_keuangan");
    await invalidateCachePrefix(`transaksi_keuangan:${id}`);
    await invalidateCachePrefix(`event:${existing.anggaran.event_id}:anggaran`);

    // NOTE: Ideally trigger recalculation of total_pemasukan_realisasi / pengeluaran_realisasi here using Prisma hooks or raw aggregation queries.
    
    return successResponse(transaksi, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "DELETE");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { id: idStr } = await props.params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.transaksi_keuangan.findUnique({
      where: { id },
      include: { anggaran: { select: { event_id: true } } }
    });
    if (!existing) return errorResponse(404, "Transaksi tidak ditemukan", "NOT_FOUND");

    await prisma.transaksi_keuangan.delete({ where: { id } });

    await invalidateCachePrefix("transaksi_keuangan");
    await invalidateCachePrefix(`transaksi_keuangan:${id}`);
    await invalidateCachePrefix(`event:${existing.anggaran.event_id}:anggaran`);

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
