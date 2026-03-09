import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateHakAksesSchema } from "@/lib/validations/hak-akses.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

interface Context {
    params: { id: string };
}

export const PUT = withAuth(
    async (req: AuthenticatedRequest, { params }: Context) => {
        try {
            const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

            const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/hak-akses", "PUT");
            if (!hasAccess) {
                return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin update hak akses.", "FORBIDDEN");
            }

            const id = parseInt(params.id);
            if (isNaN(id)) {
                return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");
            }

            const body = await req.json();
            const validatedData = updateHakAksesSchema.parse(body);

            // Check if exists
            const existing = await prisma.m_hak_akses.findUnique({
                where: { id },
            });

            if (!existing) {
                return errorResponse(404, "Hak Akses tidak ditemukan", "NOT_FOUND");
            }

            const { rules, is_all_level, is_all_jabatan } = validatedData;

            const updatedHakAkses = await prisma.$transaction(async (tx) => {
                // Delete old rules first
                if (rules !== undefined) {
                    await tx.m_hak_akses_rule.deleteMany({
                        where: { m_hak_akses_id: id }
                    });
                }

                // Update the hak_akses record itself
                return await tx.m_hak_akses.update({
                    where: { id },
                    data: {
                        ...(is_all_level !== undefined && { is_all_level }),
                        ...(is_all_jabatan !== undefined && { is_all_jabatan }),
                        ...(rules && rules.length > 0 && {
                            rules: {
                                create: rules.map(r => ({
                                    m_level_id: r.m_level_id,
                                    m_jabatan_id: r.m_jabatan_id,
                                })),
                            }
                        })
                    },
                    include: { rules: true },
                });
            });

            await invalidateCachePrefix(REDIS_KEYS.HAK_AKSES.ALL_PREFIX);
            await setCache(REDIS_KEYS.HAK_AKSES.SINGLE(id), updatedHakAkses, DEFAULT_CACHE_TTL);

            return successResponse(updatedHakAkses, 200);
        } catch (error) {
            return handleApiError(error);
        }
    },
);

export const DELETE = withAuth(
    async (req: AuthenticatedRequest, { params }: Context) => {
        try {
            const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

            const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/hak-akses", "DELETE");
            if (!hasAccess) {
                return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin hapus hak akses.", "FORBIDDEN");
            }

            const id = parseInt(params.id);
            if (isNaN(id)) {
                return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");
            }

            const existing = await prisma.m_hak_akses.findUnique({
                where: { id },
            });

            if (!existing) {
                return errorResponse(404, "Hak Akses tidak ditemukan", "NOT_FOUND");
            }

            // Prisma cascade deletion handles rules
            await prisma.m_hak_akses.delete({
                where: { id },
            });

            await invalidateCachePrefix(REDIS_KEYS.HAK_AKSES.ALL_PREFIX);
            await invalidateCachePrefix(`${REDIS_KEYS.HAK_AKSES.ALL}:dropdown`);

            return successResponse({ deleted: true }, 200);
        } catch (error) {
            return handleApiError(error);
        }
    },
);
