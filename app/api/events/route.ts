import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations/event.schema";
import { paginationSchema } from "@/lib/validations/level.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { generateKodeEvent } from "@/lib/generator/event-code-generator";

// ──────────────────────────────────────────────────────────
// GET /api/events — List dengan Pagination, Search & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(
      userLevelId,
      userJabatanId,
      "/api/events",
      "GET",
    );
    if (!hasAccess) {
      return errorResponse(
        403,
        "Akses ditolak. Anda tidak memiliki izin membaca data event.",
        "FORBIDDEN",
      );
    }

    const { searchParams } = new URL(req.url);
    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status_event") || undefined;
    const jenis = searchParams.get("jenis_event") || undefined;
    const orgId = searchParams.get("m_organisasi_id") || undefined;

    // 1. Validasi Query Param
    const {
      page,
      limit,
      search: searchQuery,
    } = paginationSchema.parse({
      page: pageStr,
      limit: limitStr,
      search,
    });

    const skip = (page - 1) * limit;
    const isFiltered = !!(searchQuery || status || jenis || orgId);

    // 2. Cek Cache Redis (hanya untuk request tanpa filter)
    const cacheKey = `${REDIS_KEYS.EVENTS.ALL}:page:${page}:limit:${limit}`;
    if (!isFiltered) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    // 3. Bangun query Prisma
    const whereCondition: any = {};

    if (searchQuery) {
      whereCondition.OR = [
        { nama_event: { contains: searchQuery, mode: "insensitive" } },
        { kode_event: { contains: searchQuery, mode: "insensitive" } },
        { lokasi: { contains: searchQuery, mode: "insensitive" } },
      ];
    }
    if (status) whereCondition.status_event = status;
    if (jenis) whereCondition.jenis_event = jenis;
    if (orgId) whereCondition.m_organisasi_id = parseInt(orgId, 10);

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { dibuat_pada: "desc" },
        include: {
          organisasi: { select: { id: true, nama_org: true } },
          dibuat_oleh: {
            select: { id: true, nama_lengkap: true, username: true },
          },
        },
      }),
      prisma.event.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // 4. Simpan ke cache jika tidak ada filter
    if (!isFiltered) {
      await setCache(cacheKey, { data: events, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(events, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/events — Buat Event Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const {
      userId,
      m_level_id: userLevelId,
      m_jabatan_id: userJabatanId,
    } = req.user;

    const hasAccess = await checkUserAccess(
      userLevelId,
      userJabatanId,
      "/api/events",
      "POST",
    );
    if (!hasAccess) {
      return errorResponse(
        403,
        "Akses ditolak. Anda tidak memiliki izin membuat event.",
        "FORBIDDEN",
      );
    }

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

    // 5. Invalidasi cache list & simpan cache per id
    await invalidateCachePrefix(REDIS_KEYS.EVENTS.ALL_PREFIX);
    await setCache(
      REDIS_KEYS.EVENTS.SINGLE(newEvent.id),
      newEvent,
      DEFAULT_CACHE_TTL,
    );

    return successResponse(newEvent, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
