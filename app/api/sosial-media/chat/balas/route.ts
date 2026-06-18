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
        parsed.error.issues[0].message,
        "VALIDATION_ERROR"
      );
    }

    const { chat_id, isi_balasan, media } = parsed.data;

    // Cek apakah chat session ada beserta akun-nya
    const chat = await prisma.m_chat.findFirst({
      where: {
        id: chat_id,
        dihapus_pada: null,
      },
      include: {
        akun: {
          include: {
            platform: true,
          },
        },
      },
    });

    if (!chat) {
      return errorResponse(404, "Percakapan tidak ditemukan", "NOT_FOUND");
    }

    const platformSlug = chat.akun?.platform?.slug?.toLowerCase() || "";
    const isWhatsapp = platformSlug === "whatsapp";
    const senderId = chat.sender_id;

    let sentToWhatsapp = false;
    let waPlatformMsgId: string | null = null;

    // ── Kirim lewat WhatsApp jika platform = whatsapp dan klien terhubung ──
    if (isWhatsapp && senderId) {
      try {
        const { getWhatsappClient, sendWhatsappMessage, sendWhatsappMedia } =
          await import("@/lib/whatsapp-client");

        const clientInfo = getWhatsappClient(chat.akun_id);

        if (clientInfo.status === "connected" && clientInfo.client) {
          if (media) {
            // Kirim media (gambar/dokumen/file) — returns platform msg ID
            waPlatformMsgId = await sendWhatsappMedia(
              chat.akun_id,
              senderId,
              media.data,
              media.mimeType,
              media.filename,
              isi_balasan || undefined
            );
          } else if (isi_balasan) {
            // Kirim teks biasa — returns platform msg ID
            waPlatformMsgId = await sendWhatsappMessage(chat.akun_id, senderId, isi_balasan);
          }
          sentToWhatsapp = true;
        }
      } catch (waErr: any) {
        console.error(`[Chat Balas] WhatsApp send error:`, waErr);
        // Lanjut simpan ke DB meski gagal kirim ke WA (log error saja)
      }
    }

    // ── Simpan balasan dan update status chat dalam transaksi ──
    const balasan = await prisma.$transaction(async (tx) => {
      const newBalasan = await tx.c_balasan_chat.create({
        data: {
          chat_id,
          isi_balasan: isi_balasan || (media ? `[${media.filename}]` : ""),
          dikirim_oleh: String(userId),
          berhasil: isWhatsapp ? sentToWhatsapp : true,
          // Save WA platform msg ID so message_create handler can skip duplicates
          ...(waPlatformMsgId ? { platform_msg_id: waPlatformMsgId } : {}),
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

    // Emit real-time event to notify SSE active connections
    try {
      const { emitWhatsappEvent } = await import("@/lib/whatsapp-client");
      emitWhatsappEvent(chat.akun_id, "chat_update", {
        type: "message_create",
        fromMe: true,
        contactId: chat.sender_id,
      });
    } catch (emitErr) {
      console.error("Failed to emit chat_update event on reply:", emitErr);
    }

    return successResponse(
      { ...balasan, sent_to_whatsapp: sentToWhatsapp },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
});
