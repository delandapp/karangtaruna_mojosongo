import { prisma } from "@/lib/prisma";
import {
  kotaSchema,
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
// GET /api/wilayah/kota — List dengan Pagination, Search & Dropdown
// Filter opsional: ?m_provinsi_id=1
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";
    const m_provinsi_id = searchParams.get("m_provinsi_id")
      ? parseInt(searchParams.get("m_provinsi_id")!, 10)
      : undefined;

    // ── Mode Dropdown (untuk select input) ───────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.KOTA.ALL}:dropdown:prov:${m_provinsi_id ?? "all"}`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const kotas = await prisma.m_kota.findMany({
        where: m_provinsi_id ? { m_provinsi_id } : {},
        select: { id: true, kode_wilayah: true, nama: true, m_provinsi_id: true },
        orderBy: { nama: "asc" },
      });

      await setCache(cacheKey, kotas, DEFAULT_CACHE_TTL);
      return successResponse(kotas, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const { page, limit, search } = wilayahQuerySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
    });

    const skip = (page - 1) * limit;
    const isFiltered = !!(search || m_provinsi_id);

    const cacheKey = `${REDIS_KEYS.KOTA.ALL}:prov:${m_provinsi_id ?? "all"}:page:${page}:limit:${limit}`;

    // Cek cache hanya untuk non-search
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(cacheKey);
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const where: Record<string, unknown> = {};
    if (m_provinsi_id) where.m_provinsi_id = m_provinsi_id;
    if (search) {
      where.OR = [
        { nama:         { contains: search, mode: "insensitive" } },
        { kode_wilayah: { contains: search, mode: "insensitive" } },
      ];
    }

    const [kotas, total] = await prisma.$transaction([
      prisma.m_kota.findMany({ where, skip, take: limit, orderBy: { nama: "asc" } }),
      prisma.m_kota.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache jika bukan pencarian
    if (!isFiltered) {
      await setCache(cacheKey, { data: kotas, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(kotas, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/wilayah/kota — Tambah Kota/Kabupaten
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = kotaSchema.parse(body);

    // Cek duplikasi kode wilayah
    const existing = await prisma.m_kota.findUnique({
      where: { kode_wilayah: validatedData.kode_wilayah },
      select: { id: true },
    });
    if (existing) {
      return errorResponse(409, "Kode wilayah kota sudah digunakan", "CONFLICT");
    }

    // Verifikasi provinsi induk
    const provinsiExists = await prisma.m_provinsi.findUnique({
      where: { id: validatedData.m_provinsi_id },
      select: { id: true },
    });
    if (!provinsiExists) {
      return errorResponse(404, "Provinsi induk tidak ditemukan", "NOT_FOUND");
    }

    const newData = await prisma.m_kota.create({
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
        m_provinsi_id: validatedData.m_provinsi_id,
      },
    });

    // Invalidate list cache
    await invalidateCachePrefix(REDIS_KEYS.KOTA.ALL_PREFIX);
    return successResponse(newData, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
