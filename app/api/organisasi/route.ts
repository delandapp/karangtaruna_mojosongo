import { prisma } from "@/lib/prisma";
import { createOrganisasiSchema } from "@/lib/validations/organisasi.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import {
  REDIS_KEYS,
  ELASTIC_INDICES,
  DEFAULT_CACHE_TTL,
} from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { z } from "zod";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/organisasi — List dengan Pagination & Search
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, search } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    const skip = (page - 1) * limit;
    const cacheKey = `${REDIS_KEYS.ORGANISASI.ALL}:page:${page}:limit:${limit}`;

    // Cek cache hanya untuk non-search
    if (!search) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    const esQuery: Record<string, unknown> = search
      ? {
          multi_match: {
            query: search,
            fields: ["nama_org", "alamat", "email"],
            fuzziness: "AUTO",
          },
        }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.ORGANISASI,
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
// POST /api/organisasi — Buat Data Organisasi
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createOrganisasiSchema.parse(body);

    const newOrganisasi = await prisma.m_organisasi.create({
      data: {
        nama_org: validatedData.nama_org,
        kode_wilayah_induk_kelurahan:
          validatedData.kode_wilayah_induk_kelurahan,
        kode_wilayah_induk_kecamatan:
          validatedData.kode_wilayah_induk_kecamatan,
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

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(REDIS_KEYS.ORGANISASI.ALL_PREFIX);

    return successResponse(newOrganisasi, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
