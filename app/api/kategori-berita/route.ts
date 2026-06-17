import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createKategoriBeritaSchema } from "@/lib/validations/berita.schema";
import { successResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

const CACHE_TTL = 5 * 60; // 5 menit

/**
 * GET /api/kategori-berita
 *
 * List semua kategori berita yang aktif.
 * Mendukung pagination, search, dan mode dropdown.
 * Public — tidak memerlukan autentikasi.
 *
 * Query Params:
 *  - page     : nomor halaman (default: 1)
 *  - limit    : item per halaman (default: 20, max: 100)
 *  - search   : filter by nama kategori
 *  - dropdown : "true" → return semua tanpa pagination (untuk select input)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";
    const search = searchParams.get("search") || undefined;

    // ── Mode Dropdown (tanpa pagination) ─────────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.KATEGORI_BERITA.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const kategoris = await prisma.m_kategori_berita.findMany({
        select: { id: true, nama: true, slug: true, warna_hex: true, icon_url: true },
        orderBy: [{ urutan: "asc" }, { nama: "asc" }],
      });

      await setCache(cacheKey, kategoris, CACHE_TTL);
      return successResponse(kategoris, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    // Cek cache Redis (hanya untuk non-search)
    const cacheKey = `${REDIS_KEYS.KATEGORI_BERITA.ALL}:page:${page}:limit:${limit}`;
    if (!search) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(cacheKey);
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const where = search
      ? {
          OR: [
            { nama: { contains: search, mode: "insensitive" as const } },
            { deskripsi: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [kategoris, total] = await prisma.$transaction([
      prisma.m_kategori_berita.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ urutan: "asc" }, { nama: "asc" }],
      }),
      prisma.m_kategori_berita.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    if (!search) {
      await setCache(cacheKey, { data: kategoris, meta }, CACHE_TTL);
    }

    return paginatedResponse(kategoris, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/kategori-berita
 *
 * Buat kategori berita baru.
 * Protected: hanya admin / editor.
 *
 * Body: CreateKategoriBeritaInput (lihat berita.schema.ts)
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createKategoriBeritaSchema.parse(body);

    // Cek duplikat slug sebelum insert
    const exists = await prisma.m_kategori_berita.findUnique({
      where: { slug: validatedData.slug },
      select: { id: true },
    });

    if (exists) {
      return successResponse(
        {
          message: `Slug '${validatedData.slug}' sudah digunakan oleh kategori lain`,
        },
        409,
      );
    }

    const kategori = await prisma.m_kategori_berita.create({
      data: {
        nama: validatedData.nama,
        slug: validatedData.slug,
        deskripsi: validatedData.deskripsi,
        warna_hex: validatedData.warna_hex,
        icon_url: validatedData.icon_url,
        urutan: validatedData.urutan,
      },
    });

    // Invalidate cache
    await invalidateCachePrefix(REDIS_KEYS.KATEGORI_BERITA.ALL_PREFIX);
    return successResponse(kategori, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
