import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = { params: Promise<{ id: string }> };

// GET /api/sosial-media/blazzing/[id] — Detail kampanye
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = Number(rawId);
      if (isNaN(id)) {
        return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");
      }

      const campaign = await prisma.m_blazzing_wa.findFirst({
        where: { id, dihapus_pada: null },
        include: {
          penerima: {
            where: { dihapus_pada: null },
            orderBy: { dibuat_pada: "asc" },
          },
        },
      });

      if (!campaign) {
        return errorResponse(404, "Kampanye tidak ditemukan", "NOT_FOUND");
      }

      return successResponse(campaign, 200);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// DELETE /api/sosial-media/blazzing/[id]
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = Number(rawId);
      if (isNaN(id)) {
        return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");
      }

      const existing = await prisma.m_blazzing_wa.findFirst({
        where: { id, dihapus_pada: null },
      });

      if (!existing) {
        return errorResponse(404, "Kampanye tidak ditemukan", "NOT_FOUND");
      }

      // Soft delete campaign + recipients
      const now = new Date();
      await prisma.$transaction([
        prisma.c_blazzing_penerima.updateMany({
          where: { blazzing_id: id, dihapus_pada: null },
          data: { dihapus_pada: now },
        }),
        prisma.m_blazzing_wa.update({
          where: { id },
          data: { dihapus_pada: now },
        }),
      ]);

      return successResponse({ message: "Kampanye berhasil dihapus" }, 200);
    } catch (error) {
      return handleApiError(error);
    }
  }
);
