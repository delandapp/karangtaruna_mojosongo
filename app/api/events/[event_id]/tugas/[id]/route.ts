import { prisma } from "@/lib/prisma";
import { updateTugasSchema } from "@/lib/validations/tugas.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";

type RouteProps = { params: Promise<{ event_id: string; id: string }> };

const parseIds = (
  event_id: string,
  id: string,
): { eventId: number; tugasId: number } | null => {
  const eventId = parseInt(event_id, 10);
  const tugasId = parseInt(id, 10);
  if (isNaN(eventId) || eventId <= 0 || isNaN(tugasId) || tugasId <= 0)
    return null;
  return { eventId, tugasId };
};

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/tugas/:id — Detail Tugas
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, id } = await params;
      const ids = parseIds(event_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, tugasId } = ids;

      // 1. Cek Redis cache
      const cacheKey = REDIS_KEYS.TUGAS.SINGLE(eventId, tugasId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari database
      const tugas = await prisma.tugas_event.findFirst({
        where: { id: tugasId, event_id: eventId },
        include: {
          ditugaskan_ke: { select: { id: true, nama_lengkap: true } },
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
          parent_tugas: { select: { id: true, nama_tugas: true } },
          sub_tugas: {
            select: {
              id: true,
              nama_tugas: true,
              status: true,
              prioritas: true,
              ditugaskan_ke_id: true,
            },
          },
        },
      });

      if (!tugas)
        return errorResponse(404, "Tugas tidak ditemukan", "NOT_FOUND");

      // 3. Simpan ke cache
      await setCache(cacheKey, tugas, DEFAULT_CACHE_TTL);

      return successResponse(tugas, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/events/:event_id/tugas/:id — Update Tugas
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, id } = await params;
      const ids = parseIds(event_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, tugasId } = ids;

      const existing = await prisma.tugas_event.findFirst({
        where: { id: tugasId, event_id: eventId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Tugas tidak ditemukan", "NOT_FOUND");

      const data = updateTugasSchema.parse(await req.json());

      const updated = await prisma.tugas_event.update({
        where: { id: tugasId },
        data,
        include: {
          ditugaskan_ke: { select: { id: true, nama_lengkap: true } },
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
        },
      });

      // Invalidate cache via Kafka — CDC akan sync ke ES secara otomatis
      await produceCacheInvalidate(REDIS_KEYS.TUGAS.SINGLE(eventId, tugasId));
      await produceCacheInvalidate(REDIS_KEYS.TUGAS.ALL_PREFIX(eventId));

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/events/:event_id/tugas/:id — Hapus Tugas
// Sub-tugas ikut terhapus via Prisma onDelete: Cascade
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, id } = await params;
      const ids = parseIds(event_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, tugasId } = ids;

      const existing = await prisma.tugas_event.findFirst({
        where: { id: tugasId, event_id: eventId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Tugas tidak ditemukan", "NOT_FOUND");

      await prisma.tugas_event.delete({ where: { id: tugasId } });

      // Invalidate cache via Kafka
      await produceCacheInvalidate(REDIS_KEYS.TUGAS.SINGLE(eventId, tugasId));
      await produceCacheInvalidate(REDIS_KEYS.TUGAS.ALL_PREFIX(eventId));

      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
