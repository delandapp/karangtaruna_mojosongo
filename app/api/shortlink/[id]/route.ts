import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaUpdateShortlink } from "@/lib/validations/shortlink.schema";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// ──────────────────────────────────────────────────────────
// GET /api/shortlink/[id] — Get Shortlink Detail
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    const shortlink = await prisma.m_shortlink.findFirst({
      where: { id, dihapus_pada: null },
      include: {
        dibuat_oleh: {
          select: { id: true, nama_lengkap: true },
        },
      },
    });

    if (!shortlink) {
      return errorResponse(404, "Shortlink tidak ditemukan", "NOT_FOUND");
    }

    const mapped = {
      ...shortlink,
      dibuat_oleh: shortlink.dibuat_oleh
        ? { id: shortlink.dibuat_oleh.id, nama: shortlink.dibuat_oleh.nama_lengkap }
        : null,
    };

    return successResponse(mapped);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// PATCH /api/shortlink/[id] — Update Shortlink
// ──────────────────────────────────────────────────────────
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    const body = await req.json();

    const parsed = schemaUpdateShortlink.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    // Check if shortlink exists
    const existing = await prisma.m_shortlink.findFirst({
      where: { id, dihapus_pada: null },
    });

    if (!existing) {
      return errorResponse(404, "Shortlink tidak ditemukan", "NOT_FOUND");
    }

    const { judul, url_tujuan, slug, deskripsi, is_aktif, kedaluwarsa_pada } = parsed.data;

    // If slug is being changed, check uniqueness
    if (slug && slug !== "" && slug !== existing.slug) {
      const slugExists = await prisma.m_shortlink.findFirst({
        where: { slug, id: { not: id } },
        select: { id: true },
      });
      if (slugExists) {
        return errorResponse(409, "Slug sudah digunakan, silakan pilih slug lain", "SLUG_CONFLICT");
      }
    }

    // Build update data
    const updateData: any = {};
    if (judul !== undefined) updateData.judul = judul;
    if (url_tujuan !== undefined) updateData.url_tujuan = url_tujuan;
    if (slug !== undefined && slug !== "") updateData.slug = slug;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi || null;
    if (is_aktif !== undefined) updateData.is_aktif = is_aktif;
    if (kedaluwarsa_pada !== undefined) {
      updateData.kedaluwarsa_pada = kedaluwarsa_pada ? new Date(kedaluwarsa_pada) : null;
    }

    const shortlink = await prisma.m_shortlink.update({
      where: { id },
      data: updateData,
      include: {
        dibuat_oleh: {
          select: { id: true, nama_lengkap: true },
        },
      },
    });

    const mapped = {
      ...shortlink,
      dibuat_oleh: shortlink.dibuat_oleh
        ? { id: shortlink.dibuat_oleh.id, nama: shortlink.dibuat_oleh.nama_lengkap }
        : null,
    };

    return successResponse(mapped);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/shortlink/[id] — Soft Delete Shortlink
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    const existing = await prisma.m_shortlink.findFirst({
      where: { id, dihapus_pada: null },
    });

    if (!existing) {
      return errorResponse(404, "Shortlink tidak ditemukan", "NOT_FOUND");
    }

    await prisma.m_shortlink.update({
      where: { id },
      data: { dihapus_pada: new Date() },
    });

    return successResponse({ message: "Shortlink berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
});
