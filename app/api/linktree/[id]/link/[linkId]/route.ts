import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaUpdateLinkLinktree } from "@/lib/validations/linktree.schema";

type RouteContext = { params: Promise<{ id: string; linkId: string }> };

// ──────────────────────────────────────────────────────────
// PATCH /api/linktree/[id]/link/[linkId] — Update Link Item
// ──────────────────────────────────────────────────────────
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam, linkId: linkIdParam } = await context.params;
    const id = Number(idParam);
    const linkId = Number(linkIdParam);

    if (isNaN(id) || isNaN(linkId)) {
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

    // Check existence of the link item
    const existingLink = await prisma.c_link_linktree.findFirst({
      where: {
        id: linkId,
        linktree_id: id,
        dihapus_pada: null,
      },
    });

    if (!existingLink) {
      return errorResponse(404, "Link item tidak ditemukan", "NOT_FOUND");
    }

    const body = await req.json();
    const parsed = schemaUpdateLinkLinktree.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const updateData = parsed.data;

    await prisma.c_link_linktree.update({
      where: { id: linkId },
      data: {
        judul: updateData.judul,
        url: updateData.url,
        ikon: updateData.ikon !== undefined ? (updateData.ikon || null) : undefined,
        warna_ikon: updateData.warna_ikon !== undefined ? (updateData.warna_ikon || null) : undefined,
        aktif: updateData.aktif,
        warna_latar: updateData.warna_latar !== undefined ? (updateData.warna_latar || null) : undefined,
        warna_teks: updateData.warna_teks !== undefined ? (updateData.warna_teks || null) : undefined,
        warna_border: updateData.warna_border !== undefined ? (updateData.warna_border || null) : undefined,
        animasi: updateData.animasi !== undefined ? (updateData.animasi || null) : undefined,
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

// ──────────────────────────────────────────────────────────
// DELETE /api/linktree/[id]/link/[linkId] — Delete Link Item
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam, linkId: linkIdParam } = await context.params;
    const id = Number(idParam);
    const linkId = Number(linkIdParam);

    if (isNaN(id) || isNaN(linkId)) {
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

    // Check existence of the link item
    const existingLink = await prisma.c_link_linktree.findFirst({
      where: {
        id: linkId,
        linktree_id: id,
        dihapus_pada: null,
      },
    });

    if (!existingLink) {
      return errorResponse(404, "Link item tidak ditemukan", "NOT_FOUND");
    }

    // Soft delete the link item
    await prisma.c_link_linktree.update({
      where: { id: linkId },
      data: { dihapus_pada: new Date() },
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
