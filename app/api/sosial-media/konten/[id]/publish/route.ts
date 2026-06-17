import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ──────────────────────────────────────────────────────────
// POST /api/sosial-media/konten/[id]/publish — Publish Sekarang
// ──────────────────────────────────────────────────────────
export const POST = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = parseId(rawId);
      if (!id) {
        return errorResponse(400, "ID Konten tidak valid", "VALIDATION_ERROR");
      }

      const existing = await prisma.m_konten.findFirst({
        where: {
          id,
          dihapus_pada: null,
        },
      });

      if (!existing) {
        return errorResponse(404, "Konten tidak ditemukan", "NOT_FOUND");
      }

      // Check status: only allowed for draft or scheduled
      if (existing.status !== "draft" && existing.status !== "scheduled") {
        return errorResponse(
          400,
          `Konten tidak dapat dipublikasikan karena berstatus: ${existing.status}`,
          "BAD_REQUEST"
        );
      }

      // Publish in transaction
      const published = await prisma.$transaction(async (tx) => {
        const now = new Date();

        // 1. Update status to published
        const updated = await tx.m_konten.update({
          where: { id },
          data: {
            status: "published",
            diposting_pada: now,
          },
        });

        // 2. Mark any pending schedules as completed/done
        await tx.c_jadwal_konten.updateMany({
          where: { konten_id: id, status_job: "pending", dihapus_pada: null },
          data: { status_job: "done" },
        });

        // 3. Update pivot table to add simulated external_post_id
        const platforms = await tx.r_konten_platform.findMany({
          where: { konten_id: id, dihapus_pada: null },
        });

        for (const p of platforms) {
          await tx.r_konten_platform.update({
            where: { id: p.id },
            data: {
              external_post_id: `ext_post_${Math.random().toString(36).substr(2, 9)}`,
            },
          });
        }

        return updated;
      });

      const fullKonten = await prisma.m_konten.findUnique({
        where: { id: published.id },
        include: {
          media: { where: { dihapus_pada: null } },
          jadwal: { where: { dihapus_pada: null } },
          platform: {
            where: { dihapus_pada: null },
            include: { platform: true },
          },
        },
      });

      return successResponse(fullKonten, 200);
    } catch (error) {
      return handleApiError(error);
    }
  }
);
