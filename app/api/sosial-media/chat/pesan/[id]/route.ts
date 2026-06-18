import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = { params: Promise<{ id: string }> };

// ──────────────────────────────────────────────────────────
// DELETE /api/sosial-media/chat/pesan/[id] — Hapus/Unsend Pesan
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = Number(rawId);
      if (isNaN(id)) {
        return errorResponse(400, "ID pesan tidak valid", "VALIDATION_ERROR");
      }

      const { searchParams } = new URL(req.url);
      const type = searchParams.get("type") || "reply"; // "reply" | "parent"

      let success = false;
      let platformMsgId: string | null = null;
      let senderId: string | null = null;
      let akunId: number | null = null;

      if (type === "reply") {
        const reply = await prisma.c_balasan_chat.findFirst({
          where: { id, dihapus_pada: null },
          include: {
            chat: true,
          },
        });

        if (!reply) {
          return errorResponse(404, "Pesan balasan tidak ditemukan", "NOT_FOUND");
        }

        platformMsgId = reply.platform_msg_id;
        senderId = reply.chat.sender_id;
        akunId = reply.chat.akun_id;

        // Soft delete locally
        await prisma.c_balasan_chat.update({
          where: { id },
          data: { dihapus_pada: new Date() },
        });

        success = true;
      } else {
        const chat = await prisma.m_chat.findFirst({
          where: { id, dihapus_pada: null },
        });

        if (!chat) {
          return errorResponse(404, "Pesan utama tidak ditemukan", "NOT_FOUND");
        }

        platformMsgId = chat.platform_msg_id;
        senderId = chat.sender_id;
        akunId = chat.akun_id;

        // Soft delete locally
        await prisma.m_chat.update({
          where: { id },
          data: { dihapus_pada: new Date() },
        });

        success = true;
      }

      // Try to unsend/delete on WhatsApp device if connected
      let deletedOnWhatsapp = false;
      if (success && platformMsgId && senderId && akunId) {
        try {
          const { getWhatsappClient, deleteWhatsappMessage } = await import(
            "@/lib/whatsapp-client"
          );
          const clientInfo = getWhatsappClient(akunId);

          if (clientInfo.status === "connected" && clientInfo.client) {
            await deleteWhatsappMessage(akunId, senderId, platformMsgId);
            deletedOnWhatsapp = true;
          }
        } catch (waErr) {
          console.error("[Chat Delete] Failed to delete message on WhatsApp device:", waErr);
          // We continue because local soft-delete succeeded
        }
      }

      // Emit real-time event to notify SSE active connections
      if (akunId && senderId) {
        try {
          const { emitWhatsappEvent } = await import("@/lib/whatsapp-client");
          emitWhatsappEvent(akunId, "chat_update", {
            type: "message_delete",
            contactId: senderId,
            messageId: id,
            messageType: type,
          });
        } catch (emitErr) {
          console.error("Failed to emit chat_update event on delete:", emitErr);
        }
      }

      return successResponse(
        { message: "Pesan berhasil dihapus", deleted_on_whatsapp: deletedOnWhatsapp },
        200
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
