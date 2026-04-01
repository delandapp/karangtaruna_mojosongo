import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { prisma } from "@/lib/prisma";
import { updateAnggaranSchema } from "@/lib/validations/anggaran.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = {
  params: Promise<{ event_id: string; anggaran_id: string }>;
};

const parseIds = (
  event_id: string,
  anggaran_id: string,
): { eventId: number; anggaranId: number } | null => {
  const eventId = parseInt(event_id, 10);
  const anggaranId = parseInt(anggaran_id, 10);
  if (isNaN(eventId) || eventId <= 0 || isNaN(anggaranId) || anggaranId <= 0)
    return null;
  return { eventId, anggaranId };
};

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/anggaran/:anggaran_id — Detail Anggaran
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, anggaran_id } = await params;
      const ids = parseIds(event_id, anggaran_id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, anggaranId } = ids;

      // 1. Cek Redis cache
      const cacheKey = REDIS_KEYS.ANGGARAN.SINGLE(eventId, anggaranId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari database
      const anggaran = await prisma.anggaran.findFirst({
        where: { id: anggaranId, event_id: eventId },
        include: {
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
          disetujui_oleh: { select: { id: true, nama_lengkap: true } },
          item_anggaran: true,
        },
      });
      if (!anggaran)
        return errorResponse(404, "Data anggaran tidak ditemukan", "NOT_FOUND");

      // 3. Simpan ke cache
      await setCache(cacheKey, anggaran, DEFAULT_CACHE_TTL);

      return successResponse(anggaran, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/events/:event_id/anggaran/:anggaran_id — Update Anggaran
// Jika status berubah menjadi 'disetujui', set disetujui_oleh_id otomatis.
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { userId } = req.user;
      const { event_id, anggaran_id } = await params;
      const ids = parseIds(event_id, anggaran_id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, anggaranId } = ids;

      const existing = await prisma.anggaran.findFirst({
        where: { id: anggaranId, event_id: eventId },
      });
      if (!existing)
        return errorResponse(404, "Data anggaran tidak ditemukan", "NOT_FOUND");

      const body = await req.json();
      const data = updateAnggaranSchema.parse(body);

      // Auto-set disetujui_oleh_id saat status pertama kali disetujui
      let disetujui_oleh_id = existing.disetujui_oleh_id;
      let disetujui_pada = existing.disetujui_pada;

      if (data.status === "disetujui" && existing.status !== "disetujui") {
        disetujui_oleh_id = userId;
        disetujui_pada = new Date();
      } else if (
        data.status &&
        data.status !== "disetujui" &&
        data.status !== "final"
      ) {
        // Reset persetujuan jika dikembalikan ke status sebelumnya
        disetujui_oleh_id = null;
        disetujui_pada = null;
      }

      const updated = await prisma.anggaran.update({
        where: { id: anggaranId },
        data: { ...data, disetujui_oleh_id, disetujui_pada },
        include: {
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
          disetujui_oleh: { select: { id: true, nama_lengkap: true } },
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(
        REDIS_KEYS.ANGGARAN.SINGLE(eventId, anggaranId),
      );
      await invalidateCachePrefix(REDIS_KEYS.ANGGARAN.ALL_PREFIX(eventId));

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/events/:event_id/anggaran/:anggaran_id — Hapus Anggaran
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, anggaran_id } = await params;
      const ids = parseIds(event_id, anggaran_id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, anggaranId } = ids;

      const existing = await prisma.anggaran.findFirst({
        where: { id: anggaranId, event_id: eventId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Data anggaran tidak ditemukan", "NOT_FOUND");

      await prisma.anggaran.delete({ where: { id: anggaranId } });

      // Invalidate cache
      await invalidateCachePrefix(
        REDIS_KEYS.ANGGARAN.SINGLE(eventId, anggaranId),
      );
      await invalidateCachePrefix(REDIS_KEYS.ANGGARAN.ALL_PREFIX(eventId));

      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
