import { prisma } from "@/lib/prisma";
import { updatePanitiaSchema } from "@/lib/validations/panitia.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix, redis } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

interface RouteProps {
  params: Promise<{ event_id: string; id: string }>;
}

// GET /api/events/:event_id/panitia/:id
export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/panitia", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const panitiaId = parseInt(id, 10);
    if (isNaN(eventId) || isNaN(panitiaId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const cacheKey = REDIS_KEYS.PANITIA.SINGLE(eventId, panitiaId);
    const cached = await getCache<any>(cacheKey);
    if (cached) return successResponse(cached, 200);

    const panitia = await prisma.anggota_panitia.findFirst({
      where: { id: panitiaId, event_id: eventId },
      include: {
        user: { select: { id: true, nama_lengkap: true, username: true } },
        jabatan: { select: { id: true, nama_jabatan: true } },
      },
    });

    if (!panitia) return errorResponse(404, "Data panitia tidak ditemukan", "NOT_FOUND");
    await setCache(cacheKey, panitia, DEFAULT_CACHE_TTL);
    return successResponse(panitia, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/events/:event_id/panitia/:id
export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/panitia", "PUT");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const panitiaId = parseInt(id, 10);
    if (isNaN(eventId) || isNaN(panitiaId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.anggota_panitia.findFirst({
      where: { id: panitiaId, event_id: eventId },
      select: { id: true },
    });
    if (!existing) return errorResponse(404, "Data panitia tidak ditemukan", "NOT_FOUND");

    const data = updatePanitiaSchema.parse(await req.json());

    const updated = await prisma.anggota_panitia.update({
      where: { id: panitiaId },
      data,
      include: {
        user: { select: { id: true, nama_lengkap: true, username: true } },
        jabatan: { select: { id: true, nama_jabatan: true } },
      },
    });
    return successResponse(updated, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/events/:event_id/panitia/:id
export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/panitia", "DELETE");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id, id } = await props.params;
    const eventId = parseInt(event_id, 10);
    const panitiaId = parseInt(id, 10);
    if (isNaN(eventId) || isNaN(panitiaId)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.anggota_panitia.findFirst({
      where: { id: panitiaId, event_id: eventId },
      select: { id: true },
    });
    if (!existing) return errorResponse(404, "Data panitia tidak ditemukan", "NOT_FOUND");

    await prisma.anggota_panitia.delete({ where: { id: panitiaId } });
    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
