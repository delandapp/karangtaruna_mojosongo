import { prisma } from "@/lib/prisma";
import { createNotulenSchema } from "@/lib/validations/notulen.schema";
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
  status: z.string().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/notulen — List Notulen
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, status } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    const skip = (page - 1) * limit;
    const isFiltered = !!(status || search);

    const cacheKey = `${REDIS_KEYS.NOTULEN.ALL}:page:${page}:limit:${limit}`;
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (search) {
      where.OR = [
        { kesimpulan_umum: { contains: search, mode: "insensitive" } },
        { pembukaan: { contains: search, mode: "insensitive" } },
        { penutupan: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.m_notulen.count({ where });
    const hits = await prisma.m_notulen.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dibuat_pada: "desc" },
      include: {
        rapat: { select: { id: true, judul_rapat: true } },
        notulis: { select: { id: true, nama_lengkap: true } },
        poin_bahasan: true,
        keputusan: true,
        tindak_lanjut: true,
      },
    });

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    if (!isFiltered) {
      await setCache(cacheKey, { data: hits, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/notulen — Buat Notulen Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userId } = req.user;
    const data = createNotulenSchema.parse(await req.json());

    // Validasi apakah Rapat ada
    const rapatExists = await prisma.m_rapat.findUnique({
      where: { id: data.m_rapat_id },
      select: { id: true },
    });
    if (!rapatExists)
      return errorResponse(404, "Rapat tidak ditemukan", "NOT_FOUND");

    // Validasi duplikasi Notulen untuk satu Rapat
    const duplicate = await prisma.m_notulen.findUnique({
      where: { m_rapat_id: data.m_rapat_id },
      select: { id: true },
    });
    if (duplicate)
      return errorResponse(409, "Rapat ini sudah memiliki notulen", "CONFLICT");

    const notulen = await prisma.m_notulen.create({
      data: {
        m_rapat_id: data.m_rapat_id,
        m_user_id: userId,
        nomor_notulen: data.nomor_notulen,
        status: data.status,
        pembukaan: data.pembukaan,
        penutupan: data.penutupan,
        kesimpulan_umum: data.kesimpulan_umum,
        poin_bahasan: data.poin_bahasan ? {
          create: data.poin_bahasan.map((pb) => ({
            urutan: pb.urutan,
            isi_bahasan: pb.isi_bahasan,
            pembicara: pb.pembicara,
            c_agenda_rapat_id: pb.c_agenda_rapat_id,
          }))
        } : undefined,
        keputusan: data.keputusan ? {
          create: data.keputusan.map((k) => ({
            urutan: k.urutan,
            isi_keputusan: k.isi_keputusan,
            dasar_keputusan: k.dasar_keputusan,
            is_konsensus: k.is_konsensus,
          }))
        } : undefined,
        tindak_lanjut: data.tindak_lanjut ? {
          create: data.tindak_lanjut.map((tl) => ({
            m_user_id_pic: tl.m_user_id_pic,
            m_user_id_pembuat: userId,
            judul: tl.judul,
            deskripsi: tl.deskripsi,
            deadline: tl.deadline,
            prioritas: tl.prioritas,
            status: tl.status,
          }))
        } : undefined,
      },
      include: {
        rapat: { select: { id: true, judul_rapat: true } },
        notulis: { select: { id: true, nama_lengkap: true } },
        poin_bahasan: true,
        keputusan: true,
        tindak_lanjut: true,
      },
    });

    // Invalidate cache
    await invalidateCachePrefix(REDIS_KEYS.NOTULEN.ALL_PREFIX);
    return successResponse(notulen, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
