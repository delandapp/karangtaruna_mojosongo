import { prisma } from "@/lib/prisma";
import { updatePanitiaSchema } from "@/lib/validations/panitia.schema";
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
): { eventId: number; panitiaId: number } | null => {
  const eventId = parseInt(event_id, 10);
  const panitiaId = parseInt(id, 10);
  if (isNaN(eventId) || eventId <= 0 || isNaN(panitiaId) || panitiaId <= 0)
    return null;
  return { eventId, panitiaId };
};

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/panitia/:id — Detail Anggota Panitia
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, id } = await params;
      const ids = parseIds(event_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, panitiaId } = ids;

      // 1. Cek Redis cache
      const cacheKey = REDIS_KEYS.PANITIA.SINGLE(eventId, panitiaId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari database
      const panitia = await prisma.anggota_panitia.findFirst({
        where: { id: panitiaId, event_id: eventId },
        include: {
          user: { select: { id: true, nama_lengkap: true, username: true } },
          jabatan: { select: { id: true, nama_jabatan: true } },
        },
      });

      if (!panitia)
        return errorResponse(404, "Data panitia tidak ditemukan", "NOT_FOUND");

      // 3. Simpan ke cache
      await setCache(cacheKey, panitia, DEFAULT_CACHE_TTL);

      return successResponse(panitia, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/events/:event_id/panitia/:id — Update Anggota Panitia
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, id } = await params;
      const ids = parseIds(event_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, panitiaId } = ids;

      const existing = await prisma.anggota_panitia.findFirst({
        where: { id: panitiaId, event_id: eventId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Data panitia tidak ditemukan", "NOT_FOUND");

      const data = updatePanitiaSchema.parse(await req.json());

      const updated = await prisma.anggota_panitia.update({
        where: { id: panitiaId },
        data,
        include: {
          user: { select: { id: true, nama_lengkap: true, username: true } },
          jabatan: { select: { id: true, nama_jabatan: true } },
        },
      });

      // Invalidate cache via Kafka — CDC akan sync ke ES secara otomatis
      await produceCacheInvalidate(
        REDIS_KEYS.PANITIA.SINGLE(eventId, panitiaId),
      );
      await produceCacheInvalidate(REDIS_KEYS.PANITIA.ALL_PREFIX(eventId));

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/events/:event_id/panitia/:id — Hapus Anggota Panitia
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, id } = await params;
      const ids = parseIds(event_id, id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, panitiaId } = ids;

      const existing = await prisma.anggota_panitia.findFirst({
        where: { id: panitiaId, event_id: eventId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Data panitia tidak ditemukan", "NOT_FOUND");

      await prisma.anggota_panitia.delete({ where: { id: panitiaId } });

      // Invalidate cache via Kafka
      await produceCacheInvalidate(
        REDIS_KEYS.PANITIA.SINGLE(eventId, panitiaId),
      );
      await produceCacheInvalidate(REDIS_KEYS.PANITIA.ALL_PREFIX(eventId));

      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
