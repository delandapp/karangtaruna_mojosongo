import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishBeritaSchema } from "@/lib/validations/berita.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceNewsPublished } from "@/lib/news/news-kafka";
import { produceCacheInvalidate } from "@/lib/kafka";
import { REDIS_KEYS } from "@/lib/constants";

type RouteParams = { params: Promise<{ id: string }> };

const STATUS_MAP: Record<string, string> = {
  PUBLISH: "PUBLISHED",
  ARCHIVE: "ARCHIVED",
  REJECT:  "REJECTED",
  REVIEW:  "REVIEW",
  DRAFT:   "DRAFT",
};

/**
 * PATCH /api/berita/[id]/publish
 *
 * Mengubah status berita dan mengelola lifecycle publikasi.
 *
 * Actions:
 *  - PUBLISH  → status = PUBLISHED, published_at = NOW()
 *               Jika scheduled_at disertakan → status = SCHEDULED
 *               Produce event NEWS_PUBLISHED ke Kafka (trigger ES indexing)
 *  - ARCHIVE  → status = ARCHIVED
 *  - REJECT   → status = REJECTED (sertakan `alasan` untuk feedback penulis)
 *  - REVIEW   → status = REVIEW (kirim ke editor untuk review)
 *  - DRAFT    → status = DRAFT (kembalikan ke draft)
 *
 * Body: PublishBeritaInput (lihat berita.schema.ts)
 * Protected: hanya admin / editor.
 */
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const beritaId = parseInt(id, 10);

      if (isNaN(beritaId) || beritaId <= 0) {
        return errorResponse(400, "ID berita tidak valid", "VALIDATION_ERROR");
      }

      const body = await req.json();
      const { action, scheduled_at } = publishBeritaSchema.parse(body);

      // Cek keberadaan berita
      const existing = await prisma.c_berita.findFirst({
        where: { id: beritaId, dihapus_pada: null },
        select: { id: true, status: true },
      });

      if (!existing) {
        return errorResponse(404, "Berita tidak ditemukan", "NOT_FOUND");
      }

      // ── Tentukan status dan data yang akan diupdate ──────────────────────
      let newStatus = STATUS_MAP[action] as
        | "PUBLISHED"
        | "ARCHIVED"
        | "REJECTED"
        | "REVIEW"
        | "DRAFT"
        | "SCHEDULED";

      // Jika PUBLISH dengan scheduled_at → jadwalkan (SCHEDULED)
      if (action === "PUBLISH" && scheduled_at) {
        newStatus = "SCHEDULED";
      }

      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      if (action === "PUBLISH" && !scheduled_at) {
        updateData.published_at = new Date();
      }

      if (action === "PUBLISH" && scheduled_at) {
        updateData.scheduled_at = new Date(scheduled_at);
      }

      // ── Update database ──────────────────────────────────────────────────
      const updated = await prisma.c_berita.update({
        where: { id: beritaId },
        data: updateData as any,
        include: {
          m_kategori_berita: true,
          r_berita_tag: {
            include: { m_tag: true },
          },
          c_berita_cover: {
            where: { is_primary: true },
            take: 1,
          },
        },
      });

      // ── Produce Kafka event jika berita baru PUBLISHED ───────────────────
      if (updated.status === "PUBLISHED") {
        await produceNewsPublished({
          id:               updated.id,
          judul:            updated.judul,
          konten_plaintext: updated.konten_plaintext,
          seo_slug:         updated.seo_slug,
          seo_description:  updated.seo_description,
          seo_keywords:     updated.seo_keywords,
          kategori:         updated.m_kategori_berita.nama,
          kategori_slug:    updated.m_kategori_berita.slug,
          tags:             updated.r_berita_tag.map((rt) => rt.m_tag.nama),
          published_at:     updated.published_at,
          total_views:      Number(updated.total_views),
          total_likes:      updated.total_likes,
          trending_score:   updated.trending_score,
          cover_url:        updated.c_berita_cover[0]?.s3_url ?? null,
        });
      }

      // ── Invalidate Redis cache ───────────────────────────────────────────
      await produceCacheInvalidate(REDIS_KEYS.BERITA.SINGLE(beritaId));
      await produceCacheInvalidate(
        REDIS_KEYS.BERITA.SINGLE_BY_SLUG(updated.seo_slug),
      );
      await produceCacheInvalidate(REDIS_KEYS.BERITA.ALL_PREFIX);

      // Jika berita diarsipkan / ditolak → bersihkan dari listing publik
      if (action === "ARCHIVE" || action === "REJECT") {
        await produceCacheInvalidate(REDIS_KEYS.BERITA.TRENDING);
        await produceCacheInvalidate(REDIS_KEYS.BERITA.TOP);
        await produceCacheInvalidate(
          REDIS_KEYS.BERITA.BY_KATEGORI(updated.m_kategori_berita.slug, 1),
        );
      }

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
