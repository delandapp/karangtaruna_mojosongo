import { prisma } from "@/lib/prisma";
import { updateLevelSchema } from "@/lib/validations/level.schema";
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

/**
 * GET /api/levels/[id]
 * Ambil detail level by ID. Prioritas: Redis cache → Elasticsearch.
 */
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const levelId = parseId(id);
      if (!levelId)
        return errorResponse(400, "ID Level tidak valid", "VALIDATION_ERROR");

      const cacheKey = REDIS_KEYS.LEVELS.SINGLE(levelId);

      // 1. Cek Redis cache
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari Elasticsearch
      const level = await getDocument(ELASTIC_INDICES.LEVELS, levelId);
      if (!level)
        return errorResponse(404, "Level tidak ditemukan", "NOT_FOUND");

      // 3. Simpan ke cache
      await setCache(cacheKey, level, DEFAULT_CACHE_TTL);

      return successResponse(level, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

/**
 * PUT /api/levels/[id]
 * Update data level. ES sync dilakukan langsung.
 * Invalidate cache.
 */
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const levelId = parseId(id);
      if (!levelId)
        return errorResponse(400, "ID Level tidak valid", "VALIDATION_ERROR");

      const existing = await prisma.m_level.findUnique({
        where: { id: levelId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Level tidak ditemukan", "NOT_FOUND");

      const body = await req.json();
      const validatedData = updateLevelSchema.parse(body);

      const updated = await prisma.m_level.update({
        where: { id: levelId },
        data: { nama_level: validatedData.nama_level },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.LEVELS.SINGLE(levelId));
      await indexDocument(ELASTIC_INDICES.LEVELS, String(updated.id), updated);
      await invalidateCachePrefix(REDIS_KEYS.LEVELS.ALL_PREFIX);
      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

/**
 * DELETE /api/levels/[id]
 * Hapus level.
 * Invalidate cache.
 */
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const levelId = parseId(id);
      if (!levelId)
        return errorResponse(400, "ID Level tidak valid", "VALIDATION_ERROR");

      const existing = await prisma.m_level.findUnique({
        where: { id: levelId },
        select: { id: true },
      });
      if (!existing)
        return errorResponse(404, "Level tidak ditemukan", "NOT_FOUND");

      await prisma.m_level.delete({ where: { id: levelId } });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.LEVELS.SINGLE(levelId));
      await deleteDocument(ELASTIC_INDICES.LEVELS, String(id));
      await invalidateCachePrefix(REDIS_KEYS.LEVELS.ALL_PREFIX);
      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
