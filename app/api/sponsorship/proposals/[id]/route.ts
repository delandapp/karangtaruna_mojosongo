import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { proposalSponsorSchema } from "@/lib/validations/sponsorship.schema";

type RouteProps = { params: Promise<{ id: string }> };

const CACHE_INVALIDATE_PREFIX = "sponsorship:proposal:all:*";

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// GET /api/sponsorship/proposals/[id] — Detail Proposal Sponsorship
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const proposalId = parseId(id);
      if (!proposalId)
        return errorResponse(
          400,
          "ID Proposal tidak valid",
          "VALIDATION_ERROR",
        );

      const proposal = await prisma.proposal_sponsor.findUnique({
        where: { id: proposalId },
        include: {
          sponsor: { include: { m_perusahaan: true } },
          dikirim_oleh: { select: { id: true, nama_lengkap: true } },
        },
      });

      if (!proposal)
        return errorResponse(404, "Proposal tidak ditemukan", "NOT_FOUND");

      return successResponse(proposal, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/sponsorship/proposals/[id] — Update Proposal Sponsorship
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const proposalId = parseId(id);
      if (!proposalId)
        return errorResponse(
          400,
          "ID Proposal tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.proposal_sponsor.findUnique({
        where: { id: proposalId },
        select: { id: true, respons: true },
      });
      if (!existing)
        return errorResponse(404, "Data proposal tidak ditemukan", "NOT_FOUND");

      const body = await req.json();
      const validatedData = proposalSponsorSchema.parse(body);

      const updated = await prisma.proposal_sponsor.update({
        where: { id: proposalId },
        data: {
          event_id: validatedData.event_id,
          m_sponsor_id: validatedData.m_sponsor_id,
          dikirim_oleh_id: validatedData.dikirim_oleh_id,
          tier_diusulkan: validatedData.tier_diusulkan,
          respons: validatedData.respons ?? existing.respons,
          url_file_proposal: validatedData.url_file_proposal,
          catatan: validatedData.catatan,
        },
        include: {
          sponsor: { include: { m_perusahaan: true } },
          dikirim_oleh: { select: { id: true, nama_lengkap: true } },
        },
      });

      // Invalidate list cache via Kafka — CDC akan sync ke ES secara otomatis
      await produceCacheInvalidate(CACHE_INVALIDATE_PREFIX);

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/sponsorship/proposals/[id] — Hapus Proposal Sponsorship
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const proposalId = parseId(id);
      if (!proposalId)
        return errorResponse(
          400,
          "ID Proposal tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.proposal_sponsor.findUnique({
        where: { id: proposalId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Data proposal tidak ditemukan", "NOT_FOUND");

      await prisma.proposal_sponsor.delete({ where: { id: proposalId } });

      // Invalidate list cache via Kafka
      await produceCacheInvalidate(CACHE_INVALIDATE_PREFIX);

      return successResponse({ message: "Proposal berhasil dihapus" }, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
