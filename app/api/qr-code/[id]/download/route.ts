import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import QRCode from "qrcode";

type RouteContext = { params: Promise<{ id: string }> };

// ──────────────────────────────────────────────────────────
// GET /api/qr-code/[id]/download — High-res generation/download
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    const { searchParams } = new URL(req.url);
    const formatParam = (searchParams.get("format") || "png").toLowerCase();

    // Check ownership & existence
    const qrcode = await prisma.m_qr_code.findFirst({
      where: {
        id,
        dihapus_pada: null,
        dibuat_oleh_id: req.user.userId,
      },
    });

    if (!qrcode) {
      return errorResponse(404, "QR Code tidak ditemukan", "NOT_FOUND");
    }

    // Convert error correction level to correct format
    let level: "L" | "M" | "Q" | "H" = "M";
    if (["L", "M", "Q", "H"].includes(qrcode.level_koreksi)) {
      level = qrcode.level_koreksi as "L" | "M" | "Q" | "H";
    }

    // Prepare qrcode options
    const options: QRCode.QRCodeToBufferOptions = {
      margin: qrcode.margin,
      errorCorrectionLevel: level,
      color: {
        dark: qrcode.warna_depan,
        light: qrcode.warna_belakang,
      },
    };

    if (formatParam === "svg") {
      const svgString = await QRCode.toString(qrcode.konten, {
        ...options,
        type: "svg",
      });

      return new Response(svgString, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="qrcode-${qrcode.id}.svg"`,
        },
      });
    } else {
      // Default to PNG with configured custom width
      const pngBuffer = await QRCode.toBuffer(qrcode.konten, {
        ...options,
        type: "png",
        width: qrcode.ukuran,
      });

      return new Response(pngBuffer as any, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="qrcode-${qrcode.id}.png"`,
        },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
});
