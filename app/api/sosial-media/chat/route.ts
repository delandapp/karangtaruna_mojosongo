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

// ──────────────────────────────────────────────────────────
// POST /api/sosial-media/chat — Mulai Percakapan Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { akun_id, nomor_telp, nama } = body;

    if (!akun_id || !nomor_telp) {
      return errorResponse(400, "akun_id dan nomor_telp wajib diisi", "VALIDATION_ERROR");
    }

    const akunId = Number(akun_id);
    if (isNaN(akunId)) {
      return errorResponse(400, "akun_id tidak valid", "VALIDATION_ERROR");
    }

    // Clean phone number (leave digits only)
    const cleanPhone = nomor_telp.replace(/[^\d]/g, "");
    if (!cleanPhone) {
      return errorResponse(400, "Nomor telepon tidak valid", "VALIDATION_ERROR");
    }

    const senderId = `${cleanPhone}@c.us`;

    // Cek apakah chat thread dengan user ini sudah ada
    let chat = await prisma.m_chat.findFirst({
      where: {
        akun_id: akunId,
        sender_id: senderId,
        dihapus_pada: null,
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
    });

    if (!chat) {
      // Jika belum ada, buat record m_chat baru
      chat = await prisma.m_chat.create({
        data: {
          akun_id: akunId,
          sender_id: senderId,
          sender_nama: nama || `+${cleanPhone}`,
          pesan: "", // Pesan awal kosong
          status: "baru",
          sudah_dibaca: true,
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
      });
    }

    return successResponse(chat, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
