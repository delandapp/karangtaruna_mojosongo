import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { paginationSchema } from "@/lib/validations/level.schema";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || undefined;
    const skenarioFilter = searchParams.get("skenario") || undefined;
    const eventSearch = searchParams.get("search") || undefined;

    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });
    const skip = (page - 1) * limit;

    const where: any = {};
    if (statusFilter) where.status = statusFilter;
    if (skenarioFilter) where.skenario = skenarioFilter;
    if (eventSearch) {
      where.event = { nama_event: { contains: eventSearch, mode: "insensitive" } };
    }

    const isFiltered = !!(statusFilter || skenarioFilter || eventSearch);
    const cacheKey = `anggaran:all:page:${page}:limit:${limit}:status:${statusFilter || "all"}:skenario:${skenarioFilter || "all"}:search:${eventSearch || ""}`;

    if (!isFiltered) {
      const cached = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cached) return paginatedResponse(cached.data, cached.meta, 200);
    }

    const [records, total] = await Promise.all([
      prisma.anggaran.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ id: "desc" }],
        include: {
          event: { select: { id: true, nama_event: true, status_event: true } },
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
          disetujui_oleh: { select: { id: true, nama_lengkap: true } },
          _count: { select: { item_anggaran: true, transaksi: true } },
        },
      }),
      prisma.anggaran.count({ where }),
    ]);

    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    if (!isFiltered) await setCache(cacheKey, { data: records, meta }, DEFAULT_CACHE_TTL);

    return paginatedResponse(records, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
