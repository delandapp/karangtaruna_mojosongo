import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { invalidateCachePrefix } from "@/lib/redis";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

import { REDIS_KEYS } from "@/lib/constants";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ──────────────────────────────────────────────────────────
// PUT /api/eproposal/[id] — Update E-Proposal
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = parseId(rawId);
      if (!id)
        return errorResponse(
          400,
          "ID E-Proposal tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.m_eproposal.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "E-Proposal tidak ditemukan", "NOT_FOUND");

      const body = await req.json();
      const { pengaturan, daftar_isi, ...proposalData } = body;

      const dataToUpdate: Record<string, unknown> = { ...proposalData };

      // Normalisasi URL jika dikirim sebagai object (dari file upload response)
      if (
        typeof dataToUpdate.file_pdf_url === "object" &&
        dataToUpdate.file_pdf_url !== null
      ) {
        dataToUpdate.file_pdf_url =
          (dataToUpdate.file_pdf_url as any).file?.urlPublik ||
          (dataToUpdate.file_pdf_url as any).url ||
          "";
      }
      if (
        typeof dataToUpdate.cover_url === "object" &&
        dataToUpdate.cover_url !== null
      ) {
        dataToUpdate.cover_url =
          (dataToUpdate.cover_url as any).file?.urlPublik ||
          (dataToUpdate.cover_url as any).url ||
          "";
      }

      // Normalisasi bg_music_url dalam pengaturan
      if (
        pengaturan?.bg_music_url &&
        typeof pengaturan.bg_music_url === "object"
      ) {
        pengaturan.bg_music_url =
          (pengaturan.bg_music_url as any).file?.urlPublik ||
          (pengaturan.bg_music_url as any).url ||
          "";
      }

      // Validasi format cover_url — hanya JPEG/PNG
      if (
        dataToUpdate.cover_url &&
        typeof dataToUpdate.cover_url === "string"
      ) {
        const ext = dataToUpdate.cover_url
          .split("?")[0]
          .split(".")
          .pop()
          ?.toLowerCase();
        if (!["jpg", "jpeg", "png"].includes(ext ?? "")) {
          return errorResponse(
            400,
            "Format cover tidak valid. Hanya file JPEG dan PNG yang diizinkan.",
            "VALIDATION_ERROR",
          );
        }
      }

      // Validasi format bg_music_url — hanya MP3
      if (
        pengaturan?.bg_music_url &&
        typeof pengaturan.bg_music_url === "string"
      ) {
        const ext = pengaturan.bg_music_url
          .split("?")[0]
          .split(".")
          .pop()
          ?.toLowerCase();
        if (ext !== "mp3") {
          return errorResponse(
            400,
            "Format musik tidak valid. Hanya file MP3 yang diizinkan.",
            "VALIDATION_ERROR",
          );
        }
      }

      // Upsert pengaturan jika dikirim
      if (pengaturan) {
        dataToUpdate.pengaturan = {
          upsert: {
            create: pengaturan,
            update: pengaturan,
          },
        };
      }

      // Replace daftar_isi — hapus semua lama, buat ulang
      if (Array.isArray(daftar_isi)) {
        await prisma.c_eproposal_daftar_isi.deleteMany({
          where: { m_eproposal_id: id },
        });

        if (daftar_isi.length > 0) {
          dataToUpdate.daftar_isi = {
            createMany: {
              data: daftar_isi.map((d: any, i: number) => ({
                judul: d.judul,
                halaman: d.halaman,
                urutan: d.urutan ?? i + 1,
              })),
            },
          };
        }
      }

      const updated = await prisma.m_eproposal.update({
        where: { id },
        data: dataToUpdate as any,
        include: {
          pengaturan: true,
          daftar_isi: { orderBy: { urutan: "asc" } },
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.E_PROPOSAL.SINGLE(0, id));
      await invalidateCachePrefix(
        REDIS_KEYS.E_PROPOSAL.SINGLE_BY_SLUG(updated.slug ?? ""),
      );

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/eproposal/[id] — Hapus E-Proposal
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = parseId(rawId);
      if (!id)
        return errorResponse(
          400,
          "ID E-Proposal tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.m_eproposal.findUnique({
        where: { id },
        select: { id: true, slug: true, event_id: true },
      });
      if (!existing)
        return errorResponse(404, "E-Proposal tidak ditemukan", "NOT_FOUND");

      await prisma.m_eproposal.delete({ where: { id } });

      // Invalidate cache
      await invalidateCachePrefix(
        REDIS_KEYS.E_PROPOSAL.SINGLE(existing.event_id ?? 0, id),
      );
      if (existing.slug) {
        await invalidateCachePrefix(
          REDIS_KEYS.E_PROPOSAL.SINGLE_BY_SLUG(existing.slug),
        );
      }
      await invalidateCachePrefix(
        REDIS_KEYS.E_PROPOSAL.ALL_PREFIX(existing.event_id ?? 0),
      );

      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
