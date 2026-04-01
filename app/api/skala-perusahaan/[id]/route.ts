import { prisma } from "@/lib/prisma";
import { updateSkalaPerusahaanSchema } from "@/lib/validations/perusahaan.schema";
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
// GET /api/skala-perusahaan/:id — Detail Skala Perusahaan
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const itemId = parseId(id);
      if (!itemId)
        return errorResponse(
          400,
          "ID Skala Perusahaan tidak valid",
          "VALIDATION_ERROR",
        );

      // 1. Cek Redis cache
      const cacheKey = REDIS_KEYS.SKALA_PERUSAHAAN.SINGLE(itemId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari Elasticsearch
      const item = await getDocument(
        ELASTIC_INDICES.SKALA_PERUSAHAAN,
        String(itemId),
      );
      if (!item)
        return errorResponse(
          404,
          "Data skala perusahaan tidak ditemukan",
          "NOT_FOUND",
        );

      // 3. Simpan ke cache
      await setCache(cacheKey, item, DEFAULT_CACHE_TTL);

      return successResponse(item, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/skala-perusahaan/:id — Update Skala Perusahaan
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const itemId = parseId(id);
      if (!itemId)
        return errorResponse(
          400,
          "ID Skala Perusahaan tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.m_skala_perusahaan.findUnique({
        where: { id: itemId },
      });
      if (!existing)
        return errorResponse(
          404,
          "Data skala perusahaan tidak ditemukan",
          "NOT_FOUND",
        );

      const body = await req.json();
      const validatedData = updateSkalaPerusahaanSchema.parse(body);

      // Cek duplikasi jika nama berubah
      if (validatedData.nama && validatedData.nama !== existing.nama) {
        const nameExists = await prisma.m_skala_perusahaan.findUnique({
          where: { nama: validatedData.nama },
        });
        if (nameExists)
          return errorResponse(
            409,
            "Nama Skala Perusahaan sudah ada",
            "CONFLICT",
          );
      }

      const updated = await prisma.m_skala_perusahaan.update({
        where: { id: itemId },
        data: validatedData,
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.SKALA_PERUSAHAAN.SINGLE(itemId));
      await indexDocument(
        ELASTIC_INDICES.SKALA_PERUSAHAAN,
        String(updated.id),
        updated,
      );
      await invalidateCachePrefix(REDIS_KEYS.SKALA_PERUSAHAAN.ALL_PREFIX);
      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/skala-perusahaan/:id — Hapus Skala Perusahaan
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const itemId = parseId(id);
      if (!itemId)
        return errorResponse(
          400,
          "ID Skala Perusahaan tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.m_skala_perusahaan.findUnique({
        where: { id: itemId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(
          404,
          "Data skala perusahaan tidak ditemukan",
          "NOT_FOUND",
        );

      await prisma.m_skala_perusahaan.delete({ where: { id: itemId } });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.SKALA_PERUSAHAAN.SINGLE(itemId));
      await deleteDocument(ELASTIC_INDICES.SKALA_PERUSAHAAN, String(id));
      await invalidateCachePrefix(REDIS_KEYS.SKALA_PERUSAHAAN.ALL_PREFIX);
      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
