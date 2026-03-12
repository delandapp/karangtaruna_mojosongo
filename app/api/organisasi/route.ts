import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrganisasiSchema } from "@/lib/validations/organisasi.schema";
import { paginationSchema } from "@/lib/validations/level.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

// ──────────────────────────────────────────────────────────
// GET /api/organisasi — List dengan Pagination & Search
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/organisasi", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data organisasi.", "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || undefined;

    // 1. Validasi Query Param
    const { page, limit, search: searchQuery } = paginationSchema.parse({
      page: pageStr,
      limit: limitStr,
      search,
    });

    const skip = (page - 1) * limit;

    // 2. Cek Cache Redis (hanya untuk non-search)
    const cacheKey = `${REDIS_KEYS.ORGANISASI.ALL}:page:${page}:limit:${limit}`;
    if (!searchQuery) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    // 3. Bangun query Prisma
    const whereCondition = searchQuery
      ? {
          OR: [
            { nama_org: { contains: searchQuery, mode: "insensitive" as const } },
            { m_kelurahan: { nama: { contains: searchQuery, mode: "insensitive" as const } } },
            { m_kecamatan: { nama: { contains: searchQuery, mode: "insensitive" as const } } },
            { m_kota: { nama: { contains: searchQuery, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [organisasiList, total] = await Promise.all([
      prisma.m_organisasi.findMany({
        where: whereCondition,
        include: {
          m_provinsi: true,
          m_kota: true,
          m_kecamatan: true,
          m_kelurahan: true,
        },
        skip,
        take: limit,
        orderBy: { dibuat_pada: "desc" },
      }),
      prisma.m_organisasi.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // 4. Set ke cache jika bukan pencarian
    if (!searchQuery) {
      await setCache(cacheKey, { data: organisasiList, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(organisasiList, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/organisasi — Buat Data Organisasi
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/organisasi", "POST");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membuat data organisasi.", "FORBIDDEN");
    }

    const body = await req.json();

    // 1. Validasi Zod
    const validatedData = createOrganisasiSchema.parse(body);

    // 2. Simpan ke database
    const newOrganisasi = await prisma.m_organisasi.create({
      data: {
        nama_org: validatedData.nama_org,
        kode_wilayah_induk_kelurahan: validatedData.kode_wilayah_induk_kelurahan,
        kode_wilayah_induk_kecamatan: validatedData.kode_wilayah_induk_kecamatan,
        kode_wilayah_induk_kota: validatedData.kode_wilayah_induk_kota,
        kode_wilayah_induk_provinsi: validatedData.kode_wilayah_induk_provinsi,
        no_handphone: validatedData.no_handphone,
        email: validatedData.email,
        alamat: validatedData.alamat,
        logo_url: validatedData.logo_url,
        visi: validatedData.visi,
        misi: validatedData.misi,
        media_sosial: validatedData.media_sosial ?? undefined,
      },
    });

    // 3. Invalidasi cache list
    await invalidateCachePrefix(REDIS_KEYS.ORGANISASI.ALL_PREFIX);

    // 4. Simpan cache per id
    const singleCacheKey = REDIS_KEYS.ORGANISASI.SINGLE(newOrganisasi.id);
    await setCache(singleCacheKey, newOrganisasi, DEFAULT_CACHE_TTL);

    return successResponse(newOrganisasi, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
