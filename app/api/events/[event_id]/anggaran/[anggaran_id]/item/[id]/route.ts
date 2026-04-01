import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { prisma } from "@/lib/prisma";
import { updateItemAnggaranSchema } from "@/lib/validations/keuangan.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = {
  params: Promise<{ event_id: string; anggaran_id: string; id: string }>;
};

const parseIds = (
  event_id: string,
  anggaran_id: string,
  id: string,
): { eventId: number; anggaranId: number; itemId: number } | null => {
  const eventId = parseInt(event_id, 10);
  const anggaranId = parseInt(anggaran_id, 10);
  const itemId = parseInt(id, 10);
  if (
    isNaN(eventId) ||
    eventId <= 0 ||
    isNaN(anggaranId) ||
    anggaranId <= 0 ||
    isNaN(itemId) ||
    itemId <= 0
  )
    return null;
  return { eventId, anggaranId, itemId };
};

const CACHE_KEY = (itemId: number) => `item_anggaran:${itemId}`;
const CACHE_INVALIDATE_PREFIX = (eventId: number, anggaranId: number) =>
  `event:${eventId}:anggaran:${anggaranId}:item:*`;

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/anggaran/:anggaran_id/item/:id
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, anggaran_id, id } = await params;
      const ids = parseIds(event_id, anggaran_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { anggaranId, itemId } = ids;

      // 1. Cek Redis cache
      const cacheKey = CACHE_KEY(itemId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari database
      const item = await prisma.item_anggaran.findUnique({
        where: { id: itemId, anggaran_id: anggaranId },
      });
      if (!item)
        return errorResponse(404, "Item Anggaran tidak ditemukan", "NOT_FOUND");

      // 3. Simpan ke cache
      await setCache(cacheKey, item, DEFAULT_CACHE_TTL);

      return successResponse(item, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/events/:event_id/anggaran/:anggaran_id/item/:id
// total_rencana dihitung ulang otomatis jika jumlah/harga berubah.
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, anggaran_id, id } = await params;
      const ids = parseIds(event_id, anggaran_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, anggaranId, itemId } = ids;

      const existing = await prisma.item_anggaran.findUnique({
        where: { id: itemId, anggaran_id: anggaranId },
      });
      if (!existing)
        return errorResponse(404, "Item Anggaran tidak ditemukan", "NOT_FOUND");

      const body = await req.json();
      const data = updateItemAnggaranSchema.parse(body);

      // Hitung ulang total_rencana jika jumlah atau harga berubah
      const finalJumlahSatuan = data.jumlah_satuan ?? existing.jumlah_satuan;
      const finalHargaSatuan =
        data.harga_satuan_rencana !== undefined
          ? data.harga_satuan_rencana
          : Number(existing.harga_satuan_rencana);
      const total_rencana = finalJumlahSatuan * finalHargaSatuan;

      const updated = await prisma.item_anggaran.update({
        where: { id: itemId },
        data: {
          jenis_item: data.jenis_item,
          kategori: data.kategori,
          kode_item: data.kode_item,
          deskripsi: data.deskripsi,
          jumlah_satuan: data.jumlah_satuan,
          harga_satuan_rencana: data.harga_satuan_rencana,
          total_rencana,
          total_realisasi: data.total_realisasi,
          catatan: data.catatan,
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(CACHE_KEY(itemId));
      await invalidateCachePrefix(CACHE_INVALIDATE_PREFIX(eventId, anggaranId));

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/events/:event_id/anggaran/:anggaran_id/item/:id
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, anggaran_id, id } = await params;
      const ids = parseIds(event_id, anggaran_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, anggaranId, itemId } = ids;

      const existing = await prisma.item_anggaran.findUnique({
        where: { id: itemId, anggaran_id: anggaranId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Item Anggaran tidak ditemukan", "NOT_FOUND");

      await prisma.item_anggaran.delete({ where: { id: itemId } });

      // Invalidate cache
      await invalidateCachePrefix(CACHE_KEY(itemId));
      await invalidateCachePrefix(CACHE_INVALIDATE_PREFIX(eventId, anggaranId));

      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
