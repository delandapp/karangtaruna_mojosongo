import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// ──────────────────────────────────────────────────────────
// GET /api/sosial-media/platform — Get Active Platforms
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const platforms = await prisma.m_platform.findMany({
      where: {
        aktif: true,
        dihapus_pada: null,
      },
      orderBy: {
        nama: "asc",
      },
    });

    return successResponse(platforms, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
