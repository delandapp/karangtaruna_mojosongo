import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaBalasChat } from "@/lib/validations/sosial-media.schema";

// ──────────────────────────────────────────────────────────
// POST /api/sosial-media/chat/balas — Kirim Balasan Chat
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userId } = req.user;
    const body = await req.json();

    // Validasi input
    const parsed = schemaBalasChat.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        400,
        parsed.error.errors[0].message,
        "VALIDATION_ERROR"
      );
    }

    const { chat_id, isi_balasan } = parsed.data;

    // Cek apakah chat session ada
    const chat = await prisma.m_chat.findFirst({
      where: {
        id: chat_id,
        dihapus_pada: null,
      },
    });

    if (!chat) {
      return errorResponse(404, "Percakapan tidak ditemukan", "NOT_FOUND");
    }

    // Melakukan transaksi pembuatan balasan dan mengubah status chat ke 'dijawab'
    const balasan = await prisma.$transaction(async (tx) => {
      const newBalasan = await tx.c_balasan_chat.create({
        data: {
          chat_id,
          isi_balasan,
          dikirim_oleh: String(userId),
          berhasil: true, // Simulasikan pengiriman ke API platform eksternal sukses
        },
      });

      await tx.m_chat.update({
        where: { id: chat_id },
        data: {
          status: "dijawab",
          sudah_dibaca: true,
        },
      });

      return newBalasan;
    });

    return successResponse(balasan, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
