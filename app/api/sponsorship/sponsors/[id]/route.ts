import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

import { sponsorSchema } from "@/lib/validations/sponsorship.schema";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

const CACHE_KEY = (id: number) => `sponsor:single:${id}`;
const CACHE_INVALIDATE_PREFIX = "sponsor:all:*";

// ──────────────────────────────────────────────────────────
// GET /api/sponsorship/sponsors/[id] — Detail Sponsor
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const sponsorId = parseId(id);
      if (!sponsorId)
        return errorResponse(400, "ID Sponsor tidak valid", "VALIDATION_ERROR");

      // 1. Cek Redis cache
      const cacheKey = CACHE_KEY(sponsorId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari database
      const sponsor = await prisma.m_sponsor.findUnique({
        where: { id: sponsorId },
        include: {
          m_perusahaan: true,
          kategori: true,
          event_sponsor: {
            include: { event: true },
            orderBy: { diperbarui_pada: "desc" },
          },
        },
      });

      if (!sponsor)
        return errorResponse(404, "Sponsor tidak ditemukan", "NOT_FOUND");

      // 3. Simpan ke cache
      await setCache(cacheKey, sponsor, DEFAULT_CACHE_TTL);

      return successResponse(sponsor, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/sponsorship/sponsors/[id] — Update Sponsor
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const sponsorId = parseId(id);
      if (!sponsorId)
        return errorResponse(400, "ID Sponsor tidak valid", "VALIDATION_ERROR");

      const existing = await prisma.m_sponsor.findUnique({
        where: { id: sponsorId },
        select: {
          id: true,
          m_perusahaan_id: true,
          m_brand_id: true,
          total_disponsori: true,
        },
      });
      if (!existing)
        return errorResponse(404, "Sponsor tidak ditemukan", "NOT_FOUND");

      const body = await req.json();
      const validatedData = sponsorSchema.parse(body);

      // Cek duplikasi m_perusahaan_id jika berubah
      if (
        validatedData.m_perusahaan_id &&
        validatedData.m_perusahaan_id !== existing.m_perusahaan_id
      ) {
        const duplicate = await prisma.m_sponsor.findUnique({
          where: { m_perusahaan_id: validatedData.m_perusahaan_id },
          select: { id: true },
        });
        if (duplicate)
          return errorResponse(
            409,
            "Perusahaan ini sudah terdaftar sebagai sponsor.",
            "CONFLICT",
          );
      }

      // Cek duplikasi m_brand_id jika berubah
      if (
        validatedData.m_brand_id &&
        validatedData.m_brand_id !== existing.m_brand_id
      ) {
        const duplicate = await prisma.m_sponsor.findUnique({
          where: { m_brand_id: validatedData.m_brand_id },
          select: { id: true },
        });
        if (duplicate)
          return errorResponse(
            409,
            "Brand ini sudah terdaftar sebagai sponsor.",
            "CONFLICT",
          );
      }

      const updated = await prisma.m_sponsor.update({
        where: { id: sponsorId },
        data: {
          m_perusahaan_id: validatedData.m_perusahaan_id ?? undefined,
          m_brand_id: validatedData.m_brand_id ?? undefined,
          m_kategori_sponsor_id: validatedData.m_kategori_sponsor_id ?? null,
          total_disponsori:
            validatedData.total_disponsori ?? existing.total_disponsori,
        },
        include: {
          m_perusahaan: true,
          m_brand: true,
          kategori: true,
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(CACHE_KEY(sponsorId));
      await invalidateCachePrefix(CACHE_INVALIDATE_PREFIX);

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/sponsorship/sponsors/[id] — Hapus Sponsor
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const sponsorId = parseId(id);
      if (!sponsorId)
        return errorResponse(400, "ID Sponsor tidak valid", "VALIDATION_ERROR");

      const existing = await prisma.m_sponsor.findUnique({
        where: { id: sponsorId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Sponsor tidak ditemukan", "NOT_FOUND");

      await prisma.m_sponsor.delete({ where: { id: sponsorId } });

      // Invalidate cache
      await invalidateCachePrefix(CACHE_KEY(sponsorId));
      await invalidateCachePrefix(CACHE_INVALIDATE_PREFIX);

      return successResponse({ message: "Sponsor berhasil dihapus" }, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
