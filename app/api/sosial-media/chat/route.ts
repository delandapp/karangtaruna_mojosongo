import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaFilterChat } from "@/lib/validations/sosial-media.schema";

// ──────────────────────────────────────────────────────────
// GET /api/sosial-media/chat — Get Chat/Inbox Messages
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const parsed = schemaFilterChat.safeParse(rawParams);
    if (!parsed.success) {
      return errorResponse(
        400,
        parsed.error.issues[0].message,
        "VALIDATION_ERROR"
      );
    }

    const { akun_id, platform_id, status, search } = parsed.data;

    const chats = await prisma.m_chat.findMany({
      where: {
        dihapus_pada: null,
        ...(akun_id ? { akun_id } : {}),
        ...(status ? { status } : {}),
        ...(platform_id || search
          ? {
              akun: {
                dihapus_pada: null,
                ...(platform_id ? { platform_id } : {}),
                ...(search
                  ? {
                      OR: [
                        { nama_akun: { contains: search, mode: "insensitive" } },
                        { username: { contains: search, mode: "insensitive" } },
                      ],
                    }
                  : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { sender_nama: { contains: search, mode: "insensitive" } },
                { pesan: { contains: search, mode: "insensitive" } },
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
        balasan: {
          where: {
            dihapus_pada: null,
          },
          orderBy: {
            dibuat_pada: "asc",
          },
        },
      },
      orderBy: {
        dibuat_pada: "desc",
      },
    });

    return successResponse(chats, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
