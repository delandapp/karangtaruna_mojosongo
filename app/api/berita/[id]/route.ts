import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateBeritaSchema } from "@/lib/validations/berita.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { REDIS_KEYS } from "@/lib/constants";

type RouteParams = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

/**
 * GET /api/berita/[id]
 *
 * Ambil detail berita untuk CMS (semua status, termasuk DRAFT/REVIEW/REJECTED).
 * Include: kategori, tags, cover images.
 * Protected: hanya admin / editor.
 */
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const beritaId = parseId(id);

      if (!beritaId) {
        return errorResponse(400, "ID berita tidak valid", "VALIDATION_ERROR");
      }

      const berita = await prisma.c_berita.findFirst({
        where: { id: beritaId, dihapus_pada: null },
        include: {
          m_kategori_berita: true,
          r_berita_tag: {
            include: { m_tag: true },
          },
          c_berita_cover: {
            orderBy: { is_primary: "desc" },
          },
        },
      });

      if (!berita) {
        return errorResponse(404, "Berita tidak ditemukan", "NOT_FOUND");
      }

      return successResponse(berita, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

/**
 * PATCH /api/berita/[id]
 *
 * Update konten berita (judul, konten, SEO, tags, dll).
 * Setelah update, invalidate Redis cache single item + slug.
 * Protected: hanya admin / editor.
 */
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const beritaId = parseId(id);

      if (!beritaId) {
        return errorResponse(400, "ID berita tidak valid", "VALIDATION_ERROR");
      }

      const body = await req.json();
      const { tag_ids, ...beritaData } = updateBeritaSchema.parse(body);

      // Cek keberadaan sebelum update
      const existing = await prisma.c_berita.findFirst({
        where: { id: beritaId, dihapus_pada: null },
        select: { id: true, seo_slug: true },
      });

      if (!existing) {
        return errorResponse(404, "Berita tidak ditemukan", "NOT_FOUND");
      }

      const updated = await prisma.c_berita.update({
        where: { id: beritaId },
        data: {
          ...beritaData,
          // Prisma membutuhkan cast eksplisit untuk Json field
          konten_json:     beritaData.konten_json     as any,
          seo_schema_json: beritaData.seo_schema_json as any,
          // Update tags hanya jika tag_ids dikirim dalam request body
          ...(tag_ids !== undefined && {
            r_berita_tag: {
              deleteMany: {}, // hapus semua relasi lama
              create: tag_ids.map((tagId) => ({ m_tag_id: tagId })),
            },
          }),
        },
        include: {
          m_kategori_berita: true,
          r_berita_tag: {
            include: { m_tag: true },
          },
          c_berita_cover: {
            orderBy: { is_primary: "desc" },
          },
        },
      });

      // Invalidate Redis cache
      await produceCacheInvalidate(REDIS_KEYS.BERITA.SINGLE(beritaId));
      await produceCacheInvalidate(
        REDIS_KEYS.BERITA.SINGLE_BY_SLUG(updated.seo_slug),
      );
      // Slug lama juga perlu diinvalidate jika slug berubah
      if (existing.seo_slug !== updated.seo_slug) {
        await produceCacheInvalidate(
          REDIS_KEYS.BERITA.SINGLE_BY_SLUG(existing.seo_slug),
        );
      }

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

/**
 * DELETE /api/berita/[id]
 *
 * Soft delete berita — set dihapus_pada = NOW().
 * Data tidak benar-benar dihapus dari database.
 * Setelah delete, invalidate semua cache terkait.
 * Protected: hanya admin / editor.
 */
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const beritaId = parseId(id);

      if (!beritaId) {
        return errorResponse(400, "ID berita tidak valid", "VALIDATION_ERROR");
      }

      const berita = await prisma.c_berita.findFirst({
        where: { id: beritaId, dihapus_pada: null },
        select: { id: true, seo_slug: true, m_kategori_berita_id: true },
      });

      if (!berita) {
        return errorResponse(404, "Berita tidak ditemukan", "NOT_FOUND");
      }

      await prisma.c_berita.update({
        where: { id: beritaId },
        data: { dihapus_pada: new Date() },
      });

      // Invalidate semua cache terkait
      await produceCacheInvalidate(REDIS_KEYS.BERITA.SINGLE(beritaId));
      await produceCacheInvalidate(
        REDIS_KEYS.BERITA.SINGLE_BY_SLUG(berita.seo_slug),
      );
      await produceCacheInvalidate(REDIS_KEYS.BERITA.ALL_PREFIX);
      await produceCacheInvalidate(REDIS_KEYS.BERITA.TRENDING);
      await produceCacheInvalidate(REDIS_KEYS.BERITA.TOP);

      return successResponse(
        { message: "Berita berhasil dihapus" },
        200,
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
);
