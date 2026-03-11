import { prisma } from "@/lib/prisma";
import { updateAnggaranSchema } from "@/lib/validations/anggaran.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix, redis } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

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

    const cacheKey = REDIS_KEYS.ANGGARAN.SINGLE(eventId, anggaranId);
    const cached = await getCache<any>(cacheKey);
    if (cached) return successResponse(cached, 200);

    const anggaran = await prisma.anggaran.findFirst({
      where: { id: anggaranId, event_id: eventId },
      include: {
        dibuat_oleh: { select: { id: true, nama_lengkap: true } },
        disetujui_oleh: { select: { id: true, nama_lengkap: true } },
        item_anggaran: true,
      },
    });

    if (!anggaran) return errorResponse(404, "Data anggaran tidak ditemukan", "NOT_FOUND");
    await setCache(cacheKey, anggaran, DEFAULT_CACHE_TTL);
    return successResponse(anggaran, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { userId, m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "PUT");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, anggaran_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const anggaranId = parseInt(anggaran_id, 10);
    if (isNaN(eventId) || isNaN(anggaranId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.anggaran.findFirst({
      where: { id: anggaranId, event_id: eventId },
    });
    if (!existing) return errorResponse(404, "Data anggaran tidak ditemukan", "NOT_FOUND");

    const body = await req.json();
    const data = updateAnggaranSchema.parse(body);

    // If status becomes disetujui, set disetujui_oleh_id and disetujui_pada
    let disetujui_oleh_id = existing.disetujui_oleh_id;
    let disetujui_pada = existing.disetujui_pada;

    if (data.status === "disetujui" && existing.status !== "disetujui") {
      disetujui_oleh_id = userId;
      disetujui_pada = new Date();
    } else if (data.status && data.status !== "disetujui" && data.status !== "final") {
      disetujui_oleh_id = null;
      disetujui_pada = null;
    }

    const updated = await prisma.anggaran.update({
      where: { id: anggaranId },
      data: {
        ...data,
        disetujui_oleh_id,
        disetujui_pada,
      },
      include: {
        dibuat_oleh: { select: { id: true, nama_lengkap: true } },
        disetujui_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    await setCache(REDIS_KEYS.ANGGARAN.SINGLE(eventId, anggaranId), updated, DEFAULT_CACHE_TTL);
    await invalidateCachePrefix(REDIS_KEYS.ANGGARAN.ALL_PREFIX(eventId));
    return successResponse(updated, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "DELETE");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, anggaran_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const anggaranId = parseInt(anggaran_id, 10);
    if (isNaN(eventId) || isNaN(anggaranId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.anggaran.findFirst({
      where: { id: anggaranId, event_id: eventId },
      select: { id: true },
    });
    if (!existing) return errorResponse(404, "Data anggaran tidak ditemukan", "NOT_FOUND");

    await prisma.anggaran.delete({ where: { id: anggaranId } });
    await redis.del(REDIS_KEYS.ANGGARAN.SINGLE(eventId, anggaranId));
    await invalidateCachePrefix(REDIS_KEYS.ANGGARAN.ALL_PREFIX(eventId));
    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
