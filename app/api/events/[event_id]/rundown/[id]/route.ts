import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { prisma } from "@/lib/prisma";
import { updateRundownSchema } from "@/lib/validations/rundown.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = { params: Promise<{ event_id: string; id: string }> };

const parseIds = (
  event_id: string,
  id: string,
): { eventId: number; rundownId: number } | null => {
  const eventId = parseInt(event_id, 10);
  const rundownId = parseInt(id, 10);
  if (isNaN(eventId) || eventId <= 0 || isNaN(rundownId) || rundownId <= 0)
    return null;
  return { eventId, rundownId };
};

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/rundown/:id — Detail Item Rundown
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, id } = await params;
      const ids = parseIds(event_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, rundownId } = ids;

      // 1. Cek Redis cache
      const cacheKey = REDIS_KEYS.RUNDOWN.SINGLE(eventId, rundownId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari database
      const rundown = await prisma.rundown_acara.findFirst({
        where: { id: rundownId, event_id: eventId },
        include: {
          pic: { select: { id: true, nama_lengkap: true } },
        },
      });
      if (!rundown)
        return errorResponse(404, "Data rundown tidak ditemukan", "NOT_FOUND");

      // 3. Simpan ke cache
      await setCache(cacheKey, rundown, DEFAULT_CACHE_TTL);

      return successResponse(rundown, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/events/:event_id/rundown/:id — Update Item Rundown
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, id } = await params;
      const ids = parseIds(event_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, rundownId } = ids;

      const existing = await prisma.rundown_acara.findFirst({
        where: { id: rundownId, event_id: eventId },
        select: { id: true, waktu_mulai: true, waktu_selesai: true },
      });
      if (!existing)
        return errorResponse(404, "Data rundown tidak ditemukan", "NOT_FOUND");

      const data = updateRundownSchema.parse(await req.json());

      // Validasi konsistensi waktu
      const waktuMulai = data.waktu_mulai ?? existing.waktu_mulai;
      const waktuSelesai = data.waktu_selesai ?? existing.waktu_selesai;
      if (waktuSelesai < waktuMulai) {
        return errorResponse(
          400,
          "Waktu selesai tidak boleh sebelum waktu mulai",
          "VALIDATION_ERROR",
        );
      }

      const updated = await prisma.rundown_acara.update({
        where: { id: rundownId },
        data,
        include: {
          pic: { select: { id: true, nama_lengkap: true } },
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(
        REDIS_KEYS.RUNDOWN.SINGLE(eventId, rundownId),
      );
      await invalidateCachePrefix(REDIS_KEYS.RUNDOWN.ALL_PREFIX(eventId));

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/events/:event_id/rundown/:id — Hapus Item Rundown
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, id } = await params;
      const ids = parseIds(event_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, rundownId } = ids;

      const existing = await prisma.rundown_acara.findFirst({
        where: { id: rundownId, event_id: eventId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Data rundown tidak ditemukan", "NOT_FOUND");

      await prisma.rundown_acara.delete({ where: { id: rundownId } });

      // Invalidate cache
      await invalidateCachePrefix(
        REDIS_KEYS.RUNDOWN.SINGLE(eventId, rundownId),
      );
      await invalidateCachePrefix(REDIS_KEYS.RUNDOWN.ALL_PREFIX(eventId));

      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
