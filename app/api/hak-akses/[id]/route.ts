import { prisma } from "@/lib/prisma";
import { updateHakAksesSchema } from "@/lib/validations/hak-akses.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { REDIS_KEYS } from "@/lib/constants";
import { produceCacheInvalidate } from "@/lib/kafka";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

interface Context {
  params: Promise<{ id: string }>;
}

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// PUT /api/hak-akses/:id — Update Hak Akses + Rules
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: Context) => {
    try {
      const { id: paramId } = await params;
      const id = parseId(paramId);

      if (!id) {
        return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");
      }

      const existing = await prisma.m_hak_akses.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) {
        return errorResponse(404, "Hak Akses tidak ditemukan", "NOT_FOUND");
      }

      const body = await req.json();
      const validatedData = updateHakAksesSchema.parse(body);
      const { rules, is_all_level, is_all_jabatan } = validatedData;

      const updated = await prisma.$transaction(async (tx) => {
        // Hapus rules lama sebelum replace dengan yang baru
        if (rules !== undefined) {
          await tx.m_hak_akses_rule.deleteMany({
            where: { m_hak_akses_id: id },
          });
        }

        return tx.m_hak_akses.update({
          where: { id },
          data: {
            ...(is_all_level !== undefined && { is_all_level }),
            ...(is_all_jabatan !== undefined && { is_all_jabatan }),
            ...(rules &&
              rules.length > 0 && {
                rules: {
                  create: rules.map((r) => ({
                    m_level_id: r.m_level_id,
                    m_jabatan_id: r.m_jabatan_id,
                  })),
                },
              }),
          },
          include: { rules: true },
        });
      });

      // Invalidate cache via Kafka — CDC akan sync ke ES otomatis
      await produceCacheInvalidate(REDIS_KEYS.HAK_AKSES.SINGLE(id));
      await produceCacheInvalidate(REDIS_KEYS.HAK_AKSES.ALL_PREFIX);

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/hak-akses/:id — Hapus Hak Akses
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: Context) => {
    try {
      const { id: paramId } = await params;
      const id = parseId(paramId);

      if (!id) {
        return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");
      }

      const existing = await prisma.m_hak_akses.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) {
        return errorResponse(404, "Hak Akses tidak ditemukan", "NOT_FOUND");
      }

      // Prisma cascade deletion menghapus rules otomatis
      await prisma.m_hak_akses.delete({ where: { id } });

      // Invalidate cache via Kafka
      await produceCacheInvalidate(REDIS_KEYS.HAK_AKSES.SINGLE(id));
      await produceCacheInvalidate(REDIS_KEYS.HAK_AKSES.ALL_PREFIX);

      return successResponse({ deleted: true }, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
