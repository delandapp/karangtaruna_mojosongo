import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaBuatKonten, schemaFilterKonten } from "@/lib/validations/sosial-media.schema";

// ──────────────────────────────────────────────────────────
// GET /api/sosial-media/konten — Get List of Content
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    // Validate query params
    const parsed = schemaFilterKonten.safeParse(rawParams);
    if (!parsed.success) {
      return errorResponse(
        400,
        parsed.error.errors[0].message,
        "VALIDATION_ERROR"
      );
    }

    const { akun_id, platform_id, status, tipe_konten, search } = parsed.data;

    const contents = await prisma.m_konten.findMany({
      where: {
        dihapus_pada: null,
        ...(akun_id ? { akun_id } : {}),
        ...(status ? { status } : {}),
        ...(tipe_konten ? { tipe_konten } : {}),
        ...(platform_id
          ? {
              platform: {
                some: {
                  platform_id,
                  dihapus_pada: null,
                },
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { judul: { contains: search, mode: "insensitive" } },
                { caption: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
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
          orderBy: {
            waktu_posting: "desc",
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
      orderBy: {
        dibuat_pada: "desc",
      },
    });

    return successResponse(contents, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/sosial-media/konten — Buat Konten Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();

    // Validate request body
    const parsed = schemaBuatKonten.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        400,
        parsed.error.errors[0].message,
        "VALIDATION_ERROR"
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

    // Verify account exists
    const account = await prisma.m_akun_sosmed.findFirst({
      where: {
        id: akun_id,
        dihapus_pada: null,
      },
    });

    if (!account) {
      return errorResponse(404, "Akun sosial media tidak ditemukan", "NOT_FOUND");
    }

    // Determine content status and scheduled time
    const isScheduled = !!jadwal;
    const kontenStatus = isScheduled ? "scheduled" : "draft";
    const dijadwalkanPada = isScheduled ? new Date(jadwal) : null;

    // Execute in transaction
    const newKonten = await prisma.$transaction(async (tx) => {
      // 1. Create m_konten
      const konten = await tx.m_konten.create({
        data: {
          akun_id,
          caption,
          tipe_konten,
          status: kontenStatus,
          dijadwalkan_pada: dijadwalkanPada,
        },
      });

      // 2. Create media entries if provided
      if (media_urls && media_urls.length > 0) {
        await tx.c_media_konten.createMany({
          data: media_urls.map((url, index) => {
            // Simple type detection based on extension
            const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
            const isVideo = ["mp4", "mov", "avi", "webm"].includes(ext);
            return {
              konten_id: konten.id,
              url,
              tipe_media: isVideo ? "video" : "image",
              urutan: index,
            };
          }),
        });
      }

      // 3. Create scheduled job detail if scheduled
      if (isScheduled && dijadwalkanPada) {
        await tx.c_jadwal_konten.create({
          data: {
            konten_id: konten.id,
            waktu_posting: dijadwalkanPada,
            status_job: "pending",
          },
        });
      }

      // 4. Create pivot records for platforms
      if (platform_ids.length > 0) {
        await tx.r_konten_platform.createMany({
          data: platform_ids.map((pId) => ({
            konten_id: konten.id,
            platform_id: pId,
          })),
        });
      }

      return konten;
    });

    // Fetch the full content object with relations to return
    const fullKonten = await prisma.m_konten.findUnique({
      where: { id: newKonten.id },
      include: {
        media: { where: { dihapus_pada: null } },
        jadwal: { where: { dihapus_pada: null } },
        platform: {
          where: { dihapus_pada: null },
          include: { platform: true },
        },
      },
    });

    return successResponse(fullKonten, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
