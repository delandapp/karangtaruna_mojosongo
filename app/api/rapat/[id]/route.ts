import { prisma } from "@/lib/prisma";
import { updateRapatSchema } from "@/lib/validations/rapat.schema";
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
// GET /api/rapat/:id — Detail Rapat
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const rapatId = parseId(id);
      if (!rapatId)
        return errorResponse(400, "ID Rapat tidak valid", "VALIDATION_ERROR");

      // 1. Cek Redis cache
      const cacheKey = REDIS_KEYS.RAPAT.SINGLE(rapatId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari Elasticsearch
      const rapat = await getDocument(ELASTIC_INDICES.RAPAT, rapatId);
      if (!rapat)
        return errorResponse(404, "Rapat tidak ditemukan", "NOT_FOUND");

      // 3. Simpan ke cache
      await setCache(cacheKey, rapat, DEFAULT_CACHE_TTL);

      return successResponse(rapat, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/rapat/:id — Update Rapat
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const rapatId = parseId(id);
      if (!rapatId)
        return errorResponse(400, "ID Rapat tidak valid", "VALIDATION_ERROR");

      const existing = await prisma.rapat.findUnique({
        where: { id: rapatId },
        select: { id: true, status: true },
      });
      if (!existing)
        return errorResponse(404, "Rapat tidak ditemukan", "NOT_FOUND");

      // Larang update rapat yang sudah selesai atau dibatalkan
      if (existing.status === "selesai" || existing.status === "dibatalkan") {
        return errorResponse(
          422,
          `Rapat dengan status "${existing.status}" tidak dapat diubah`,
          "UNPROCESSABLE_ENTITY",
        );
      }

      const data = updateRapatSchema.parse(await req.json());

      // Validasi event_id jika diberikan
      if (data.event_id) {
        const eventExists = await prisma.event.findUnique({
          where: { id: data.event_id },
          select: { id: true },
        });
        if (!eventExists)
          return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
      }

      const updated = await prisma.rapat.update({
        where: { id: rapatId },
        data: {
          event_id: data.event_id,
          judul: data.judul,
          tanggal_rapat: data.tanggal_rapat,
          lokasi: data.lokasi,
          notulensi: data.notulensi,
          status: data.status,
          agenda: data.agenda !== undefined ? (data.agenda as any) : undefined,
          action_items:
            data.action_items !== undefined
              ? (data.action_items as any)
              : undefined,
        },
        include: {
          event: { select: { id: true, nama_event: true, kode_event: true } },
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.RAPAT.SINGLE(rapatId));
      await indexDocument(ELASTIC_INDICES.RAPAT, String(updated.id), updated);
      await invalidateCachePrefix(REDIS_KEYS.RAPAT.ALL_PREFIX);
      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/rapat/:id — Hapus Rapat
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const rapatId = parseId(id);
      if (!rapatId)
        return errorResponse(400, "ID Rapat tidak valid", "VALIDATION_ERROR");

      const existing = await prisma.rapat.findUnique({
        where: { id: rapatId },
        select: { id: true, status: true },
      });
      if (!existing)
        return errorResponse(404, "Rapat tidak ditemukan", "NOT_FOUND");

      // Larang hapus rapat yang sedang berlangsung
      if (existing.status === "berlangsung") {
        return errorResponse(
          422,
          "Rapat yang sedang berlangsung tidak dapat dihapus",
          "UNPROCESSABLE_ENTITY",
        );
      }

      await prisma.rapat.delete({ where: { id: rapatId } });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.RAPAT.SINGLE(rapatId));
      await deleteDocument(ELASTIC_INDICES.RAPAT, String(id));
      await invalidateCachePrefix(REDIS_KEYS.RAPAT.ALL_PREFIX);
      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
