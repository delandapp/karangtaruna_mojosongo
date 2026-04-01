import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { prisma } from "@/lib/prisma";
import { createPanitiaSchema } from "@/lib/validations/panitia.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

import { z } from "zod";

type RouteProps = { params: Promise<{ event_id: string }> };

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

const parseEventId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/panitia — List Panitia Event
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id } = await params;
      const eventId = parseEventId(event_id);
      if (!eventId)
        return errorResponse(400, "ID Event tidak valid", "VALIDATION_ERROR");

      // Verifikasi event ada
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });
      if (!event)
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

      const { searchParams } = new URL(req.url);
      const { page, limit } = listQuerySchema.parse(
        Object.fromEntries(searchParams),
      );
      const skip = (page - 1) * limit;

      // Cek cache
      const cacheKey = `${REDIS_KEYS.PANITIA.ALL(eventId)}:page:${page}:limit:${limit}`;
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);

      // Query dari database
      const [panitia, total] = await Promise.all([
        prisma.anggota_panitia.findMany({
          where: { event_id: eventId },
          skip,
          take: limit,
          orderBy: [{ divisi: "asc" }, { posisi: "asc" }],
          include: {
            user: {
              select: { id: true, nama_lengkap: true, username: true },
            },
            jabatan: { select: { id: true, nama_jabatan: true } },
          },
        }),
        prisma.anggota_panitia.count({ where: { event_id: eventId } }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const meta = { page, limit, total, totalPages };

      // Simpan ke cache
      await setCache(cacheKey, { data: panitia, meta }, DEFAULT_CACHE_TTL);

      return paginatedResponse(panitia, meta, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// POST /api/events/:event_id/panitia — Tambah Anggota Panitia
// ──────────────────────────────────────────────────────────
export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id } = await params;
      const eventId = parseEventId(event_id);
      if (!eventId)
        return errorResponse(400, "ID Event tidak valid", "VALIDATION_ERROR");

      // Verifikasi event ada dan statusnya memungkinkan penambahan panitia
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, status_event: true },
      });
      if (!event)
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

      if (
        event.status_event === "selesai" ||
        event.status_event === "dibatalkan"
      ) {
        return errorResponse(
          422,
          `Tidak dapat menambah panitia pada event yang berstatus "${event.status_event}"`,
          "UNPROCESSABLE_ENTITY",
        );
      }

      const body = await req.json();
      const data = createPanitiaSchema.parse(body);

      // Verifikasi user ada
      const userExists = await prisma.m_user.findUnique({
        where: { id: data.user_id },
        select: { id: true },
      });
      if (!userExists)
        return errorResponse(
          404,
          "User dengan ID tersebut tidak ditemukan",
          "NOT_FOUND",
        );

      // Cek duplikat user di event yang sama (@@unique([event_id, user_id]))
      const duplicate = await prisma.anggota_panitia.findUnique({
        where: {
          event_id_user_id: { event_id: eventId, user_id: data.user_id },
        },
        select: { id: true },
      });
      if (duplicate)
        return errorResponse(
          409,
          "User ini sudah terdaftar sebagai panitia pada event ini",
          "CONFLICT",
        );

      const panitia = await prisma.anggota_panitia.create({
        data: { event_id: eventId, ...data },
        include: {
          user: { select: { id: true, nama_lengkap: true, username: true } },
          jabatan: { select: { id: true, nama_jabatan: true } },
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.PANITIA.ALL_PREFIX(eventId));

      return successResponse(panitia, 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
