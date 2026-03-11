import { prisma } from "@/lib/prisma";
import { createItemAnggaranSchema } from "@/lib/validations/keuangan.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { paginationSchema } from "@/lib/validations/level.schema";

interface RouteProps {
  params: Promise<{ event_id: string; anggaran_id: string }>;
}

export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, anggaran_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const anggaranId = parseInt(anggaran_id, 10);
    if (isNaN(eventId) || isNaN(anggaranId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const anggaranExists = await prisma.anggaran.findFirst({ where: { id: anggaranId, event_id: eventId }, select: { id: true } });
    if (!anggaranExists) return errorResponse(404, "Anggaran tidak ditemukan", "NOT_FOUND");

    const { searchParams } = new URL(req.url);
    const jenisFilter = searchParams.get("jenis_item") || undefined;
    
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "100",
    });
    const skip = (page - 1) * limit;

    const where: any = { anggaran_id: anggaranId };
    if (jenisFilter) where.jenis_item = jenisFilter;
    const isFiltered = !!jenisFilter;

    // Cache logic for Item Anggaran
    const cacheKey = `event:${eventId}:anggaran:${anggaranId}:item_anggaran:page:${page}:limit:${limit}:jenis:${jenisFilter || "all"}`;
    if (!isFiltered) {
      const cached = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cached) return paginatedResponse(cached.data, cached.meta, 200);
    }

    const [items, total] = await Promise.all([
      prisma.item_anggaran.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ jenis_item: "asc" }, { id: "desc" }],
      }),
      prisma.item_anggaran.count({ where }),
    ]);

    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    if (!isFiltered) await setCache(cacheKey, { data: items, meta }, DEFAULT_CACHE_TTL);
    
    return paginatedResponse(items, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "POST");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, anggaran_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const anggaranId = parseInt(anggaran_id, 10);
    if (isNaN(eventId) || isNaN(anggaranId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const anggaranExists = await prisma.anggaran.findFirst({ where: { id: anggaranId, event_id: eventId }, select: { id: true } });
    if (!anggaranExists) return errorResponse(404, "Anggaran tidak ditemukan", "NOT_FOUND");

    const body = await req.json();
    const data = createItemAnggaranSchema.parse(body);

    const total_rencana = data.jumlah_satuan * data.harga_satuan_rencana;

    const item = await prisma.item_anggaran.create({
      data: {
        anggaran_id: anggaranId,
        jenis_item: data.jenis_item,
        kategori: data.kategori,
        kode_item: data.kode_item,
        deskripsi: data.deskripsi,
        jumlah_satuan: data.jumlah_satuan,
        harga_satuan_rencana: data.harga_satuan_rencana,
        total_rencana: total_rencana,
        catatan: data.catatan,
      },
    });

    // Invalidate anggaran cache
    await invalidateCachePrefix(`event:${eventId}:anggaran`);
    // NOTE: Ideally, also recalculate total_pemasukan/pengeluaran on Anggaran record, but skipping for simplicity or can map via Prisma hook
    
    return successResponse(item, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
