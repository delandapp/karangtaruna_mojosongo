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

        const pageStr = searchParams.get("page") || "1";
        const limitStr = searchParams.get("limit") || "10";
        const search = searchParams.get("search") || undefined;

        const { page, limit, search: searchQuery } = paginationSchema.parse({
            page: pageStr,
            limit: limitStr,
            search,
        });

        const skip = (page - 1) * limit;

        const cacheKey = `brand:all:page:${page}:limit:${limit}`;
        if (!searchQuery) {
            const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
            if (cachedData) {
                return paginatedResponse(cachedData.data, cachedData.meta, 200);
            }
        }

        const whereCondition = searchQuery
            ? {
                OR: [
                    { nama_brand: { contains: searchQuery, mode: "insensitive" as const } },
                    { perusahaan_induk: { contains: searchQuery, mode: "insensitive" as const } }
                ]
            }
            : {};

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

        if (!searchQuery) {
            await setCache(cacheKey, { data: items, meta }, DEFAULT_CACHE_TTL);
        }

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

        await invalidateCachePrefix("brand:all");
        await invalidateCachePrefix("brand:dropdown");

        return successResponse(newItem, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
