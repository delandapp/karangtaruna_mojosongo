import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { DEFAULT_CACHE_TTL, ELASTIC_INDICES } from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { sponsorSchema } from "@/lib/validations/sponsorship.schema";
import { z } from "zod";

// ─── Cache Keys ───────────────────────────────────────────────────────────────

const cacheKeyList = (page: number, limit: number, kategoriId?: number) =>
  `sponsor:all:page:${page}:limit:${limit}:kategori:${kategoriId ?? "all"}`;
const CACHE_INVALIDATE_PREFIX = "sponsor:all:*";

// ─── Query Schema ─────────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  m_kategori_sponsor_id: z.coerce.number().int().positive().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/sponsorship/sponsors — List dengan Pagination, Search & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search, m_kategori_sponsor_id } =
      listQuerySchema.parse(Object.fromEntries(searchParams));

    const skip = (page - 1) * limit;
    const isFiltered = !!(search || m_kategori_sponsor_id);

    // Cek cache hanya untuk query tanpa filter
    const cacheKey = cacheKeyList(page, limit, m_kategori_sponsor_id);
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    // Build Prisma where clause (sponsor belum terindex di ES dengan join)
    const where: Record<string, unknown> = {};

    if (search) {
      where.m_perusahaan = {
        nama: { contains: search, mode: "insensitive" },
      };
    }

    if (m_kategori_sponsor_id) {
      where.m_kategori_sponsor_id = m_kategori_sponsor_id;
    }

    const [total, data] = await prisma.$transaction([
      prisma.m_sponsor.count({ where }),
      prisma.m_sponsor.findMany({
        where,
        include: {
          m_perusahaan: true,
          kategori: true,
        },
        skip,
        take: limit,
        orderBy: { diperbarui_pada: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache hanya untuk query tanpa filter
    if (!isFiltered) {
      await setCache(cacheKey, { data, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(data, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/sponsorship/sponsors — Tambah Master Sponsor Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = sponsorSchema.parse(body);

    // Cek duplikasi berdasarkan m_perusahaan_id
    if (validatedData.m_perusahaan_id) {
      const exists = await prisma.m_sponsor.findUnique({
        where: { m_perusahaan_id: validatedData.m_perusahaan_id },
        select: { id: true },
      });
      if (exists) {
        return errorResponse(
          409,
          "Perusahaan ini sudah terdaftar sebagai sponsor.",
          "CONFLICT",
        );
      }
    }

    // Cek duplikasi berdasarkan m_brand_id
    if (validatedData.m_brand_id) {
      const exists = await prisma.m_sponsor.findUnique({
        where: { m_brand_id: validatedData.m_brand_id },
        select: { id: true },
      });
      if (exists) {
        return errorResponse(
          409,
          "Brand ini sudah terdaftar sebagai sponsor.",
          "CONFLICT",
        );
      }
    }

    const newSponsor = await prisma.m_sponsor.create({
      data: {
        m_perusahaan_id: validatedData.m_perusahaan_id || undefined,
        m_brand_id: validatedData.m_brand_id || undefined,
        m_kategori_sponsor_id: validatedData.m_kategori_sponsor_id || null,
        total_disponsori: validatedData.total_disponsori || 0,
      },
      include: {
        m_perusahaan: true,
        m_brand: true,
        kategori: true,
      },
    });

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(CACHE_INVALIDATE_PREFIX);

    return successResponse(newSponsor, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
