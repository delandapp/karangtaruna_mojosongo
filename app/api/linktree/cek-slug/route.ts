import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// ──────────────────────────────────────────────────────────
// GET /api/linktree/cek-slug — Check slug availability
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "";
    const excludeIdParam = searchParams.get("excludeId");
    const excludeId = excludeIdParam ? Number(excludeIdParam) : undefined;

    if (!slug) {
      return errorResponse(400, "Slug wajib diisi", "SLUG_REQUIRED");
    }

    const where: any = {
      slug: slug.toLowerCase().trim(),
      dihapus_pada: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await prisma.m_linktree.findFirst({
      where,
      select: { id: true },
    });

    return successResponse({
      tersedia: !existing,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
