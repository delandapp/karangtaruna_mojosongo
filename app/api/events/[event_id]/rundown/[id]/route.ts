import { prisma } from "@/lib/prisma";
import { updateRundownSchema } from "@/lib/validations/rundown.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix, redis } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

interface RouteProps {
  params: Promise<{ event_id: string; id: string }>;
}

export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/rundown", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const rundownId = parseInt(id, 10);
    if (isNaN(eventId) || isNaN(rundownId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const cacheKey = REDIS_KEYS.RUNDOWN.SINGLE(eventId, rundownId);
    const cached = await getCache<any>(cacheKey);
    if (cached) return successResponse(cached, 200);

    const rundown = await prisma.rundown_acara.findFirst({
      where: { id: rundownId, event_id: eventId },
      include: { pic: { select: { id: true, nama_lengkap: true } } },
    });
    if (!rundown) return errorResponse(404, "Data rundown tidak ditemukan", "NOT_FOUND");

    await setCache(cacheKey, rundown, DEFAULT_CACHE_TTL);
    return successResponse(rundown, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/rundown", "PUT");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const rundownId = parseInt(id, 10);
    if (isNaN(eventId) || isNaN(rundownId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.rundown_acara.findFirst({ where: { id: rundownId, event_id: eventId }, select: { id: true, waktu_mulai: true, waktu_selesai: true } });
    if (!existing) return errorResponse(404, "Data rundown tidak ditemukan", "NOT_FOUND");

    const data = updateRundownSchema.parse(await req.json());

    const waktuMulai = data.waktu_mulai ?? existing.waktu_mulai;
    const waktuSelesai = data.waktu_selesai ?? existing.waktu_selesai;
    if (waktuSelesai < waktuMulai) {
      return errorResponse(400, "Waktu selesai tidak boleh sebelum waktu mulai", "VALIDATION_ERROR");
    }

    const updated = await prisma.rundown_acara.update({
      where: { id: rundownId },
      data,
      include: { pic: { select: { id: true, nama_lengkap: true } } },
    });
    return successResponse(updated, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/rundown", "DELETE");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const rundownId = parseInt(id, 10);
    if (isNaN(eventId) || isNaN(rundownId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.rundown_acara.findFirst({ where: { id: rundownId, event_id: eventId }, select: { id: true } });
    if (!existing) return errorResponse(404, "Data rundown tidak ditemukan", "NOT_FOUND");

    await prisma.rundown_acara.delete({ where: { id: rundownId } });
    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
