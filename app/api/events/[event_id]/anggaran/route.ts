import { prisma } from "@/lib/prisma";
import { createAnggaranSchema } from "@/lib/validations/anggaran.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { z } from "zod";

type RouteProps = { params: Promise<{ event_id: string }> };

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  skenario: z.string().optional(),
  status: z.string().optional(),
});

const parseEventId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/anggaran — List Anggaran Event
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id } = await params;
      const eventId = parseEventId(event_id);
      if (!eventId)
        return errorResponse(400, "ID Event tidak valid", "VALIDATION_ERROR");

      const eventExists = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });
      if (!eventExists)
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

      const { searchParams } = new URL(req.url);
      const { page, limit, skenario, status } = listQuerySchema.parse(
        Object.fromEntries(searchParams),
      );

      const skip = (page - 1) * limit;
      const isFiltered = !!(skenario || status);

      const cacheKey = `${REDIS_KEYS.ANGGARAN.ALL(eventId)}:page:${page}:limit:${limit}`;

      // Cek cache hanya untuk query tanpa filter
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

      // Build where clause
      const where: Record<string, unknown> = { event_id: eventId };
      if (skenario) where.skenario = skenario;
      if (status) where.status = status;

      const [anggaran_list, total] = await Promise.all([
        prisma.anggaran.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ versi: "desc" }],
          include: {
            dibuat_oleh: { select: { id: true, nama_lengkap: true } },
            disetujui_oleh: { select: { id: true, nama_lengkap: true } },
          },
        }),
        prisma.anggaran.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const meta = { page, limit, total, totalPages };

      // Simpan ke cache hanya untuk query tanpa filter
      if (!isFiltered) {
        await setCache(
          cacheKey,
          { data: anggaran_list, meta },
          DEFAULT_CACHE_TTL,
        );
      }

      return paginatedResponse(anggaran_list, meta, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// POST /api/events/:event_id/anggaran — Buat Anggaran Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { userId } = req.user;
      const { event_id } = await params;
      const eventId = parseEventId(event_id);
      if (!eventId)
        return errorResponse(400, "ID Event tidak valid", "VALIDATION_ERROR");

      const eventExists = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });
      if (!eventExists)
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");

      const body = await req.json();
      const data = createAnggaranSchema.parse(body);

      // Cek duplikasi skenario + versi dalam event yang sama
      const duplicate = await prisma.anggaran.findFirst({
        where: {
          event_id: eventId,
          skenario: data.skenario,
          versi: data.versi,
        },
        select: { id: true },
      });
      if (duplicate) {
        return errorResponse(
          409,
          `Anggaran dengan Skenario '${data.skenario}' dan Versi '${data.versi}' sudah ada.`,
          "CONFLICT",
        );
      }

      const anggaran = await prisma.anggaran.create({
        data: {
          event_id: eventId,
          dibuat_oleh_id: userId,
          ...data,
        },
        include: {
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
        },
      });

      // Invalidate list cache via Kafka — CDC akan sync ke ES secara otomatis
      await produceCacheInvalidate(REDIS_KEYS.ANGGARAN.ALL_PREFIX(eventId));

      return successResponse(anggaran, 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
