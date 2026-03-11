import { prisma } from "@/lib/prisma";
import { createAnggaranSchema } from "@/lib/validations/anggaran.schema";
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

export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    if (isNaN(eventId)) return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");

    const eventExists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!eventExists) return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

    const { searchParams } = new URL(req.url);
    const skenarioFilter = searchParams.get("skenario") || undefined;
    const statusFilter = searchParams.get("status") || undefined;
    
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });
    const skip = (page - 1) * limit;

    const where: any = { event_id: eventId };
    if (skenarioFilter) where.skenario = skenarioFilter;
    if (statusFilter) where.status = statusFilter;
    const isFiltered = !!(skenarioFilter || statusFilter);

    const cacheKey = `${REDIS_KEYS.ANGGARAN.ALL(eventId)}:page:${page}:limit:${limit}`;
    if (!isFiltered) {
      const cached = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cached) return paginatedResponse(cached.data, cached.meta, 200);
    }

    const [anggaran_list, total] = await Promise.all([
      prisma.anggaran.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ versi: "desc" }],
        include: {
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
          disetujui_oleh: { select: { id: true, nama_lengkap: true } },
        },
      }),
      prisma.anggaran.count({ where }),
    ]);

    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    if (!isFiltered) await setCache(cacheKey, { data: anggaran_list, meta }, DEFAULT_CACHE_TTL);
    
    // Convert decimal strings if necessary, though Decimal is handled well by Next.js if serialized correctly
    return paginatedResponse(anggaran_list, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { userId, m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "POST");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    if (isNaN(eventId)) return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");

    const eventExists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!eventExists) return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

    const body = await req.json();
    const data = createAnggaranSchema.parse(body);

    const duplicate = await prisma.anggaran.findFirst({
      where: { event_id: eventId, skenario: data.skenario, versi: data.versi },
      select: { id: true }
    });
    if (duplicate) {
      return errorResponse(409, `Anggaran dengan Skenario '${data.skenario}' dan Versi '${data.versi}' sudah ada.`, "CONFLICT");
    }

    const anggaran = await prisma.anggaran.create({
      data: { 
        event_id: eventId, 
        dibuat_oleh_id: userId, 
        ...data 
      },
      include: {
        dibuat_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    await invalidateCachePrefix(REDIS_KEYS.ANGGARAN.ALL_PREFIX(eventId));
    await setCache(REDIS_KEYS.ANGGARAN.SINGLE(eventId, anggaran.id), anggaran, DEFAULT_CACHE_TTL);
    return successResponse(anggaran, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
