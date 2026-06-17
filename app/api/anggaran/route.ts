import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { z } from "zod";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  skenario: z.string().optional(),
  event_id: z.coerce.number().int().positive().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/anggaran — List dengan Pagination, Search & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, status, skenario, event_id } =
      listQuerySchema.parse(Object.fromEntries(searchParams));

    const skip = (page - 1) * limit;
    const isFiltered = !!(search || status || skenario || event_id);

    // Cek cache hanya untuk non-filter
    const cacheKey = `anggaran:all:page:${page}:limit:${limit}`;
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    // Build Prisma where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { skenario: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (skenario) where.skenario = skenario;
    if (event_id) where.event_id = event_id;

    const [data, total] = await Promise.all([
      prisma.anggaran.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.anggaran.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache jika query tanpa filter
    if (!isFiltered) {
      await setCache(cacheKey, { data, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(data, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
