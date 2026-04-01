import { prisma } from "@/lib/prisma";
import { updateEventSchema } from "@/lib/validations/event.schema";
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

type RouteProps = { params: Promise<{ event_id: string }> };

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// GET /api/events/:id — Detail Event
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id } = await params;
      const eventId = parseId(event_id);

      if (!eventId) {
        return errorResponse(400, "ID Event tidak valid", "VALIDATION_ERROR");
      }

      // 1. Cek Redis cache
      const cacheKey = REDIS_KEYS.EVENTS.SINGLE(eventId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // 2. Ambil dari Elasticsearch
      const event = await getDocument(ELASTIC_INDICES.EVENTS, String(eventId));
      if (!event) {
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
      }

      // 3. Simpan ke cache
      await setCache(cacheKey, event, DEFAULT_CACHE_TTL);

      return successResponse(event, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/events/:id — Update Event
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id } = await params;
      const eventId = parseId(event_id);

      if (!eventId) {
        return errorResponse(400, "ID Event tidak valid", "VALIDATION_ERROR");
      }

      const existing = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, kode_event: true, status_event: true },
      });
      if (!existing) {
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
      }

      // Larang update event yang sudah selesai / dibatalkan
      if (
        existing.status_event === "selesai" ||
        existing.status_event === "dibatalkan"
      ) {
        return errorResponse(
          422,
          `Event dengan status "${existing.status_event}" tidak dapat diubah.`,
          "UNPROCESSABLE_ENTITY",
        );
      }

      // Pastikan kode_event tidak bisa diubah user
      const rawBody = await req.json();
      delete rawBody.kode_event;
      const validatedData = updateEventSchema.parse(rawBody);

      // Verifikasi m_organisasi_id jika berubah
      if (validatedData.m_organisasi_id) {
        const orgExists = await prisma.m_organisasi.findUnique({
          where: { id: validatedData.m_organisasi_id },
          select: { id: true },
        });
        if (!orgExists) {
          return errorResponse(
            404,
            "Organisasi dengan ID tersebut tidak ditemukan.",
            "NOT_FOUND",
          );
        }
      }

      const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
          ...(validatedData.m_organisasi_id && {
            m_organisasi_id: validatedData.m_organisasi_id,
          }),
          ...(validatedData.nama_event && {
            nama_event: validatedData.nama_event,
          }),
          tema_event: validatedData.tema_event,
          deskripsi: validatedData.deskripsi,
          ...(validatedData.jenis_event && {
            jenis_event: validatedData.jenis_event,
          }),
          ...(validatedData.status_event && {
            status_event: validatedData.status_event,
          }),
          ...(validatedData.tanggal_mulai && {
            tanggal_mulai: validatedData.tanggal_mulai,
          }),
          ...(validatedData.tanggal_selesai && {
            tanggal_selesai: validatedData.tanggal_selesai,
          }),
          lokasi: validatedData.lokasi,
          target_peserta: validatedData.target_peserta,
          realisasi_peserta: validatedData.realisasi_peserta,
          banner_url: validatedData.banner_url,
          ...(validatedData.tujuan !== undefined && {
            tujuan: validatedData.tujuan ?? undefined,
          }),
        },
        include: {
          organisasi: { select: { id: true, nama_org: true } },
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.EVENTS.SINGLE(eventId));
      await indexDocument(ELASTIC_INDICES.EVENTS, String(updated.id), updated);
      await invalidateCachePrefix(REDIS_KEYS.EVENTS.ALL_PREFIX);
      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/events/:id — Hapus Event
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id } = await params;
      const eventId = parseId(event_id);

      if (!eventId) {
        return errorResponse(400, "ID Event tidak valid", "VALIDATION_ERROR");
      }

      const existing = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, status_event: true },
      });
      if (!existing) {
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
      }

      // Larang hapus event yang sedang berlangsung atau sudah selesai
      if (
        existing.status_event === "berlangsung" ||
        existing.status_event === "selesai"
      ) {
        return errorResponse(
          422,
          `Event dengan status "${existing.status_event}" tidak dapat dihapus.`,
          "UNPROCESSABLE_ENTITY",
        );
      }

      // Hapus dari database (cascade menghapus data anak-anaknya)
      await prisma.event.delete({ where: { id: eventId } });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.EVENTS.SINGLE(eventId));
      await deleteDocument(ELASTIC_INDICES.EVENTS, String(eventId));
      await invalidateCachePrefix(REDIS_KEYS.EVENTS.ALL_PREFIX);
      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
