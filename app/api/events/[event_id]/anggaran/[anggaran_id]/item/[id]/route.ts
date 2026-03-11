import { prisma } from "@/lib/prisma";
import { updateItemAnggaranSchema } from "@/lib/validations/keuangan.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

interface RouteProps {
  params: Promise<{ event_id: string; anggaran_id: string; id: string }>;
}

export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, anggaran_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const anggaranId = parseInt(anggaran_id, 10);
    const itemId = parseInt(id, 10);
    
    if (isNaN(eventId) || isNaN(anggaranId) || isNaN(itemId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const cacheKey = `item_anggaran:${itemId}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return successResponse(cached, 200);

    const item = await prisma.item_anggaran.findUnique({
      where: { id: itemId, anggaran_id: anggaranId },
    });

    if (!item) return errorResponse(404, "Item Anggaran tidak ditemukan", "NOT_FOUND");

    await setCache(cacheKey, item, DEFAULT_CACHE_TTL);
    
    return successResponse(item, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "PUT");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, anggaran_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const anggaranId = parseInt(anggaran_id, 10);
    const itemId = parseInt(id, 10);
    
    if (isNaN(eventId) || isNaN(anggaranId) || isNaN(itemId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.item_anggaran.findUnique({ where: { id: itemId, anggaran_id: anggaranId } });
    if (!existing) return errorResponse(404, "Item Anggaran tidak ditemukan", "NOT_FOUND");

    const body = await req.json();
    const data = updateItemAnggaranSchema.parse(body);

    const finalJumlahSatuan = data.jumlah_satuan ?? existing.jumlah_satuan;
    const finalHargaSatuan = data.harga_satuan_rencana !== undefined ? data.harga_satuan_rencana : Number(existing.harga_satuan_rencana);
    const total_rencana = finalJumlahSatuan * finalHargaSatuan;

    const item = await prisma.item_anggaran.update({
      where: { id: itemId },
      data: {
        jenis_item: data.jenis_item,
        kategori: data.kategori,
        kode_item: data.kode_item,
        deskripsi: data.deskripsi,
        jumlah_satuan: data.jumlah_satuan,
        harga_satuan_rencana: data.harga_satuan_rencana,
        total_rencana,
        catatan: data.catatan,
      },
    });

    await invalidateCachePrefix(`event:${eventId}:anggaran`);
    await invalidateCachePrefix(`item_anggaran:${itemId}`);
    return successResponse(item, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "DELETE");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, anggaran_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const anggaranId = parseInt(anggaran_id, 10);
    const itemId = parseInt(id, 10);
    
    if (isNaN(eventId) || isNaN(anggaranId) || isNaN(itemId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const itemExists = await prisma.item_anggaran.findUnique({ where: { id: itemId, anggaran_id: anggaranId }, select: { id: true } });
    if (!itemExists) return errorResponse(404, "Item Anggaran tidak ditemukan", "NOT_FOUND");

    await prisma.item_anggaran.delete({ where: { id: itemId } });

    await invalidateCachePrefix(`event:${eventId}:anggaran`);
    await invalidateCachePrefix(`item_anggaran:${itemId}`);

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
