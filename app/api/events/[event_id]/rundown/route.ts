import { prisma } from "@/lib/prisma";
import { createRundownSchema } from "@/lib/validations/rundown.schema";
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

// GET /api/events/:event_id/rundown — diurutkan hari_ke ASC, urutan_no ASC
export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/rundown", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    if (isNaN(eventId)) return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");

    const eventExists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!eventExists) return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

    const { searchParams } = new URL(req.url);
    const hariKe = searchParams.get("hari_ke") ? parseInt(searchParams.get("hari_ke")!, 10) : undefined;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "100",
    });
    const skip = (page - 1) * limit;

    const cacheKey = `${REDIS_KEYS.RUNDOWN.ALL(eventId)}:page:${page}:hari:${hariKe ?? "all"}`;
    const cached = await getCache<{ data: any[]; meta: any }>(cacheKey);
    if (cached) return paginatedResponse(cached.data, cached.meta, 200);

    const where: any = { event_id: eventId };
    if (hariKe) where.hari_ke = hariKe;

    const [rundowns, total] = await Promise.all([
      prisma.rundown_acara.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ hari_ke: "asc" }, { urutan_no: "asc" }],
        include: { pic: { select: { id: true, nama_lengkap: true } } },
      }),
      prisma.rundown_acara.count({ where }),
    ]);

    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    await setCache(cacheKey, { data: rundowns, meta }, DEFAULT_CACHE_TTL);
    return paginatedResponse(rundowns, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/events/:event_id/rundown
export const POST = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/rundown", "POST");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    if (isNaN(eventId)) return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");

    const eventExists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!eventExists) return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

    const data = createRundownSchema.parse(await req.json());

    // Validasi waktu: waktu_selesai harus >= waktu_mulai
    if (data.waktu_selesai < data.waktu_mulai) {
      return errorResponse(400, "Waktu selesai tidak boleh sebelum waktu mulai", "VALIDATION_ERROR");
    }

    const rundown = await prisma.rundown_acara.create({
      data: { event_id: eventId, ...data },
      include: { pic: { select: { id: true, nama_lengkap: true } } },
    });
    return successResponse(rundown, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
