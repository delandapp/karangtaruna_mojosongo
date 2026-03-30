import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createTagBeritaSchema,
  beritaListQuerySchema,
} from "@/lib/validations/berita.schema";
import { successResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { produceCacheInvalidate } from "@/lib/kafka";
import { REDIS_KEYS } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

/**
 * GET /api/tag-berita?page=1&limit=20&search=...
 *
 * List semua tag berita, support search by nama/slug.
 * Data diambil dari PostgreSQL dengan Redis cache.
 * Public — tidak memerlukan autentikasi.
 *
 * Query Params:
 *  - page   : nomor halaman (default: 1)
 *  - limit  : item per halaman (default: 20, max: 100)
 *  - search : filter by nama tag
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    // ── Mode Dropdown (untuk select input di CMS) ─────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.TAG_BERITA.ALL}:dropdown`;
      const cached = await getCache<{ id: number; nama: string; slug: string }[]>(
        cacheKey,
      );
      if (cached) return successResponse(cached, 200);

      const tags = await prisma.m_tag.findMany({
        where: { dihapus_pada: null },
        select: { id: true, nama: true, slug: true },
        orderBy: { nama: "asc" },
      });

      await setCache(cacheKey, tags, 60 * 60); // cache 1 jam
      return successResponse(tags, 200);
    }

    // ── Mode Pagination ───────────────────────────────────────────────────
    const page   = Math.max(1, Number(searchParams.get("page")  ?? "1"));
    const limit  = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const search = searchParams.get("search") ?? undefined;
    const skip   = (page - 1) * limit;

    // Cek cache Redis (hanya untuk non-search)
    const cacheKey = `${REDIS_KEYS.TAG_BERITA.ALL}:page:${page}:limit:${limit}`;
    if (!search) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(cacheKey);
      if (cached) return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const where = {
      dihapus_pada: null as null,
      ...(search && {
        OR: [
          { nama: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [tags, total] = await prisma.$transaction([
      prisma.m_tag.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ total_berita: "desc" }, { nama: "asc" }],
      }),
      prisma.m_tag.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache jika bukan search
    if (!search) {
      await setCache(cacheKey, { data: tags, meta }, 5 * 60); // 5 menit
    }

    return paginatedResponse(tags, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tag-berita
 *
 * Buat tag berita baru.
 * Protected: hanya admin / editor.
 *
 * Body:
 *  - nama      : string (min 2, max 80)
 *  - slug      : string (max 100, hanya huruf kecil/angka/strip)
 *  - deskripsi : string (opsional)
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const data = createTagBeritaSchema.parse(body);

    const tag = await prisma.m_tag.create({
      data: {
        nama:      data.nama,
        slug:      data.slug,
        deskripsi: data.deskripsi,
      },
    });

    // Invalidate semua cache listing tag
    await produceCacheInvalidate(REDIS_KEYS.TAG_BERITA.ALL_PREFIX);

    return successResponse(tag, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
