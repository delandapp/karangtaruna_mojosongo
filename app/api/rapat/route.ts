import { prisma } from "@/lib/prisma";
import { createRapatSchema } from "@/lib/validations/rapat.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import {
  REDIS_KEYS,
  DEFAULT_CACHE_TTL,
} from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

import { z } from "zod";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  event_id: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/rapat — List dengan Pagination, Search & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, event_id, status } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    const skip = (page - 1) * limit;
    const isFiltered = !!(event_id || status || search);

    // Cek cache hanya untuk non-filter
    const cacheKey = `${REDIS_KEYS.RAPAT.ALL}:page:${page}:limit:${limit}`;
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const where: any = {};
    if (event_id) where.event_id = event_id;
    if (status) where.status_rapat = status.toUpperCase();
    if (search) {
      where.OR = [
        { judul_rapat: { contains: search, mode: "insensitive" } },
        { lokasi: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.m_rapat.count({ where });
    const hits = await prisma.m_rapat.findMany({
      where,
      skip,
      take: limit,
      orderBy: { tanggal_mulai: "desc" },
      include: {
        kategori: true,
        event: { select: { id: true, nama_event: true, kode_event: true } },
        dibuat_oleh: { select: { id: true, nama_lengkap: true } },
        agendas: true,
        peserta: true,
        notulen: true,
      },
    });

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache hanya untuk query tanpa filter
    if (!isFiltered) {
      await setCache(cacheKey, { data: hits, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/rapat — Buat Rapat Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userId } = req.user;
    const data = createRapatSchema.parse(await req.json());

    // Validasi event_id jika diberikan
    if (data.event_id) {
      const eventExists = await prisma.event.findUnique({
        where: { id: data.event_id },
        select: { id: true },
      });
      if (!eventExists)
        return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
    }

    const rapat = await prisma.m_rapat.create({
      data: {
        m_user_id: userId,
        m_kategori_rapat_id: data.m_kategori_rapat_id,
        event_id: data.event_id,
        judul_rapat: data.judul_rapat,
        jenis_rapat: data.jenis_rapat,
        status_rapat: data.status_rapat,
        deskripsi: data.deskripsi,
        tanggal_mulai: data.tanggal_mulai,
        tanggal_selesai: data.tanggal_selesai,
        lokasi: data.lokasi,
        link_online: data.link_online,
        is_online: data.is_online,
        nomor_rapat: data.nomor_rapat,
        is_recurring: data.is_recurring,
        agendas: data.agendas ? {
          create: data.agendas.map((a) => ({
            urutan: a.urutan,
            judul_agenda: a.judul_agenda,
            deskripsi: a.deskripsi,
            durasi_menit: a.durasi_menit,
            m_user_id: a.m_user_id,
          }))
        } : undefined,
        peserta: data.peserta ? {
          create: data.peserta.map((p) => ({
            m_user_id: p.m_user_id,
            nama_peserta: p.nama_peserta,
            jabatan_peserta: p.jabatan_peserta,
            instansi: p.instansi,
            email: p.email,
            no_handphone: p.no_handphone,
            status_kehadiran: p.status_kehadiran,
            is_moderator: p.is_moderator,
            is_notulis: p.is_notulis,
          }))
        } : undefined,
      },
      include: {
        kategori: true,
        event: { select: { id: true, nama_event: true, kode_event: true } },
        dibuat_oleh: { select: { id: true, nama_lengkap: true } },
        agendas: true,
        peserta: true,
        notulen: true,
      },
    });

    // Invalidate cache
    await invalidateCachePrefix(REDIS_KEYS.RAPAT.ALL_PREFIX);
    return successResponse(rapat, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
