import { prisma } from "@/lib/prisma";
import { updateOrganisasiSchema } from "@/lib/validations/organisasi.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import {
  REDIS_KEYS,
  ELASTIC_INDICES,
  DEFAULT_CACHE_TTL,
} from "@/lib/constants";
import {
  getDocument,
  indexDocument,
  deleteDocument,
} from "@/lib/elasticsearch";

import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// GET /api/organisasi/:id — Detail Organisasi
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const organisasiId = parseId(id);
      if (!organisasiId)
        return errorResponse(
          400,
          "ID Organisasi tidak valid",
          "VALIDATION_ERROR",
        );

      // 1. Cek Redis cache
      const cacheKey = REDIS_KEYS.ORGANISASI.SINGLE(organisasiId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari Elasticsearch
      const organisasi = await getDocument(
        ELASTIC_INDICES.ORGANISASI,
        String(organisasiId),
      );
      if (!organisasi)
        return errorResponse(
          404,
          "Data organisasi tidak ditemukan",
          "NOT_FOUND",
        );

      // 3. Simpan ke cache
      await setCache(cacheKey, organisasi, DEFAULT_CACHE_TTL);

      return successResponse(organisasi, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/organisasi/:id — Update Organisasi
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const organisasiId = parseId(id);
      if (!organisasiId)
        return errorResponse(
          400,
          "ID Organisasi tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.m_organisasi.findUnique({
        where: { id: organisasiId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(
          404,
          "Data organisasi tidak ditemukan",
          "NOT_FOUND",
        );

      const body = await req.json();
      const validatedData = updateOrganisasiSchema.parse(body);

      const updated = await prisma.m_organisasi.update({
        where: { id: organisasiId },
        data: {
          nama_org: validatedData.nama_org,
          kode_wilayah_induk_kelurahan:
            validatedData.kode_wilayah_induk_kelurahan,
          kode_wilayah_induk_kecamatan:
            validatedData.kode_wilayah_induk_kecamatan,
          kode_wilayah_induk_kota: validatedData.kode_wilayah_induk_kota,
          kode_wilayah_induk_provinsi:
            validatedData.kode_wilayah_induk_provinsi,
          no_handphone: validatedData.no_handphone,
          email: validatedData.email,
          alamat: validatedData.alamat,
          logo_url: validatedData.logo_url,
          visi: validatedData.visi,
          misi: validatedData.misi,
          media_sosial: validatedData.media_sosial ?? undefined,
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.ORGANISASI.SINGLE(organisasiId));
      await indexDocument(
        ELASTIC_INDICES.ORGANISASI,
        String(updated.id),
        updated,
      );
      await invalidateCachePrefix(REDIS_KEYS.ORGANISASI.ALL_PREFIX);
      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/organisasi/:id — Hapus Organisasi
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const organisasiId = parseId(id);
      if (!organisasiId)
        return errorResponse(
          400,
          "ID Organisasi tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.m_organisasi.findUnique({
        where: { id: organisasiId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(
          404,
          "Data organisasi tidak ditemukan",
          "NOT_FOUND",
        );

      await prisma.m_organisasi.delete({ where: { id: organisasiId } });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.ORGANISASI.SINGLE(organisasiId));
      await deleteDocument(ELASTIC_INDICES.ORGANISASI, String(id));
      await invalidateCachePrefix(REDIS_KEYS.ORGANISASI.ALL_PREFIX);
      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
