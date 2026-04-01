import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { invalidateCachePrefix } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

import { eventSponsorSchema } from "@/lib/validations/sponsorship.schema";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

const CACHE_INVALIDATE_PREFIX = "pipeline:all:*";

// ──────────────────────────────────────────────────────────
// GET /api/sponsorship/pipelines/[id] — Detail Pipeline
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const pipelineId = parseId(id);
      if (!pipelineId)
        return errorResponse(
          400,
          "ID Pipeline tidak valid",
          "VALIDATION_ERROR",
        );

      const pipeline = await prisma.event_sponsor.findUnique({
        where: { id: pipelineId },
        include: {
          sponsor: { include: { m_perusahaan: true, kategori: true } },
          event: true,
          ditangani_oleh: { select: { id: true, nama_lengkap: true } },
        },
      });

      if (!pipeline)
        return errorResponse(404, "Data pipeline tidak ditemukan", "NOT_FOUND");

      return successResponse(pipeline, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/sponsorship/pipelines/[id] — Update Pipeline
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const pipelineId = parseId(id);
      if (!pipelineId)
        return errorResponse(
          400,
          "ID Pipeline tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.event_sponsor.findUnique({
        where: { id: pipelineId },
      });
      if (!existing)
        return errorResponse(404, "Data pipeline tidak ditemukan", "NOT_FOUND");

      const body = await req.json();
      const validatedData = eventSponsorSchema.parse(body);

      const sponsorId = validatedData.m_sponsor_id ?? existing.m_sponsor_id;

      // Cek duplikasi jika event_id atau m_sponsor_id berubah
      if (
        validatedData.event_id !== existing.event_id ||
        sponsorId !== existing.m_sponsor_id
      ) {
        const duplicate = await prisma.event_sponsor.findUnique({
          where: {
            event_id_m_sponsor_id: {
              event_id: validatedData.event_id,
              m_sponsor_id: sponsorId,
            },
          },
        });
        if (duplicate)
          return errorResponse(
            409,
            "Sponsor ini sudah dimasukkan ke pipeline event tersebut.",
            "CONFLICT",
          );
      }

      const updated = await prisma.event_sponsor.update({
        where: { id: pipelineId },
        data: {
          event_id: validatedData.event_id,
          m_sponsor_id: sponsorId,
          ditangani_oleh_id:
            validatedData.ditangani_oleh_id ?? existing.ditangani_oleh_id,
          tier: validatedData.tier,
          jenis_kontribusi: validatedData.jenis_kontribusi,
          status_pipeline: validatedData.status_pipeline,
          jumlah_disepakati: validatedData.jumlah_disepakati,
          jumlah_diterima: validatedData.jumlah_diterima,
          deskripsi_inkind: validatedData.deskripsi_inkind,
          benefit_disepakati: validatedData.benefit_disepakati ?? undefined,
          benefit_terealisasi: validatedData.benefit_terealisasi ?? undefined,
          url_mou: validatedData.url_mou,
          // Set dikonfirmasi_pada saat status pertama kali dikonfirmasi
          dikonfirmasi_pada:
            validatedData.status_pipeline === "dikonfirmasi" &&
            existing.status_pipeline !== "dikonfirmasi"
              ? new Date()
              : existing.dikonfirmasi_pada,
        },
        include: {
          sponsor: { include: { m_perusahaan: true } },
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(CACHE_INVALIDATE_PREFIX);

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/sponsorship/pipelines/[id] — Hapus Pipeline
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const pipelineId = parseId(id);
      if (!pipelineId)
        return errorResponse(
          400,
          "ID Pipeline tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.event_sponsor.findUnique({
        where: { id: pipelineId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Data pipeline tidak ditemukan", "NOT_FOUND");

      await prisma.event_sponsor.delete({ where: { id: pipelineId } });

      // Invalidate cache
      await invalidateCachePrefix(CACHE_INVALIDATE_PREFIX);

      return successResponse(
        { message: "Data pipeline berhasil dihapus" },
        200,
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
);
