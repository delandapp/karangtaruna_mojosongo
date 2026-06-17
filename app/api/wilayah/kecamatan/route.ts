import { prisma } from "@/lib/prisma";
import {
  kecamatanSchema,
  wilayahQuerySchema,
} from "@/lib/validations/wilayah.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// ──────────────────────────────────────────────────────────
// GET /api/wilayah/kecamatan — List dengan Pagination, Search & Dropdown
// Filter opsional: ?m_kota_id=1 atau ?m_provinsi_id=1
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";
    const m_kota_id = searchParams.get("m_kota_id")
      ? parseInt(searchParams.get("m_kota_id")!, 10)
      : undefined;
    const m_provinsi_id = searchParams.get("m_provinsi_id")
      ? parseInt(searchParams.get("m_provinsi_id")!, 10)
      : undefined;

    // ── Mode Dropdown (untuk select input) ───────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.KECAMATAN.ALL}:dropdown:kota:${m_kota_id ?? "all"}:prov:${m_provinsi_id ?? "all"}`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const where: Record<string, unknown> = {};
      if (m_kota_id) {
        where.m_kota_id = m_kota_id;
      } else if (m_provinsi_id) {
        where.m_kota = { m_provinsi_id };
      }

      const kecamatans = await prisma.m_kecamatan.findMany({
        where,
        select: { id: true, kode_wilayah: true, nama: true, m_kota_id: true },
        orderBy: { nama: "asc" },
        take: 10000,
      });

      await setCache(cacheKey, kecamatans, DEFAULT_CACHE_TTL);
      return successResponse(kecamatans, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const { page, limit, search } = wilayahQuerySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
    });

    const skip = (page - 1) * limit;
    const isFiltered = !!(search || m_kota_id || m_provinsi_id);

    const cacheKey = `${REDIS_KEYS.KECAMATAN.ALL}:kota:${m_kota_id ?? "all"}:prov:${m_provinsi_id ?? "all"}:page:${page}:limit:${limit}`;

    // Cek cache hanya untuk non-filter
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(cacheKey);
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const where: Record<string, unknown> = {};
    if (m_kota_id) {
      where.m_kota_id = m_kota_id;
    } else if (m_provinsi_id) {
      where.m_kota = { m_provinsi_id };
    }
    if (search) {
      where.OR = [
        { nama:         { contains: search, mode: "insensitive" } },
        { kode_wilayah: { contains: search, mode: "insensitive" } },
      ];
    }

    const [kecamatans, total] = await prisma.$transaction([
      prisma.m_kecamatan.findMany({ where, skip, take: limit, orderBy: { nama: "asc" } }),
      prisma.m_kecamatan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache jika tidak ada filter
    if (!isFiltered) {
      await setCache(cacheKey, { data: kecamatans, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(kecamatans, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/wilayah/kecamatan — Tambah Kecamatan
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = kecamatanSchema.parse(body);

    // Cek duplikasi kode wilayah
    const existing = await prisma.m_kecamatan.findUnique({
      where: { kode_wilayah: validatedData.kode_wilayah },
      select: { id: true },
    });
    if (existing) {
      return errorResponse(409, "Kode wilayah kecamatan sudah digunakan", "CONFLICT");
    }

    // Verifikasi kota induk
    const kotaExists = await prisma.m_kota.findUnique({
      where: { id: validatedData.m_kota_id },
      select: { id: true },
    });
    if (!kotaExists) {
      return errorResponse(404, "Kota induk tidak ditemukan", "NOT_FOUND");
    }

    const newData = await prisma.m_kecamatan.create({
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
        m_kota_id: validatedData.m_kota_id,
      },
    });

    // Invalidate list cache
    await invalidateCachePrefix(REDIS_KEYS.KECAMATAN.ALL_PREFIX);
    return successResponse(newData, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
