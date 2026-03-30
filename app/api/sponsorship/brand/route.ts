import { prisma } from "@/lib/prisma";
import { createBrandSchema } from "@/lib/validations/sponsorship.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { z } from "zod";

// ─── Cache Keys ───────────────────────────────────────────────────────────────

const CACHE_DROPDOWN = "sponsorship:brand:dropdown";
const CACHE_INVALIDATE_PREFIX = "sponsorship:brand:all:*";
const cacheListKey = (
  page: number,
  limit: number,
  bidangIds: string,
  kategoriIds: string,
) =>
  `sponsorship:brand:all:page:${page}:limit:${limit}:bid:${bidangIds}:kat:${kategoriIds}`;

// ─── Query Schema ─────────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  dropdown: z.coerce.boolean().default(false),
  m_bidang_brand_id: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map(Number)
            .filter((n) => !isNaN(n))
        : undefined,
    ),
  m_kategori_brand_id: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map(Number)
            .filter((n) => !isNaN(n))
        : undefined,
    ),
});

// ──────────────────────────────────────────────────────────
// GET /api/sponsorship/brand — List dengan Pagination, Search & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const {
      page,
      limit,
      search,
      dropdown,
      m_bidang_brand_id,
      m_kategori_brand_id,
    } = listQuerySchema.parse(Object.fromEntries(searchParams));

    // ── Mode Dropdown ────────────────────────────────────────────────────
    if (dropdown) {
      const cached = await getCache<unknown[]>(CACHE_DROPDOWN);
      if (cached) return successResponse(cached, 200);

      const items = await prisma.m_brand.findMany({
        select: { id: true, nama_brand: true },
        orderBy: { nama_brand: "asc" },
      });

      await setCache(CACHE_DROPDOWN, items, DEFAULT_CACHE_TTL);
      return successResponse(items, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const isFiltered = !!(
      search ||
      m_bidang_brand_id?.length ||
      m_kategori_brand_id?.length
    );

    const bidKey = m_bidang_brand_id?.join(",") ?? "all";
    const katKey = m_kategori_brand_id?.join(",") ?? "all";
    const cacheKey = cacheListKey(page, limit, bidKey, katKey);

    // Cek cache hanya untuk query tanpa search
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    // Build Prisma where clause
    const where: Record<string, unknown> = {};

    if (m_bidang_brand_id?.length) {
      where.m_bidang_brand_id = { in: m_bidang_brand_id };
    }
    if (m_kategori_brand_id?.length) {
      where.m_kategori_brand_id = { in: m_kategori_brand_id };
    }
    if (search) {
      where.OR = [
        { nama_brand: { contains: search, mode: "insensitive" as const } },
        {
          perusahaan_induk: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.m_brand.findMany({
        where,
        include: {
          bidang: { select: { nama_bidang: true } },
          kategori: { select: { nama_kategori: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.m_brand.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache hanya untuk query tanpa filter
    if (!isFiltered) {
      await setCache(cacheKey, { data: items, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(items, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/sponsorship/brand — Tambah Brand Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createBrandSchema.parse(body);

    // Cek duplikasi nama brand
    const exists = await prisma.m_brand.findFirst({
      where: { nama_brand: validatedData.nama_brand },
      select: { id: true },
    });
    if (exists) {
      return errorResponse(409, "Nama Brand sudah ada", "CONFLICT");
    }

    const newItem = await prisma.m_brand.create({
      data: validatedData,
    });

    // Invalidate list + dropdown cache via Kafka — CDC sync ke ES otomatis
    await produceCacheInvalidate(CACHE_INVALIDATE_PREFIX);
    await produceCacheInvalidate(CACHE_DROPDOWN);

    return successResponse(newItem, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
