import { prisma } from "@/lib/prisma";
import { createItemAnggaranSchema } from "@/lib/validations/keuangan.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { z } from "zod";

type RouteProps = {
  params: Promise<{ event_id: string; anggaran_id: string }>;
};

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(100),
  jenis_item: z.string().optional(),
});

const parseIds = (
  event_id: string,
  anggaran_id: string,
): { eventId: number; anggaranId: number } | null => {
  const eventId = parseInt(event_id, 10);
  const anggaranId = parseInt(anggaran_id, 10);
  if (isNaN(eventId) || eventId <= 0 || isNaN(anggaranId) || anggaranId <= 0)
    return null;
  return { eventId, anggaranId };
};

// ──────────────────────────────────────────────────────────
// GET /api/events/:event_id/anggaran/:anggaran_id/item
// List item anggaran dengan pagination dan filter jenis_item.
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, anggaran_id } = await params;
      const ids = parseIds(event_id, anggaran_id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, anggaranId } = ids;

      // Verifikasi anggaran milik event yang benar
      const anggaranExists = await prisma.anggaran.findFirst({
        where: { id: anggaranId, event_id: eventId },
        select: { id: true },
      });
      if (!anggaranExists)
        return errorResponse(404, "Anggaran tidak ditemukan", "NOT_FOUND");

      const { searchParams } = new URL(req.url);
      const { page, limit, jenis_item } = listQuerySchema.parse(
        Object.fromEntries(searchParams),
      );

      const skip = (page - 1) * limit;
      const isFiltered = !!jenis_item;

      // Cek cache hanya untuk query tanpa filter
      const cacheKey = `event:${eventId}:anggaran:${anggaranId}:item:page:${page}:limit:${limit}:jenis:${jenis_item ?? "all"}`;
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

      // Build Prisma where clause
      const where: Record<string, unknown> = { anggaran_id: anggaranId };
      if (jenis_item) where.jenis_item = jenis_item;

      const [items, total] = await Promise.all([
        prisma.item_anggaran.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ jenis_item: "asc" }, { id: "desc" }],
        }),
        prisma.item_anggaran.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const meta = { page, limit, total, totalPages };

      // Simpan ke cache hanya untuk query tanpa filter
      if (!isFiltered) {
        await setCache(cacheKey, { data: items, meta }, DEFAULT_CACHE_TTL);
      }

      return paginatedResponse(items, meta, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// POST /api/events/:event_id/anggaran/:anggaran_id/item
// Tambah item anggaran baru. total_rencana dihitung otomatis.
// ──────────────────────────────────────────────────────────
export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { event_id, anggaran_id } = await params;
      const ids = parseIds(event_id, anggaran_id);
      if (!ids) return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { eventId, anggaranId } = ids;

      // Verifikasi anggaran milik event yang benar
      const anggaranExists = await prisma.anggaran.findFirst({
        where: { id: anggaranId, event_id: eventId },
        select: { id: true },
      });
      if (!anggaranExists)
        return errorResponse(404, "Anggaran tidak ditemukan", "NOT_FOUND");

      const body = await req.json();
      const data = createItemAnggaranSchema.parse(body);

      // Hitung total_rencana secara otomatis
      const total_rencana = data.jumlah_satuan * data.harga_satuan_rencana;

      const item = await prisma.item_anggaran.create({
        data: {
          anggaran_id: anggaranId,
          jenis_item: data.jenis_item,
          kategori: data.kategori,
          kode_item: data.kode_item,
          deskripsi: data.deskripsi,
          jumlah_satuan: data.jumlah_satuan,
          harga_satuan_rencana: data.harga_satuan_rencana,
          total_rencana,
          catatan: data.catatan,
        },
      });

      // Invalidate list cache — CDC akan sync ke ES secara otomatis
      await produceCacheInvalidate(
        `event:${eventId}:anggaran:${anggaranId}:item:*`,
      );

      return successResponse(item, 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
