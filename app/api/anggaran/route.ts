import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { ELASTIC_INDICES } from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
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

    const isFiltered = !!(statusFilter || skenarioFilter || eventSearch);

    // 1. Cek Cache Redis (hanya untuk non-filtered)
    const cacheKey = `anggaran:all:page:${page}:limit:${limit}`;
    if (!isFiltered) {
      const cached = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cached) return paginatedResponse(cached.data, cached.meta, 200);
    }

    // 2. Query Elasticsearch
    const must: any[] = [];
    if (statusFilter) must.push({ term: { status: statusFilter } });
    if (skenarioFilter) must.push({ term: { skenario: skenarioFilter } });
    if (eventSearch) must.push({ multi_match: { query: eventSearch, fields: ["skenario", "deskripsi"] } });

    const query = must.length > 0 ? { bool: { must } } : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.ANGGARAN,
      query,
      { from: skip, size: limit, sort: [{ id: { order: "desc" } }] },
    );

    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
