import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations/event.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import {
  REDIS_KEYS,
  ELASTIC_INDICES,
  DEFAULT_CACHE_TTL,
} from "@/lib/constants";
import {
  searchDocuments,
  indexDocument,
  deleteDocument,
} from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

import { generateKodeEvent } from "@/lib/generator/event-code-generator";
import { z } from "zod";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/events — List dengan Pagination & Search
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    const skip = (page - 1) * limit;
    const cacheKey = `${REDIS_KEYS.EVENTS.ALL}:page:${page}:limit:${limit}`;

    // Cek cache hanya untuk non-search
    if (!search) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    // Query Elasticsearch
    const esQuery: Record<string, unknown> = search
      ? {
          multi_match: {
            query: search,
            fields: ["nama_event", "kode_event", "lokasi"],
            fuzziness: "AUTO",
          },
        }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.EVENTS,
      esQuery,
      { from: skip, size: limit, sort: [{ dibuat_pada: { order: "desc" } }] },
    );

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache jika bukan pencarian
    if (!search) {
      await setCache(cacheKey, { data: hits, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/events — Buat Event Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userId } = req.user;

    const body = await req.json();

    // 1. Validasi Zod (kode_event TIDAK boleh dikirim user)
    const validatedData = createEventSchema.parse(body);

    // 2. Verifikasi m_organisasi_id valid
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

    // 3. Generate kode_event otomatis
    const kodeEvent = await generateKodeEvent();

    // 4. Simpan ke database
    const newEvent = await prisma.event.create({
      data: {
        kode_event: kodeEvent,
        m_organisasi_id: validatedData.m_organisasi_id,
        dibuat_oleh_id: userId,
        nama_event: validatedData.nama_event,
        tema_event: validatedData.tema_event,
        deskripsi: validatedData.deskripsi,
        jenis_event: validatedData.jenis_event,
        status_event: validatedData.status_event,
        tanggal_mulai: validatedData.tanggal_mulai,
        tanggal_selesai: validatedData.tanggal_selesai,
        lokasi: validatedData.lokasi,
        target_peserta: validatedData.target_peserta,
        realisasi_peserta: validatedData.realisasi_peserta,
        banner_url: validatedData.banner_url,
        tujuan: validatedData.tujuan ?? undefined,
      },
      include: {
        organisasi: { select: { id: true, nama_org: true } },
        dibuat_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    // Invalidate cache
    await indexDocument(ELASTIC_INDICES.EVENTS, String(newEvent.id), newEvent);
    await invalidateCachePrefix(REDIS_KEYS.EVENTS.ALL_PREFIX);
    return successResponse(newEvent, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
