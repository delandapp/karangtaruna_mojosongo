import { prisma } from "@/lib/prisma";
import { updateSektorIndustriSchema } from "@/lib/validations/perusahaan.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import {
  REDIS_KEYS,
  ELASTIC_INDICES,
  DEFAULT_CACHE_TTL,
} from "@/lib/constants";
import { getDocument } from "@/lib/elasticsearch";
import { produceCacheInvalidate } from "@/lib/kafka";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// GET /api/sektor-industri/:id — Detail Sektor Industri
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const itemId = parseId(id);
      if (!itemId)
        return errorResponse(
          400,
          "ID Sektor Industri tidak valid",
          "VALIDATION_ERROR",
        );

      // 1. Cek Redis cache
      const cacheKey = REDIS_KEYS.SEKTOR_INDUSTRI.SINGLE(itemId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari Elasticsearch
      const item = await getDocument(
        ELASTIC_INDICES.SEKTOR_INDUSTRI,
        String(itemId),
      );
      if (!item)
        return errorResponse(
          404,
          "Data sektor industri tidak ditemukan",
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
// PUT /api/sektor-industri/:id — Update Sektor Industri
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const itemId = parseId(id);
      if (!itemId)
        return errorResponse(
          400,
          "ID Sektor Industri tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.m_sektor_industri.findUnique({
        where: { id: itemId },
      });
      if (!existing)
        return errorResponse(
          404,
          "Data sektor industri tidak ditemukan",
          "NOT_FOUND",
        );

      const body = await req.json();
      const validatedData = updateSektorIndustriSchema.parse(body);

      // Cek duplikasi jika nama berubah
      if (
        validatedData.nama_sektor &&
        validatedData.nama_sektor !== existing.nama_sektor
      ) {
        const nameExists = await prisma.m_sektor_industri.findUnique({
          where: { nama_sektor: validatedData.nama_sektor },
        });
        if (nameExists)
          return errorResponse(
            409,
            "Nama Sektor Industri sudah ada",
            "CONFLICT",
          );
      }

      const updated = await prisma.m_sektor_industri.update({
        where: { id: itemId },
        data: validatedData,
      });

      // Invalidate cache — CDC akan sync ke ES secara otomatis
      await produceCacheInvalidate(REDIS_KEYS.SEKTOR_INDUSTRI.SINGLE(itemId));
      await produceCacheInvalidate(REDIS_KEYS.SEKTOR_INDUSTRI.ALL_PREFIX);

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/sektor-industri/:id — Hapus Sektor Industri
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const itemId = parseId(id);
      if (!itemId)
        return errorResponse(
          400,
          "ID Sektor Industri tidak valid",
          "VALIDATION_ERROR",
        );

      const existing = await prisma.m_sektor_industri.findUnique({
        where: { id: itemId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(
          404,
          "Data sektor industri tidak ditemukan",
          "NOT_FOUND",
        );

      await prisma.m_sektor_industri.delete({ where: { id: itemId } });

      // Invalidate cache — CDC akan remove dari ES secara otomatis
      await produceCacheInvalidate(REDIS_KEYS.SEKTOR_INDUSTRI.SINGLE(itemId));
      await produceCacheInvalidate(REDIS_KEYS.SEKTOR_INDUSTRI.ALL_PREFIX);

      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
