import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { invalidateCachePrefix } from "@/lib/redis";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishBeritaSchema } from "@/lib/validations/berita.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

import { REDIS_KEYS } from "@/lib/constants";

type RouteParams = { params: Promise<{ id: string }> };

const STATUS_MAP: Record<string, string> = {
  PUBLISH: "PUBLISHED",
  ARCHIVE: "ARCHIVED",
  REJECT:  "REJECTED",
  REVIEW:  "REVIEW",
  DRAFT:   "DRAFT",
};

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

      const existing = await prisma.c_berita.findFirst({
        where: { id: beritaId, dihapus_pada: null },
        select: { id: true, status: true },
      });

      if (!existing) {
        return errorResponse(404, "Berita tidak ditemukan", "NOT_FOUND");
      }

      let newStatus = STATUS_MAP[action] as
        | "PUBLISHED"
        | "ARCHIVED"
        | "REJECTED"
        | "REVIEW"
        | "DRAFT"
        | "SCHEDULED";

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

      await invalidateCachePrefix(REDIS_KEYS.BERITA.SINGLE(beritaId));
      await invalidateCachePrefix(
        REDIS_KEYS.BERITA.SINGLE_BY_SLUG(updated.seo_slug),
      );
      await invalidateCachePrefix(REDIS_KEYS.BERITA.ALL_PREFIX);

      if (action === "ARCHIVE" || action === "REJECT") {
        await invalidateCachePrefix(REDIS_KEYS.BERITA.TRENDING);
        await invalidateCachePrefix(REDIS_KEYS.BERITA.TOP);
        await invalidateCachePrefix(
          REDIS_KEYS.BERITA.BY_KATEGORI(updated.m_kategori_berita.slug, 1),
        );
      }

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
