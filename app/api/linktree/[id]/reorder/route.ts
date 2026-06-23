import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteContext = { params: Promise<{ id: string }> };

// ──────────────────────────────────────────────────────────
// PATCH /api/linktree/[id]/reorder — Reorder Link Items
// ──────────────────────────────────────────────────────────
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    // Check ownership & existence of linktree
    const linktree = await prisma.m_linktree.findFirst({
      where: {
        id,
        dihapus_pada: null,
        dibuat_oleh_id: req.user.userId,
      },
    });

    if (!linktree) {
      return errorResponse(404, "Linktree tidak ditemukan", "NOT_FOUND");
    }

    const { links } = await req.json();

    if (!Array.isArray(links)) {
      return errorResponse(400, "Format data tidak valid (harus array)", "INVALID_DATA");
    }

    // Update urutan for each link in transaction
    await prisma.$transaction(
      links.map((link: { id: number; urutan: number }) =>
        prisma.c_link_linktree.updateMany({
          where: {
            id: link.id,
            linktree_id: id,
          },
          data: {
            urutan: link.urutan,
          },
        })
      )
    );

    // Return the updated linktree profile
    const updatedLinktree = await prisma.m_linktree.findFirst({
      where: { id },
      include: {
        links: {
          where: { dihapus_pada: null },
          orderBy: { urutan: "asc" },
        },
      },
    });

    return successResponse(updatedLinktree);
  } catch (error) {
    return handleApiError(error);
  }
});
