import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { NextRequest } from "next/server";

// ──────────────────────────────────────────────────────────
// POST /api/linktree/track — Track Link Click (Public)
// ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { linktreeId, linkId } = body;

    if (!linktreeId) {
      return errorResponse(400, "ID Linktree wajib diisi", "LINKTREE_ID_REQUIRED");
    }

    // Extract headers
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;
    const referer = req.headers.get("referer") || null;

    // Simple device detection
    let perangkat = "desktop";
    if (userAgent) {
      const ua = userAgent.toLowerCase();
      if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
        perangkat = "mobile";
      } else if (ua.includes("tablet") || ua.includes("ipad")) {
        perangkat = "tablet";
      }
    }

    // Insert click record
    await prisma.c_klik_linktree.create({
      data: {
        linktree_id: Number(linktreeId),
        link_id: linkId ? Number(linkId) : null,
        ip_address: ipAddress,
        user_agent: userAgent,
        referer: referer,
        perangkat: perangkat,
      },
    });

    return successResponse({ tracked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
