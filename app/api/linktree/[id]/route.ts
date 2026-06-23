import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaUpdateLinktree } from "@/lib/validations/linktree.schema";

type RouteContext = { params: Promise<{ id: string }> };

// ──────────────────────────────────────────────────────────
// GET /api/linktree/[id] — Detail Linktree Profile
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    const linktree = await prisma.m_linktree.findFirst({
      where: {
        id,
        dihapus_pada: null,
        dibuat_oleh_id: req.user.userId,
      },
      include: {
        links: {
          where: { dihapus_pada: null },
          orderBy: { urutan: "asc" },
        },
      },
    });

    if (!linktree) {
      return errorResponse(404, "Linktree tidak ditemukan", "NOT_FOUND");
    }

    return successResponse(linktree);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// PATCH /api/linktree/[id] — Update Linktree Profile
// ──────────────────────────────────────────────────────────
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    const body = await req.json();
    const parsed = schemaUpdateLinktree.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    // Check ownership & existence
    const existing = await prisma.m_linktree.findFirst({
      where: {
        id,
        dihapus_pada: null,
        dibuat_oleh_id: req.user.userId,
      },
    });

    if (!existing) {
      return errorResponse(404, "Linktree tidak ditemukan", "NOT_FOUND");
    }

    const ltData = parsed.data;

    // Check slug uniqueness if it changes
    if (ltData.slug && ltData.slug !== existing.slug) {
      const slugExists = await prisma.m_linktree.findFirst({
        where: { slug: ltData.slug, id: { not: id }, dihapus_pada: null },
        select: { id: true },
      });
      if (slugExists) {
        return errorResponse(409, "Slug sudah digunakan, silakan pilih slug lain", "SLUG_CONFLICT");
      }
    }

    const linktree = await prisma.m_linktree.update({
      where: { id },
      data: {
        slug: ltData.slug,
        judul: ltData.judul,
        bio: ltData.bio !== undefined ? (ltData.bio || null) : undefined,
        tema: ltData.tema,
        foto_profil_url: ltData.foto_profil_url !== undefined ? (ltData.foto_profil_url || null) : undefined,
        warna_primer: ltData.warna_primer !== undefined ? (ltData.warna_primer || null) : undefined,
        warna_latar: ltData.warna_latar !== undefined ? (ltData.warna_latar || null) : undefined,
        font_kustom: ltData.font_kustom !== undefined ? (ltData.font_kustom || null) : undefined,
        bg_image_url: ltData.bg_image_url !== undefined ? (ltData.bg_image_url || null) : undefined,
        gaya_tombol: ltData.gaya_tombol !== undefined ? (ltData.gaya_tombol || null) : undefined,
        animasi_tombol: ltData.animasi_tombol !== undefined ? (ltData.animasi_tombol || null) : undefined,
        warna_tombol_latar: ltData.warna_tombol_latar !== undefined ? (ltData.warna_tombol_latar || null) : undefined,
        warna_tombol_teks: ltData.warna_tombol_teks !== undefined ? (ltData.warna_tombol_teks || null) : undefined,
        warna_tombol_border: ltData.warna_tombol_border !== undefined ? (ltData.warna_tombol_border || null) : undefined,
        border_radius_tombol: ltData.border_radius_tombol !== undefined ? (ltData.border_radius_tombol || null) : undefined,
        sosmed_instagram: ltData.sosmed_instagram !== undefined ? (ltData.sosmed_instagram || null) : undefined,
        sosmed_tiktok: ltData.sosmed_tiktok !== undefined ? (ltData.sosmed_tiktok || null) : undefined,
        sosmed_whatsapp: ltData.sosmed_whatsapp !== undefined ? (ltData.sosmed_whatsapp || null) : undefined,
        sosmed_facebook: ltData.sosmed_facebook !== undefined ? (ltData.sosmed_facebook || null) : undefined,
        sosmed_youtube: ltData.sosmed_youtube !== undefined ? (ltData.sosmed_youtube || null) : undefined,
        sosmed_github: ltData.sosmed_github !== undefined ? (ltData.sosmed_github || null) : undefined,
        sosmed_email: ltData.sosmed_email !== undefined ? (ltData.sosmed_email || null) : undefined,
        sosmed_telepon: ltData.sosmed_telepon !== undefined ? (ltData.sosmed_telepon || null) : undefined,
        meta_judul: ltData.meta_judul !== undefined ? (ltData.meta_judul || null) : undefined,
        meta_deskripsi: ltData.meta_deskripsi !== undefined ? (ltData.meta_deskripsi || null) : undefined,
        aktif: ltData.aktif,
      },
      include: {
        links: {
          where: { dihapus_pada: null },
          orderBy: { urutan: "asc" },
        },
      },
    });

    return successResponse(linktree);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/linktree/[id] — Soft Delete Linktree Profile
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    const existing = await prisma.m_linktree.findFirst({
      where: {
        id,
        dihapus_pada: null,
        dibuat_oleh_id: req.user.userId,
      },
    });

    if (!existing) {
      return errorResponse(404, "Linktree tidak ditemukan", "NOT_FOUND");
    }

    await prisma.m_linktree.update({
      where: { id },
      data: { dihapus_pada: new Date() },
    });

    return successResponse({ message: "Linktree berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
});
