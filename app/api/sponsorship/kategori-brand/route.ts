import { prisma } from "@/lib/prisma";
import { createKategoriBrandSchema } from "@/lib/validations/sponsorship.schema";
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

const CACHE_DROPDOWN = "sponsorship:kategori_brand:dropdown";
const CACHE_LIST_PREFIX = "sponsorship:kategori_brand:all:*";
const cacheListKey = (page: number, limit: number) =>
  `sponsorship:kategori_brand:all:page:${page}:limit:${limit}`;

// ─── Validation Schema ────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  dropdown: z.coerce.boolean().default(false),
});

// ──────────────────────────────────────────────────────────
// GET /api/sponsorship/kategori-brand
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, dropdown } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    // ── Mode Dropdown ────────────────────────────────────────────────────
    if (dropdown) {
      const cached = await getCache<unknown[]>(CACHE_DROPDOWN);
      if (cached) return successResponse(cached, 200);

      const items = await prisma.m_kategori_brand.findMany({
        select: { id: true, nama_kategori: true },
        orderBy: { nama_kategori: "asc" },
      });

      await setCache(CACHE_DROPDOWN, items, DEFAULT_CACHE_TTL);
      return successResponse(items, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const cacheKey = cacheListKey(page, limit);

    // Cek cache hanya untuk non-search
    if (!search) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const where = search
      ? { nama_kategori: { contains: search, mode: "insensitive" as const } }
      : {};

    const [items, total] = await Promise.all([
      prisma.m_kategori_brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.m_kategori_brand.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache jika bukan pencarian
    if (!search) {
      await setCache(cacheKey, { data: items, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(items, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/sponsorship/kategori-brand
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createKategoriBrandSchema.parse(body);

    // Cek duplikasi nama kategori
    const exists = await prisma.m_kategori_brand.findUnique({
      where: { nama_kategori: validatedData.nama_kategori },
      select: { id: true },
    });
    if (exists) {
      return errorResponse(409, "Nama Kategori sudah ada", "CONFLICT");
    }

    const newItem = await prisma.m_kategori_brand.create({
      data: validatedData,
    });

    // Invalidate list + dropdown cache via Kafka
    await produceCacheInvalidate(CACHE_LIST_PREFIX);
    await produceCacheInvalidate(CACHE_DROPDOWN);

    return successResponse(newItem, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
