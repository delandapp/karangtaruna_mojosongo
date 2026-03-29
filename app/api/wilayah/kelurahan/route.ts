import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { kelurahanSchema, wilayahQuerySchema } from "@/lib/validations/wilayah.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { REDIS_KEYS, ELASTIC_INDICES } from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    if (!dropdown) {
      const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kelurahan", "GET");
      if (!hasAccess) {
        return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data kelurahan.", "FORBIDDEN");
      }
    }
    const m_kecamatan_id = searchParams.get("m_kecamatan_id");
    const m_kota_id = searchParams.get("m_kota_id");
    const m_provinsi_id = searchParams.get("m_provinsi_id");

    if (dropdown) {
      const dropdownCacheKey = `${REDIS_KEYS.KELURAHAN.ALL}:dropdown:kec:${m_kecamatan_id || 'all'}:kota:${m_kota_id || 'all'}:prov:${m_provinsi_id || 'all'}`;
      const cachedDropdown = await getCache<{ data: any[] }>(dropdownCacheKey);
      if (cachedDropdown) {
        return successResponse(cachedDropdown.data, 200);
      }

      const mustClauses: any[] = [];
      if (m_kecamatan_id) {
        mustClauses.push({ term: { m_kecamatan_id: parseInt(m_kecamatan_id, 10) } });
      } else if (m_kota_id) {
        mustClauses.push({ term: { "m_kecamatan.m_kota_id": parseInt(m_kota_id, 10) } });
      } else if (m_provinsi_id) {
        mustClauses.push({ term: { "m_kecamatan.m_kota.m_provinsi_id": parseInt(m_provinsi_id, 10) } });
      }

      const esQuery = mustClauses.length > 0
        ? { bool: { must: mustClauses } }
        : { match_all: {} };

      const { hits } = await searchDocuments(ELASTIC_INDICES.KELURAHAN, esQuery, {
        size: 10000,
        _source: ["id", "kode_wilayah", "nama", "m_kecamatan_id"],
        sort: [{ nama: "asc" }],
      });

      return successResponse(hits, 200);
    }

    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || undefined;

    const { page, limit, search: searchQuery } = wilayahQuerySchema.parse({
      page: pageStr,
      limit: limitStr,
      search,
    });

    const skip = (page - 1) * limit;

    const cacheKey = `${REDIS_KEYS.KELURAHAN.ALL}:kec:${m_kecamatan_id || 'all'}:kota:${m_kota_id || 'all'}:prov:${m_provinsi_id || 'all'}:page:${page}:limit:${limit}`;
    if (!searchQuery) {
      const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cachedData) {
        return paginatedResponse(cachedData.data, cachedData.meta, 200);
      }
    }

    const mustClauses: any[] = [];
    if (m_kecamatan_id) {
      mustClauses.push({ term: { m_kecamatan_id: parseInt(m_kecamatan_id, 10) } });
    } else if (m_kota_id) {
      mustClauses.push({ term: { "m_kecamatan.m_kota_id": parseInt(m_kota_id, 10) } });
    } else if (m_provinsi_id) {
      mustClauses.push({ term: { "m_kecamatan.m_kota.m_provinsi_id": parseInt(m_provinsi_id, 10) } });
    }
    if (searchQuery) {
      mustClauses.push({
        multi_match: {
          query: searchQuery,
          fields: ["nama", "kode_wilayah"],
          type: "phrase_prefix" as const,
        },
      });
    }

    const esQuery = mustClauses.length > 0
      ? { bool: { must: mustClauses } }
      : { match_all: {} };

    const { hits, total } = await searchDocuments(ELASTIC_INDICES.KELURAHAN, esQuery, {
      from: skip,
      size: limit,
      sort: [{ nama: "asc" }],
    });

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kelurahan", "POST");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const body = await req.json();
    const validatedData = kelurahanSchema.parse(body);

    const existing = await prisma.m_kelurahan.findUnique({
      where: { kode_wilayah: validatedData.kode_wilayah },
    });

    if (existing) {
      return errorResponse(400, "Kode wilayah kelurahan sudah digunakan");
    }

    const newData = await prisma.m_kelurahan.create({
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
        m_kecamatan_id: validatedData.m_kecamatan_id,
      },
    });
    return successResponse(newData, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
