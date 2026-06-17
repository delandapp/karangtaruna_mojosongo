import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// ──────────────────────────────────────────────────────────
// GET /api/sosial-media/analitik/top-konten — Get Top Content
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const platformIdParam = searchParams.get("platform_id");
    const akunIdParam = searchParams.get("akun_id");

    const platformId = platformIdParam ? Number(platformIdParam) : undefined;
    const akunId = akunIdParam ? Number(akunIdParam) : undefined;

    // Fetch published contents
    const contents = await prisma.m_konten.findMany({
      where: {
        status: "published",
        dihapus_pada: null,
        ...(akunId ? { akun_id: akunId } : {}),
        ...(platformId
          ? {
              platform: {
                some: {
                  platform_id: platformId,
                  dihapus_pada: null,
                },
              },
            }
          : {}),
      },
      include: {
        akun: {
          include: {
            platform: true,
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

    // Map each post to a TopKontenItem with simulated stats based on ID (stable mock)
    const topContents = contents.map((konten) => {
      const seed = konten.id;
      // Deterministic numbers for consistency
      const likes = (seed * 47) % 420 + 20;
      const komentar = (seed * 19) % 110 + 5;
      const share = (seed * 7) % 65 + 1;
      const total_engagement = likes + komentar + share;

      return {
        id: konten.id,
        judul: konten.judul,
        caption: konten.caption,
        tipe_konten: konten.tipe_konten as any,
        likes,
        komentar,
        share,
        total_engagement,
        diposting_pada: konten.diposting_pada ? konten.diposting_pada.toISOString() : null,
        akun: {
          username: konten.akun?.username,
          nama_akun: konten.akun?.nama_akun,
          platform: konten.akun?.platform,
        },
      };
    });

    // Sort by engagement descending
    topContents.sort((a, b) => b.total_engagement - a.total_engagement);

    return successResponse(topContents.slice(0, 10), 200); // Limit to top 10
  } catch (error) {
    return handleApiError(error);
  }
});
