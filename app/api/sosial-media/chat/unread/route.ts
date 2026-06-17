import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// ──────────────────────────────────────────────────────────
// GET /api/sosial-media/chat/unread — Get Unread Messages Count
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const unreadChats = await prisma.m_chat.findMany({
      where: {
        sudah_dibaca: false,
        dihapus_pada: null,
        akun: {
          dihapus_pada: null,
        },
      },
      include: {
        akun: {
          include: {
            platform: true,
          },
        },
      },
    });

    const perPlatform: Record<string, number> = {
      tiktok: 0,
      facebook: 0,
      instagram: 0,
      whatsapp: 0,
      twitter: 0,
    };

    let total = 0;

    for (const chat of unreadChats) {
      if (chat.akun?.platform?.slug) {
        const slug = chat.akun.platform.slug.toLowerCase();
        perPlatform[slug] = (perPlatform[slug] || 0) + 1;
        total++;
      }
    }

    return successResponse({
      total,
      per_platform: perPlatform,
    }, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
