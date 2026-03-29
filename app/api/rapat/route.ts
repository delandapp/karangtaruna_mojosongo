import { prisma } from "@/lib/prisma";
import { createRapatSchema } from "@/lib/validations/rapat.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { REDIS_KEYS, ELASTIC_INDICES } from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { paginationSchema } from "@/lib/validations/level.schema";

// GET /api/rapat — semua rapat (bisa filter per event)
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/rapat", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { searchParams } = new URL(req.url);
    const eventIdParam = searchParams.get("event_id") ? parseInt(searchParams.get("event_id")!, 10) : undefined;
    const statusFilter = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    });
    const skip = (page - 1) * limit;
    const isFiltered = !!(eventIdParam || statusFilter || search);

    const cacheKey = `${REDIS_KEYS.RAPAT.ALL}:page:${page}:limit:${limit}`;
    if (!isFiltered) {
      const cached = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cached) return paginatedResponse(cached.data, cached.meta, 200);
    }

    // Query Elasticsearch
    const esQuery: Record<string, unknown> = search
      ? { multi_match: { query: search, fields: ["judul", "lokasi", "notulensi"], fuzziness: "AUTO" } }
      : { match_all: {} };

    const { hits: rapat, total } = await searchDocuments(
      ELASTIC_INDICES.RAPAT,
      esQuery,
      { from: skip, size: limit, sort: [{ tanggal_rapat: "desc" }] },
    );

    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    return paginatedResponse(rapat, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/rapat
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userId, m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/rapat", "POST");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const data = createRapatSchema.parse(await req.json());

    // Validasi event_id jika diberikan
    if (data.event_id) {
      const eventExists = await prisma.event.findUnique({ where: { id: data.event_id }, select: { id: true } });
      if (!eventExists) return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
    }

    const rapat = await prisma.rapat.create({
      data: {
        dibuat_oleh_id: userId,
        event_id:       data.event_id,
        judul:          data.judul,
        tanggal_rapat:  data.tanggal_rapat,
        lokasi:         data.lokasi,
        notulensi:      data.notulensi,
        status:         data.status,
        agenda:         data.agenda as any,
        action_items:   data.action_items as any,
      },
      include: {
        event:       { select: { id: true, nama_event: true, kode_event: true } },
        dibuat_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });
    return successResponse(rapat, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
