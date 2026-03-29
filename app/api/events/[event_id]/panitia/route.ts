import { prisma } from "@/lib/prisma";
import { createPanitiaSchema } from "@/lib/validations/panitia.schema";
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

async function getEventOrError(eventId: number) {
  return prisma.event.findUnique({ where: { id: eventId }, select: { id: true, status_event: true } });
}

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/panitia
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/panitia", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    if (isNaN(eventId)) return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");

    const event = await getEventOrError(eventId);
    if (!event) return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

    const { searchParams } = new URL(req.url);
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    });
    const skip = (page - 1) * limit;

    const cacheKey = `${REDIS_KEYS.PANITIA.ALL(eventId)}:page:${page}:limit:${limit}`;
    const cached = await getCache<{ data: any[]; meta: any }>(cacheKey);
    if (cached) return paginatedResponse(cached.data, cached.meta, 200);

    const [panitia, total] = await Promise.all([
      prisma.anggota_panitia.findMany({
        where: { event_id: eventId },
        skip,
        take: limit,
        orderBy: [{ divisi: "asc" }, { posisi: "asc" }],
        include: {
          user: { select: { id: true, nama_lengkap: true, username: true } },
          jabatan: { select: { id: true, nama_jabatan: true } },
        },
      }),
      prisma.anggota_panitia.count({ where: { event_id: eventId } }),
    ]);

    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    await setCache(cacheKey, { data: panitia, meta }, DEFAULT_CACHE_TTL);
    return paginatedResponse(panitia, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/events/:event_id/panitia
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/panitia", "POST");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);
    if (isNaN(eventId)) return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");

    const event = await getEventOrError(eventId);
    if (!event) return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

    if (event.status_event === "selesai" || event.status_event === "dibatalkan") {
      return errorResponse(422, `Tidak dapat menambah panitia pada event yang berstatus "${event.status_event}"`, "UNPROCESSABLE_ENTITY");
    }

    const body = await req.json();
    const data = createPanitiaSchema.parse(body);

    // Pastikan user ada
    const userExists = await prisma.m_user.findUnique({ where: { id: data.user_id }, select: { id: true } });
    if (!userExists) return errorResponse(404, "User dengan ID tersebut tidak ditemukan", "NOT_FOUND");

    // Cek duplikat user di event yang sama (@@unique([event_id, user_id]))
    const duplicate = await prisma.anggota_panitia.findUnique({
      where: { event_id_user_id: { event_id: eventId, user_id: data.user_id } },
      select: { id: true },
    });
    if (duplicate) return errorResponse(409, "User ini sudah terdaftar sebagai panitia pada event ini", "CONFLICT");

    const panitia = await prisma.anggota_panitia.create({
      data: { event_id: eventId, ...data },
      include: {
        user: { select: { id: true, nama_lengkap: true, username: true } },
        jabatan: { select: { id: true, nama_jabatan: true } },
      },
    });
    return successResponse(panitia, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
