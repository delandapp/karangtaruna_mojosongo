import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBrandSchema } from "@/lib/validations/sponsorship.schema";
import { paginationSchema } from "@/lib/validations/level.schema";
import { successResponse, paginatedResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

import { z } from "zod";
import { buildCacheKeyPart, buildInFilter, zCommaSeparatedNumbers } from "@/utils/helpers/api-filter";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  m_bidang_brand_id: zCommaSeparatedNumbers,
  m_kategori_brand_id: zCommaSeparatedNumbers,
});

export const GET = withAuth(async (req: AuthenticatedRequest) => {
    try {
        const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

        const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/sponsorship/brands", "GET");
        if (!hasAccess) {
            return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data sponsorship.", "FORBIDDEN");
        }

        const { searchParams } = new URL(req.url);
        const dropdown = searchParams.get("dropdown") === "true"; // For referencing Brand elsewhere (if needed)

        if (dropdown) {
            const cacheKey = `brand:dropdown`;
            const cached = await getCache<{ data: any[] }>(cacheKey);
            if (cached) return successResponse(cached.data, 200);

            const items = await prisma.m_brand.findMany({
                select: { id: true, nama_brand: true },
                orderBy: { nama_brand: "asc" },
            });
            await setCache(cacheKey, { data: items }, DEFAULT_CACHE_TTL);
            return successResponse(items, 200);
        }

        const query = Object.fromEntries(searchParams.entries());
        const validatedQuery = querySchema.parse(query);

        const { page, limit, search: searchQuery, m_bidang_brand_id, m_kategori_brand_id } = validatedQuery;
        const skip = (page - 1) * limit;

        const bidKey = buildCacheKeyPart(m_bidang_brand_id, "all");
        const katKey = buildCacheKeyPart(m_kategori_brand_id, "all");
        const cacheKey = `brand:all:page:${page}:limit:${limit}:bid:${bidKey}:kat:${katKey}:search:${searchQuery || "none"}`;

        const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
        if (cachedData) {
            return paginatedResponse(cachedData.data, cachedData.meta, 200);
        }

        const whereCondition: any = {};
        
        if (m_bidang_brand_id && m_bidang_brand_id.length > 0) {
            whereCondition.m_bidang_brand_id = buildInFilter(m_bidang_brand_id);
        }
        if (m_kategori_brand_id && m_kategori_brand_id.length > 0) {
            whereCondition.m_kategori_brand_id = buildInFilter(m_kategori_brand_id);
        }
        if (searchQuery) {
            whereCondition.OR = [
                { nama_brand: { contains: searchQuery, mode: "insensitive" as const } },
                { perusahaan_induk: { contains: searchQuery, mode: "insensitive" as const } }
            ];
        }

        const [items, total] = await Promise.all([
            prisma.m_brand.findMany({
                where: whereCondition,
                include: { bidang: { select: { nama_bidang: true } }, kategori: { select: { nama_kategori: true } } },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.m_brand.count({ where: whereCondition }),
        ]);

        const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };

        await setCache(cacheKey, { data: items, meta }, DEFAULT_CACHE_TTL);

        return paginatedResponse(items, meta, 200);
    } catch (error) {
        return handleApiError(error);
    }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
    try {
        const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

        const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/sponsorship/brands", "POST");
        if (!hasAccess) {
            return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membuat data sponsorship.", "FORBIDDEN");
        }

        const body = await req.json();
        const validatedData = createBrandSchema.parse(body);

        const exists = await prisma.m_brand.findFirst({
            where: { nama_brand: validatedData.nama_brand },
        });
        // Optional unique checking across nama_brand
        if (exists) return errorResponse(409, "Nama Brand sudah ada", "CONFLICT");

        const newItem = await prisma.m_brand.create({
            data: validatedData,
        });
        return successResponse(newItem, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
