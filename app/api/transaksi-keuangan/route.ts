import { prisma } from "@/lib/prisma";
import { createTransaksiKeuanganSchema } from "@/lib/validations/keuangan.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { paginationSchema } from "@/lib/validations/level.schema";

function generateNomorTransaksi(jenis: string) {
  const prefix = jenis === "pemasukan" ? "TRXI" : "TRXO";
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const randomStr = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `${prefix}-${dateStr}-${randomStr}`;
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    // Assuming role access is handled under the /api/events/anggaran group for finances
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { searchParams } = new URL(req.url);
    const anggaranId = searchParams.get("anggaran_id");
    const itemAnggaranId = searchParams.get("item_anggaran_id");
    const jenisFilter = searchParams.get("jenis_transaksi") || undefined;
    const statusFilter = searchParams.get("status") || undefined;

    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "100",
    });
    const skip = (page - 1) * limit;

    const where: any = {};
    if (anggaranId) where.anggaran_id = parseInt(anggaranId, 10);
    if (itemAnggaranId) where.item_anggaran_id = parseInt(itemAnggaranId, 10);
    if (jenisFilter) where.jenis_transaksi = jenisFilter;
    if (statusFilter) where.status = statusFilter;

    const isFiltered = !!(anggaranId || itemAnggaranId || jenisFilter || statusFilter);

    const cacheKey = `transaksi_keuangan:all:page:${page}:limit:${limit}:anggaran:${anggaranId || "all"}:item:${itemAnggaranId || "all"}:jenis:${jenisFilter || "all"}:status:${statusFilter || "all"}`;
    if (!isFiltered) {
      const cached = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cached) return paginatedResponse(cached.data, cached.meta, 200);
    }

    const [transaksi_list, total] = await Promise.all([
      prisma.transaksi_keuangan.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ tanggal_transaksi: "desc" }, { id: "desc" }],
        include: {
          dicatat_oleh: { select: { id: true, nama_lengkap: true } },
          disetujui_oleh: { select: { id: true, nama_lengkap: true } },
          anggaran: { select: { id: true, skenario: true, versi: true, event: { select: { nama_event: true } } } },
          item_anggaran: { select: { id: true, deskripsi: true, kategori: true } },
        },
      }),
      prisma.transaksi_keuangan.count({ where }),
    ]);

    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    if (!isFiltered) await setCache(cacheKey, { data: transaksi_list, meta }, DEFAULT_CACHE_TTL);
    
    return paginatedResponse(transaksi_list, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userId, m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "POST");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const body = await req.json();
    const data = createTransaksiKeuanganSchema.parse(body);

    const anggaranExists = await prisma.anggaran.findUnique({ where: { id: data.anggaran_id }, select: { id: true, event_id: true } });
    if (!anggaranExists) return errorResponse(404, "Anggaran tidak ditemukan", "NOT_FOUND");

    if (data.item_anggaran_id) {
      const itemExists = await prisma.item_anggaran.findUnique({ where: { id: data.item_anggaran_id, anggaran_id: data.anggaran_id }, select: { id: true } });
      if (!itemExists) return errorResponse(404, "Item Anggaran tidak valid untuk anggaran ini", "NOT_FOUND");
    }

    const nomor_transaksi = generateNomorTransaksi(data.jenis_transaksi);

    const transaksi = await prisma.transaksi_keuangan.create({
      data: {
        anggaran_id: data.anggaran_id,
        item_anggaran_id: data.item_anggaran_id,
        dicatat_oleh_id: userId,
        nomor_transaksi,
        jenis_transaksi: data.jenis_transaksi,
        jumlah: data.jumlah,
        deskripsi: data.deskripsi,
        bukti_url: data.bukti_url,
        tanggal_transaksi: new Date(data.tanggal_transaksi),
        catatan: data.catatan,
        status: "menunggu_persetujuan",
      },
      include: {
        dicatat_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    await invalidateCachePrefix("transaksi_keuangan");
    await invalidateCachePrefix(`event:${anggaranExists.event_id}:anggaran`);
    
    return successResponse(transaksi, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
