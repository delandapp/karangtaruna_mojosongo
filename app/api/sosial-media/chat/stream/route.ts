import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { whatsappClients, addWhatsappEventListener } from "@/lib/whatsapp-client";

// ──────────────────────────────────────────────────────────
// GET /api/sosial-media/chat/stream?akun_id=...
// Server-Sent Events — Real-time chat updates via webhook
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url);
  const akunIdParam = searchParams.get("akun_id");
  const akunId = akunIdParam ? parseInt(akunIdParam, 10) : null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial "connected" event
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`
        )
      );

      // Heartbeat every 25s to prevent connection timeout
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`
            )
          );
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      // Watch WhatsApp client status changes for the specified account
      let lastKnownStatus: string | null = null;
      const statusPoll = setInterval(() => {
        try {
          if (akunId) {
            const clientInfo = whatsappClients[akunId];
            const currentStatus = clientInfo?.status || "disconnected";
            if (currentStatus !== lastKnownStatus) {
              lastKnownStatus = currentStatus;
              controller.enqueue(
                encoder.encode(
                  `event: status_change\ndata: ${JSON.stringify({
                    akun_id: akunId,
                    status: currentStatus,
                  })}\n\n`
                )
              );
            }
          }
        } catch {
          clearInterval(statusPoll);
        }
      }, 3000);

      // Subscribe to real-time events from whatsapp-client
      let unsubscribe: (() => void) | null = null;
      if (akunId) {
        unsubscribe = addWhatsappEventListener(akunId, (event, data) => {
          try {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
              )
            );
          } catch {
            // Stream might be closed or aborted
          }
        });
      }

      // Cleanup on client disconnect
      req.signal?.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clearInterval(statusPoll);
        if (unsubscribe) {
          unsubscribe();
        }
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
