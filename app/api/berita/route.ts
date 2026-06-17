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
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

/**
 * GET /api/berita
 *
 * CMS list berita — semua status (DRAFT, REVIEW, PUBLISHED, dst).
 * Mendukung filter by status, kategori slug, is_featured, dan text search.
 * Data diambil langsung dari PostgreSQL via Prisma.
 *
 * Protected: hanya admin / editor.
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, status, kategori, is_featured } =
      beritaListQuerySchema.parse(Object.fromEntries(searchParams));

    const skip = (page - 1) * limit;

    const where: any = { dihapus_pada: null };

    if (status) {
      where.status = status;
    }
    if (kategori) {
      where.m_kategori_berita = { slug: kategori };
    }
    if (is_featured !== undefined) {
      where.is_featured = is_featured;
    }
    if (search) {
      where.OR = [
        { judul: { contains: search, mode: "insensitive" } },
        { sub_judul: { contains: search, mode: "insensitive" } },
        { penulis: { contains: search, mode: "insensitive" } },
      ];
    }

    const [docs, total] = await Promise.all([
      prisma.c_berita.findMany({
        where,
        orderBy: { dibuat_pada: "desc" },
        skip,
        take: limit,
        include: {
          m_kategori_berita: true,
          r_berita_tag: {
            include: { m_tag: true },
          },
          c_berita_cover: {
            orderBy: { is_primary: "desc" },
          },
        },
      }),
      prisma.c_berita.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return paginatedResponse(docs, { page, limit, total, totalPages }, 200);
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
