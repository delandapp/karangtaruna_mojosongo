import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaTambahLinkLinktree } from "@/lib/validations/linktree.schema";

type RouteContext = { params: Promise<{ id: string }> };

// ──────────────────────────────────────────────────────────
// POST /api/linktree/[id]/link — Add Link Item
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID Linktree tidak valid", "INVALID_ID");
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

    const body = await req.json();
    const parsed = schemaTambahLinkLinktree.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const newLinkData = parsed.data;

    // Get max order (urutan) to place the new link at the end
    const lastLink = await prisma.c_link_linktree.findFirst({
      where: { linktree_id: id, dihapus_pada: null },
      orderBy: { urutan: "desc" },
      select: { urutan: true },
    });

    const nextUrutan = lastLink ? lastLink.urutan + 1 : 0;

    const newLink = await prisma.c_link_linktree.create({
      data: {
        linktree_id: id,
        judul: newLinkData.judul,
        url: newLinkData.url,
        ikon: newLinkData.ikon || null,
        warna_ikon: newLinkData.warna_ikon || null,
        aktif: newLinkData.aktif,
        urutan: nextUrutan,
        warna_latar: newLinkData.warna_latar || null,
        warna_teks: newLinkData.warna_teks || null,
        warna_border: newLinkData.warna_border || null,
        animasi: newLinkData.animasi || null,
      },
    });

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
