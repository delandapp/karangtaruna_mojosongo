import { prisma } from "@/lib/prisma";
import { updateJabatanSchema } from "@/lib/validations/jabatan.schema";
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

interface RouteProps {
  params: Promise<{ id: string }>;
}

// ──────────────────────────────────────────────────────────
// GET /api/jabatans/:id — Detail Jabatan
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, props: RouteProps) => {
    try {
      const { id } = await props.params;
      const jabatanId = parseInt(id, 10);

      if (isNaN(jabatanId)) {
        return errorResponse(400, "ID Jabatan tidak valid", "BAD_REQUEST");
      }

      // 1. Cek Cache Redis
      const cacheKey = REDIS_KEYS.JABATANS.SINGLE(jabatanId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari Elasticsearch
      const jabatan = await getDocument(ELASTIC_INDICES.JABATANS, jabatanId);
      if (!jabatan) {
        return errorResponse(404, "Jabatan tidak ditemukan", "NOT_FOUND");
      }

      // 3. Simpan ke cache
      await setCache(cacheKey, jabatan, DEFAULT_CACHE_TTL);

      return successResponse(jabatan, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/jabatans/:id — Update Jabatan
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, props: RouteProps) => {
    try {
      const { id } = await props.params;
      const jabatanId = parseInt(id, 10);

      if (isNaN(jabatanId)) {
        return errorResponse(400, "ID Jabatan tidak valid", "BAD_REQUEST");
      }

      const existing = await prisma.m_jabatan.findUnique({
        where: { id: jabatanId },
        select: { id: true },
      });
      if (!existing) {
        return errorResponse(404, "Jabatan tidak ditemukan", "NOT_FOUND");
      }

      const body = await req.json();
      const validatedData = updateJabatanSchema.parse(body);

      const updated = await prisma.m_jabatan.update({
        where: { id: jabatanId },
        data: {
          nama_jabatan: validatedData.nama_jabatan,
          deskripsi_jabatan: validatedData.deskripsi_jabatan,
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.JABATANS.SINGLE(jabatanId));
      await indexDocument(
        ELASTIC_INDICES.JABATANS,
        String(updated.id),
        updated,
      );
      await invalidateCachePrefix(REDIS_KEYS.JABATANS.ALL_PREFIX);
      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/jabatans/:id — Hapus Jabatan
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, props: RouteProps) => {
    try {
      const { id } = await props.params;
      const jabatanId = parseInt(id, 10);

      if (isNaN(jabatanId)) {
        return errorResponse(400, "ID Jabatan tidak valid", "BAD_REQUEST");
      }

      const existing = await prisma.m_jabatan.findUnique({
        where: { id: jabatanId },
        select: { id: true },
      });
      if (!existing) {
        return errorResponse(404, "Jabatan tidak ditemukan", "NOT_FOUND");
      }

      await prisma.m_jabatan.delete({ where: { id: jabatanId } });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.JABATANS.SINGLE(jabatanId));
      await deleteDocument(ELASTIC_INDICES.JABATANS, String(id));
      await invalidateCachePrefix(REDIS_KEYS.JABATANS.ALL_PREFIX);
      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
