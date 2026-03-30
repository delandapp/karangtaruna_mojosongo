import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  beritaListQuerySchema,
  createBeritaSchema,
} from "@/lib/validations/berita.schema";
import {
  successResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { searchDocuments } from "@/lib/elasticsearch";
import { ELASTIC_INDICES } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

/**
 * GET /api/berita
 *
 * CMS list berita — semua status (DRAFT, REVIEW, PUBLISHED, dst).
 * Mendukung filter by status, kategori slug, is_featured, dan full-text search.
 * Data diambil dari Elasticsearch.
 *
 * Protected: hanya admin / editor.
 *
 * Query Params:
 *  - page       : nomor halaman (default: 1)
 *  - limit      : item per halaman (default: 20, max: 100)
 *  - search     : full-text search (judul, konten, seo_description)
 *  - status     : filter by StatusBerita enum
 *  - kategori   : filter by kategori slug
 *  - is_featured: filter berita unggulan
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, status, kategori, is_featured } =
      beritaListQuerySchema.parse(Object.fromEntries(searchParams));

    const skip = (page - 1) * limit;

    // ── Build Elasticsearch Query ─────────────────────────────────────────
    const must: Record<string, unknown>[] = [];
    const filter: Record<string, unknown>[] = [];

    if (search) {
      must.push({
        multi_match: {
          query: search,
          fields: ["judul^3", "konten", "seo_description"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }

    if (status)                  filter.push({ term: { status } });
    if (kategori)                filter.push({ term: { kategori_slug: kategori } });
    if (is_featured !== undefined) filter.push({ term: { is_featured } });

    const esQuery =
      must.length > 0 || filter.length > 0
        ? {
            bool: {
              must: must.length > 0 ? must : [{ match_all: {} }],
              filter,
            },
          }
        : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.BERITA,
      esQuery,
      {
        from: skip,
        size: limit,
        sort: [{ dibuat_pada: { order: "desc" } }],
      },
    );

    const totalPages = Math.ceil(total / limit);
    return paginatedResponse(hits, { page, limit, total, totalPages }, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST /api/berita
 *
 * Buat berita baru dengan status DRAFT.
 * m_user_id diisi otomatis dari JWT token (req.user.userId).
 *
 * Protected: hanya admin / editor.
 *
 * Body: CreateBeritaInput (lihat berita.schema.ts)
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { tag_ids, ...beritaData } = createBeritaSchema.parse(body);

    const berita = await prisma.c_berita.create({
      data: {
        ...beritaData,
        m_user_id:       req.user.userId,
        // Prisma tidak bisa menerima plain object untuk Json field — cast aman
        konten_json:     beritaData.konten_json   as object,
        seo_schema_json: beritaData.seo_schema_json as object | undefined,
        // Buat relasi tag sekaligus dalam satu transaction
        r_berita_tag: {
          create: tag_ids.map((tagId) => ({ m_tag_id: tagId })),
        },
      },
      include: {
        m_kategori_berita: true,
        r_berita_tag: {
          include: { m_tag: true },
        },
      },
    });

    return successResponse(berita, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
