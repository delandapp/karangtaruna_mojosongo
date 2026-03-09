import { prisma } from "@/lib/prisma";
import { updateTugasSchema } from "@/lib/validations/tugas.schema";
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
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/tugas", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const tugasId = parseInt(id, 10);
    if (isNaN(eventId) || isNaN(tugasId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const cacheKey = REDIS_KEYS.TUGAS.SINGLE(eventId, tugasId);
    const cached = await getCache<any>(cacheKey);
    if (cached) return successResponse(cached, 200);

    const tugas = await prisma.tugas_event.findFirst({
      where: { id: tugasId, event_id: eventId },
      include: {
        ditugaskan_ke: { select: { id: true, nama_lengkap: true } },
        dibuat_oleh:   { select: { id: true, nama_lengkap: true } },
        parent_tugas:  { select: { id: true, nama_tugas: true } },
        sub_tugas: {
          select: { id: true, nama_tugas: true, status: true, prioritas: true, ditugaskan_ke_id: true },
        },
      },
    });
    if (!tugas) return errorResponse(404, "Tugas tidak ditemukan", "NOT_FOUND");

    await setCache(cacheKey, tugas, DEFAULT_CACHE_TTL);
    return successResponse(tugas, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/tugas", "PUT");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const tugasId = parseInt(id, 10);
    if (isNaN(eventId) || isNaN(tugasId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.tugas_event.findFirst({ where: { id: tugasId, event_id: eventId }, select: { id: true } });
    if (!existing) return errorResponse(404, "Tugas tidak ditemukan", "NOT_FOUND");

    const data = updateTugasSchema.parse(await req.json());
    const updated = await prisma.tugas_event.update({
      where: { id: tugasId },
      data,
      include: {
        ditugaskan_ke: { select: { id: true, nama_lengkap: true } },
        dibuat_oleh:   { select: { id: true, nama_lengkap: true } },
      },
    });

    await setCache(REDIS_KEYS.TUGAS.SINGLE(eventId, tugasId), updated, DEFAULT_CACHE_TTL);
    await invalidateCachePrefix(REDIS_KEYS.TUGAS.ALL_PREFIX(eventId));
    return successResponse(updated, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/tugas", "DELETE");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const tugasId = parseInt(id, 10);
    if (isNaN(eventId) || isNaN(tugasId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.tugas_event.findFirst({ where: { id: tugasId, event_id: eventId }, select: { id: true } });
    if (!existing) return errorResponse(404, "Tugas tidak ditemukan", "NOT_FOUND");

    // Hapus cascade (sub-tasks ikut terhapus via Prisma onDelete: Cascade)
    await prisma.tugas_event.delete({ where: { id: tugasId } });
    await redis.del(REDIS_KEYS.TUGAS.SINGLE(eventId, tugasId));
    await invalidateCachePrefix(REDIS_KEYS.TUGAS.ALL_PREFIX(eventId));
    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
