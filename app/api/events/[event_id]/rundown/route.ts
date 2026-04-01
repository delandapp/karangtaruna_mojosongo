import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { prisma } from "@/lib/prisma";
import { createRundownSchema } from "@/lib/validations/rundown.schema";
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
  limit: z.coerce.number().int().positive().max(200).default(100),
  hari_ke: z.coerce.number().int().positive().optional(),
});

const parseEventId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/rundown
// Diurutkan: hari_ke ASC, urutan_no ASC
// Filter opsional: ?hari_ke=1
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
      const { page, limit, hari_ke } = listQuerySchema.parse(
        Object.fromEntries(searchParams),
      );
      const skip = (page - 1) * limit;

      // Cek cache — dipisahkan per hari_ke agar akurat
      const cacheKey = `${REDIS_KEYS.RUNDOWN.ALL(eventId)}:page:${page}:hari:${hari_ke ?? "all"}`;
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);

      // Build Prisma where clause
      const where: Record<string, unknown> = { event_id: eventId };
      if (hari_ke) where.hari_ke = hari_ke;

      const [rundowns, total] = await Promise.all([
        prisma.rundown_acara.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ hari_ke: "asc" }, { urutan_no: "asc" }],
          include: {
            pic: { select: { id: true, nama_lengkap: true } },
          },
        }),
        prisma.rundown_acara.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const meta = { page, limit, total, totalPages };

      // Simpan ke cache
      await setCache(cacheKey, { data: rundowns, meta }, DEFAULT_CACHE_TTL);

      return paginatedResponse(rundowns, meta, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// POST /api/events/:event_id/rundown — Tambah Item Rundown
// ──────────────────────────────────────────────────────────
export const POST = withAuth(
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

      const data = createRundownSchema.parse(await req.json());

      // Validasi waktu: waktu_selesai harus >= waktu_mulai
      if (data.waktu_selesai < data.waktu_mulai) {
        return errorResponse(
          400,
          "Waktu selesai tidak boleh sebelum waktu mulai",
          "VALIDATION_ERROR",
        );
      }

      const rundown = await prisma.rundown_acara.create({
        data: { event_id: eventId, ...data },
        include: {
          pic: { select: { id: true, nama_lengkap: true } },
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.RUNDOWN.ALL_PREFIX(eventId));

      return successResponse(rundown, 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
