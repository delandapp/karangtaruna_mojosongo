import { prisma } from "@/lib/prisma";
import { createPerusahaanSchema } from "@/lib/validations/perusahaan.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

import { z } from "zod";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  dropdown: z.coerce.boolean().default(false),
  m_sektor_industri_id: z.coerce.number().int().positive().optional(),
  m_skala_perusahaan_id: z.coerce.number().int().positive().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/perusahaan — List dengan Pagination, Search & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const {
      page,
      limit,
      search,
      dropdown,
      m_sektor_industri_id,
      m_skala_perusahaan_id,
    } = listQuerySchema.parse(Object.fromEntries(searchParams));

    // ── Mode Dropdown ────────────────────────────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.PERUSAHAAN.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const items = await prisma.m_perusahaan.findMany({
        select: { id: true, nama: true },
        orderBy: { nama: "asc" },
        take: 10000,
      });

      await setCache(cacheKey, items, DEFAULT_CACHE_TTL);
      return successResponse(items, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const isFiltered = !!(
      search ||
      m_sektor_industri_id ||
      m_skala_perusahaan_id
    );

    const cacheKey = `${REDIS_KEYS.PERUSAHAAN.ALL}:page:${page}:limit:${limit}:sektor:${m_sektor_industri_id ?? "all"}:skala:${m_skala_perusahaan_id ?? "all"}`;

    // Cek cache hanya untuk query dasar (tanpa search)
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { nama_kontak: { contains: search, mode: "insensitive" } },
      ];
    }
    if (m_sektor_industri_id) {
      where.m_sektor_industri_id = m_sektor_industri_id;
    }
    if (m_skala_perusahaan_id) {
      where.m_skala_perusahaan_id = m_skala_perusahaan_id;
    }

    const [items, total] = await prisma.$transaction([
      prisma.m_perusahaan.findMany({
        where,
        include: {
          sektor: true,
          skala: true,
        },
        skip,
        take: limit,
        orderBy: { dibuat_pada: "desc" },
      }),
      prisma.m_perusahaan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache hanya untuk query tanpa filter/search
    if (!isFiltered) {
      await setCache(cacheKey, { data: items, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(items, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/perusahaan — Buat Data Perusahaan
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createPerusahaanSchema.parse(body);

    const newItem = await prisma.m_perusahaan.create({
      data: validatedData,
    });

    // Invalidate cache
    await invalidateCachePrefix(REDIS_KEYS.PERUSAHAAN.ALL_PREFIX);
    return successResponse(newItem, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
