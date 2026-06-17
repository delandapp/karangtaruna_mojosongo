import { prisma } from "@/lib/prisma";
import { createJabatanSchema } from "@/lib/validations/jabatan.schema";
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
});

// ──────────────────────────────────────────────────────────
// GET /api/jabatans
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, dropdown } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    // ── Mode Dropdown ────────────────────────────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.JABATANS.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const jabatans = await prisma.m_jabatan.findMany({
        select: { id: true, nama_jabatan: true },
        orderBy: { nama_jabatan: "asc" },
      });

      await setCache(cacheKey, jabatans, DEFAULT_CACHE_TTL);
      return successResponse(jabatans, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const cacheKey = `${REDIS_KEYS.JABATANS.ALL}:page:${page}:limit:${limit}`;

    if (!search) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(cacheKey);
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const where = search
      ? {
          OR: [
            { nama_jabatan: { contains: search, mode: "insensitive" as const } },
            { deskripsi_jabatan: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [jabatans, total] = await prisma.$transaction([
      prisma.m_jabatan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dibuat_pada: "desc" },
      }),
      prisma.m_jabatan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    if (!search) {
      await setCache(cacheKey, { data: jabatans, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(jabatans, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/jabatans — Buat Jabatan Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createJabatanSchema.parse(body);

    const newJabatan = await prisma.m_jabatan.create({
      data: {
        nama_jabatan: validatedData.nama_jabatan,
        deskripsi_jabatan: validatedData.deskripsi_jabatan,
      },
    });

    // Invalidate cache
    await invalidateCachePrefix(REDIS_KEYS.JABATANS.ALL_PREFIX);
    return successResponse(newJabatan, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
