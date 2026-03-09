import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    bulkCreateHakAksesSchema,
    paginationSchema,
} from "@/lib/validations/hak-akses.schema";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
    try {
        const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

        const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/hak-akses", "GET");
        if (!hasAccess) {
            return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data hak akses.", "FORBIDDEN");
        }

        const { searchParams } = new URL(req.url);
        const dropdown = searchParams.get("dropdown") === "true";

        if (dropdown) {
            const dropdownCacheKey = `${REDIS_KEYS.HAK_AKSES.ALL}:dropdown`;
            const cachedDropdown = await getCache<{ data: any[] }>(dropdownCacheKey);
            if (cachedDropdown) {
                return successResponse(cachedDropdown.data, 200);
            }

            const hakAksesResult = await prisma.m_hak_akses.findMany({
                select: { id: true, nama_fitur: true, tipe_fitur: true, method: true, endpoint: true },
                orderBy: [{ endpoint: "asc" }, { method: "asc" }],
            });

            await setCache(dropdownCacheKey, { data: hakAksesResult }, DEFAULT_CACHE_TTL);
            return successResponse(hakAksesResult, 200);
        }

        const pageStr = searchParams.get("page") || "1";
        const limitStr = searchParams.get("limit") || "10";
        const search = searchParams.get("search") || undefined;

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

        const cacheKey = `${REDIS_KEYS.HAK_AKSES.ALL}:page:${page}:limit:${limit}`;
        if (!searchQuery) {
            const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
            if (cachedData) {
                return paginatedResponse(cachedData.data, cachedData.meta, 200);
            }
        }

        const whereCondition = searchQuery
            ? {
                OR: [
                    { nama_fitur: { contains: searchQuery, mode: "insensitive" as const } },
                    { endpoint: { contains: searchQuery, mode: "insensitive" as const } },
                ]
            }
            : {};

        const [hakAkses, total] = await Promise.all([
            prisma.m_hak_akses.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: [{ endpoint: "asc" }, { method: "asc" }],
                include: {
                    rules: {
                        include: {
                            level: { select: { nama_level: true } },
                            jabatan: { select: { nama_jabatan: true } },
                        }
                    }
                }
            }),
            prisma.m_hak_akses.count({ where: whereCondition }),
        ]);

        const totalPages = Math.ceil(total / limit);
        const meta = {
            page,
            limit,
            total,
            totalPages,
        };

        if (!searchQuery) {
            await setCache(cacheKey, { data: hakAkses, meta }, DEFAULT_CACHE_TTL);
        }

        return paginatedResponse(hakAkses, meta, 200);
    } catch (error) {
        return handleApiError(error);
    }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
    try {
        const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

        const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/hak-akses", "POST");
        if (!hasAccess) {
            return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membuat data hak akses.", "FORBIDDEN");
        }

        const body = await req.json();

        // The user wants to bulk insert the 4 steps (GET, POST, PUT, DELETE) at once.
        const validatedData = bulkCreateHakAksesSchema.parse(body);

        const insertedRecords = await prisma.$transaction(
            validatedData.map((hakAksesInput) => {
                const { rules, ...m_hak_akses_data } = hakAksesInput;

                return prisma.m_hak_akses.create({
                    data: {
                        ...m_hak_akses_data,
                        rules: rules && rules.length > 0
                            ? {
                                create: rules.map(r => ({
                                    m_level_id: r.m_level_id,
                                    m_jabatan_id: r.m_jabatan_id,
                                }))
                            }
                            : undefined,
                    },
                });
            })
        );

        await invalidateCachePrefix(REDIS_KEYS.HAK_AKSES.ALL_PREFIX);
        await invalidateCachePrefix(`${REDIS_KEYS.HAK_AKSES.ALL}:dropdown`);

        return successResponse(insertedRecords, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
