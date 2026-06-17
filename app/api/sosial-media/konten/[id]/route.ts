import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaUpdateKonten } from "@/lib/validations/sosial-media.schema";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ──────────────────────────────────────────────────────────
// GET /api/sosial-media/konten/[id] — Detail Konten
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = parseId(rawId);
      if (!id) {
        return errorResponse(400, "ID Konten tidak valid", "VALIDATION_ERROR");
      }

      const konten = await prisma.m_konten.findFirst({
        where: {
          id,
          dihapus_pada: null,
        },
        include: {
          akun: {
            include: {
              platform: true,
            },
          },
          media: {
            where: {
              dihapus_pada: null,
            },
            orderBy: {
              urutan: "asc",
            },
          },
          jadwal: {
            where: {
              dihapus_pada: null,
            },
          },
          platform: {
            where: {
              dihapus_pada: null,
            },
            include: {
              platform: true,
            },
          },
        },
      });

      if (!konten) {
        return errorResponse(404, "Konten tidak ditemukan", "NOT_FOUND");
      }

      return successResponse(konten, 200);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// ──────────────────────────────────────────────────────────
// PUT /api/sosial-media/konten/[id] — Update Konten
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = parseId(rawId);
      if (!id) {
        return errorResponse(400, "ID Konten tidak valid", "VALIDATION_ERROR");
      }

      const body = await req.json();

      // Validate inputs
      const parsed = schemaUpdateKonten.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          400,
          parsed.error.errors[0].message,
          "VALIDATION_ERROR"
        );
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

      // Check content status — updates only allowed for draft / scheduled
      if (existing.status !== "draft" && existing.status !== "scheduled") {
        return errorResponse(
          400,
          "Hanya konten berstatus 'draft' atau 'scheduled' yang dapat diubah",
          "BAD_REQUEST"
        );
      }

      const {
        akun_id,
        tipe_konten,
        caption,
        platform_ids,
        jadwal,
        media_urls,
      } = parsed.data;

      // Update in transaction
      const updatedKonten = await prisma.$transaction(async (tx) => {
        // 1. Update basic information
        const hasJadwal = !!jadwal;
        const newStatus = hasJadwal ? "scheduled" : "draft";
        const newDijadwalkanPada = hasJadwal ? new Date(jadwal) : null;

        const updated = await tx.m_konten.update({
          where: { id },
          data: {
            ...(akun_id ? { akun_id } : {}),
            ...(tipe_konten ? { tipe_konten } : {}),
            ...(caption ? { caption } : {}),
            status: newStatus,
            dijadwalkan_pada: newDijadwalkanPada,
          },
        });

        // 2. Handle media files updates
        if (media_urls) {
          // Soft delete old media files
          await tx.c_media_konten.updateMany({
            where: { konten_id: id, dihapus_pada: null },
            data: { dihapus_pada: new Date() },
          });

          // Insert new media files
          if (media_urls.length > 0) {
            await tx.c_media_konten.createMany({
              data: media_urls.map((url, index) => {
                const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
                const isVideo = ["mp4", "mov", "avi", "webm"].includes(ext);
                return {
                  konten_id: id,
                  url,
                  tipe_media: isVideo ? "video" : "image",
                  urutan: index,
                };
              }),
            });
          }
        }

        // 3. Handle schedule details
        if (jadwal !== undefined) {
          // Soft delete current pending schedules
          await tx.c_jadwal_konten.updateMany({
            where: { konten_id: id, status_job: "pending", dihapus_pada: null },
            data: { dihapus_pada: new Date() },
          });

          // If new schedule is set, insert a new pending schedule job
          if (hasJadwal && newDijadwalkanPada) {
            await tx.c_jadwal_konten.create({
              data: {
                konten_id: id,
                waktu_posting: newDijadwalkanPada,
                status_job: "pending",
              },
            });
          }
        }

        // 4. Handle platforms relation updates
        if (platform_ids) {
          // Soft delete old platform pivots
          await tx.r_konten_platform.updateMany({
            where: { konten_id: id, dihapus_pada: null },
            data: { dihapus_pada: new Date() },
          });

          // Insert new platform pivots
          if (platform_ids.length > 0) {
            await tx.r_konten_platform.createMany({
              data: platform_ids.map((pId) => ({
                konten_id: id,
                platform_id: pId,
              })),
            });
          }
        }

        return updated;
      });

      // Fetch the updated content record with relationships
      const fullKonten = await prisma.m_konten.findUnique({
        where: { id: updatedKonten.id },
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

// ──────────────────────────────────────────────────────────
// DELETE /api/sosial-media/konten/[id] — Soft Delete Konten
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
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

      const now = new Date();

      // Soft delete all items in transaction
      await prisma.$transaction(async (tx) => {
        // Soft delete the main content record
        await tx.m_konten.update({
          where: { id },
          data: { dihapus_pada: now },
        });

        // Soft delete child media entries
        await tx.c_media_konten.updateMany({
          where: { konten_id: id, dihapus_pada: null },
          data: { dihapus_pada: now },
        });

        // Soft delete schedules
        await tx.c_jadwal_konten.updateMany({
          where: { konten_id: id, status_job: "pending", dihapus_pada: null },
          data: { dihapus_pada: now },
        });

        // Soft delete platform links
        await tx.r_konten_platform.updateMany({
          where: { konten_id: id, dihapus_pada: null },
          data: { dihapus_pada: now },
        });
      });

      return successResponse({ message: "Konten berhasil dihapus" }, 200);
    } catch (error) {
      return handleApiError(error);
    }
  }
);
