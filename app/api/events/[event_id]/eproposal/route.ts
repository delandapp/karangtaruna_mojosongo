import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = { params: Promise<{ event_id: string }> };

/**
 * GET /api/events/:event_id/eproposal
 *
 * Ambil e-proposal milik event tertentu.
 * Mengembalikan null jika belum ada (bukan error).
 */
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id } = await params;
      const eventId = Number(event_id);

      if (isNaN(eventId) || eventId <= 0) {
        return errorResponse(400, "ID Event tidak valid", "VALIDATION_ERROR");
      }

      // Verifikasi event ada
      const eventExists = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });
      if (!eventExists) {
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
      }

      const proposal = await prisma.m_eproposal.findUnique({
        where: { event_id: eventId },
        include: {
          pengaturan: true,
          daftar_isi: { orderBy: { urutan: "asc" } },
        },
      });

      // proposal bisa null jika belum dibuat — ini bukan error
      return successResponse(proposal, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
