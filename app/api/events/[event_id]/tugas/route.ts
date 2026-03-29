import { prisma } from "@/lib/prisma";
import { createTugasSchema } from "@/lib/validations/tugas.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { paginationSchema } from "@/lib/validations/level.schema";

interface RouteProps {
  params: Promise<{ event_id: string }>;
}

// GET /api/events/:event_id/tugas
export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/tugas", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    if (isNaN(eventId)) return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");

    const eventExists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!eventExists) return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || undefined;
    const prioritasFilter = searchParams.get("prioritas") || undefined;
    const assignedTo = searchParams.get("ditugaskan_ke_id") ? parseInt(searchParams.get("ditugaskan_ke_id")!, 10) : undefined;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });
    const skip = (page - 1) * limit;

    const where: any = { event_id: eventId, parent_tugas_id: null }; // root tasks only
    if (statusFilter) where.status = statusFilter;
    if (prioritasFilter) where.prioritas = prioritasFilter;
    if (assignedTo) where.ditugaskan_ke_id = assignedTo;
    const isFiltered = !!(statusFilter || prioritasFilter || assignedTo);

    const cacheKey = `${REDIS_KEYS.TUGAS.ALL(eventId)}:page:${page}:limit:${limit}`;
    if (!isFiltered) {
      const cached = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cached) return paginatedResponse(cached.data, cached.meta, 200);
    }

    const [tugas, total] = await Promise.all([
      prisma.tugas_event.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ prioritas: "desc" }, { batas_waktu: "asc" }],
        include: {
          ditugaskan_ke: { select: { id: true, nama_lengkap: true } },
          dibuat_oleh:   { select: { id: true, nama_lengkap: true } },
          sub_tugas: { select: { id: true, nama_tugas: true, status: true, prioritas: true } },
        },
      }),
      prisma.tugas_event.count({ where }),
    ]);

    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    if (!isFiltered) await setCache(cacheKey, { data: tugas, meta }, DEFAULT_CACHE_TTL);
    return paginatedResponse(tugas, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/events/:event_id/tugas
export const POST = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { userId, m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/tugas", "POST");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    if (isNaN(eventId)) return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");

    const eventExists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!eventExists) return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

    const data = createTugasSchema.parse(await req.json());

    // Validasi parent_tugas_id jika ada
    if (data.parent_tugas_id) {
      const parent = await prisma.tugas_event.findFirst({
        where: { id: data.parent_tugas_id, event_id: eventId },
        select: { id: true },
      });
      if (!parent) return errorResponse(404, "Tugas induk tidak ditemukan pada event ini", "NOT_FOUND");
    }

    const tugas = await prisma.tugas_event.create({
      data: { event_id: eventId, dibuat_oleh_id: userId, ...data },
      include: {
        ditugaskan_ke: { select: { id: true, nama_lengkap: true } },
        dibuat_oleh:   { select: { id: true, nama_lengkap: true } },
      },
    });
    return successResponse(tugas, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
