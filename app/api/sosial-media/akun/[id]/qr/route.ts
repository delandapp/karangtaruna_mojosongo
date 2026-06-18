import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { getWhatsappClient } from "@/lib/whatsapp-client";

// ──────────────────────────────────────────────────────────
// GET /api/sosial-media/akun/[id]/qr — Poll WhatsApp QR Status
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (
    req: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const akunId = Number(id);

      if (isNaN(akunId)) {
        return errorResponse(400, "ID akun tidak valid", "VALIDATION_ERROR");
      }

      const clientInfo = getWhatsappClient(akunId);

      let pairingCode: string | null = null;
      let qrCode = clientInfo.qrCode;

      if (qrCode && qrCode.startsWith("pairing_code:")) {
        pairingCode = qrCode.replace("pairing_code:", "");
        qrCode = null;
      }

      return successResponse(
        {
          status: clientInfo.status,
          qrCode,
          pairingCode,
          error: clientInfo.error,
        },
        200
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
