import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { prisma } from "@/lib/prisma";
import { createTugasSchema } from "@/lib/validations/tugas.schema";
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
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  prioritas: z.string().optional(),
  ditugaskan_ke_id: z.coerce.number().int().positive().optional(),
});

const parseEventId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/tugas — List Tugas Event
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id } = await params;
      const eventId = parseEventId(event_id);
      if (!eventId)
        return errorResponse(400, "ID Event tidak valid", "VALIDATION_ERROR");

      // Verifikasi event ada
      const eventExists = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });
      if (!eventExists)
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

      const { searchParams } = new URL(req.url);
      const { page, limit, status, prioritas, ditugaskan_ke_id } =
        listQuerySchema.parse(Object.fromEntries(searchParams));

      const skip = (page - 1) * limit;
      const isFiltered = !!(status || prioritas || ditugaskan_ke_id);

      // Cek cache hanya untuk query tanpa filter
      const cacheKey = `${REDIS_KEYS.TUGAS.ALL(eventId)}:page:${page}:limit:${limit}`;
      if (!isFiltered) {
        const cached = await getCache<{ data: unknown[]; meta: unknown }>(
          cacheKey,
        );
        if (cached)
          return paginatedResponse(
            cached.data as any[],
            cached.meta as any,
            200,
          );
      }

      // Build Prisma where clause — hanya ambil root tasks (bukan sub-tugas)
      const where: Record<string, unknown> = {
        event_id: eventId,
        parent_tugas_id: null,
      };
      if (status) where.status = status;
      if (prioritas) where.prioritas = prioritas;
      if (ditugaskan_ke_id) where.ditugaskan_ke_id = ditugaskan_ke_id;

      const [tugas, total] = await Promise.all([
        prisma.tugas_event.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ prioritas: "desc" }, { batas_waktu: "asc" }],
          include: {
            ditugaskan_ke: { select: { id: true, nama_lengkap: true } },
            dibuat_oleh: { select: { id: true, nama_lengkap: true } },
            sub_tugas: {
              select: {
                id: true,
                nama_tugas: true,
                status: true,
                prioritas: true,
              },
            },
          },
        }),
        prisma.tugas_event.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const meta = { page, limit, total, totalPages };

      // Simpan ke cache hanya untuk query tanpa filter
      if (!isFiltered) {
        await setCache(cacheKey, { data: tugas, meta }, DEFAULT_CACHE_TTL);
      }

      return paginatedResponse(tugas, meta, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// POST /api/events/:event_id/tugas — Buat Tugas Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { userId } = req.user;
      const { event_id } = await params;
      const eventId = parseEventId(event_id);
      if (!eventId)
        return errorResponse(400, "ID Event tidak valid", "VALIDATION_ERROR");

      // Verifikasi event ada
      const eventExists = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });
      if (!eventExists)
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

      const data = createTugasSchema.parse(await req.json());

      // Validasi parent_tugas_id jika disertakan
      if (data.parent_tugas_id) {
        const parent = await prisma.tugas_event.findFirst({
          where: { id: data.parent_tugas_id, event_id: eventId },
          select: { id: true },
        });
        if (!parent)
          return errorResponse(
            404,
            "Tugas induk tidak ditemukan pada event ini",
            "NOT_FOUND",
          );
      }

      const tugas = await prisma.tugas_event.create({
        data: { event_id: eventId, dibuat_oleh_id: userId, ...data },
        include: {
          ditugaskan_ke: { select: { id: true, nama_lengkap: true } },
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.TUGAS.ALL_PREFIX(eventId));

      return successResponse(tugas, 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
