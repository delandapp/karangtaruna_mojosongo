import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaHubungkanAkun } from "@/lib/validations/sosial-media.schema";

// ──────────────────────────────────────────────────────────
// GET /api/sosial-media/akun — Get Connected Accounts
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const platformIdParam = searchParams.get("platform_id");

    const platformId = platformIdParam ? Number(platformIdParam) : undefined;

    const accounts = await prisma.m_akun_sosmed.findMany({
      where: {
        dihapus_pada: null,
        ...(platformId ? { platform_id: platformId } : {}),
      },
      include: {
        platform: true,
      },
      orderBy: {
        nama_akun: "asc",
      },
    });

    return successResponse(accounts, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/sosial-media/akun — Hubungkan Akun Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();

    // Validasi input
    const parsed = schemaHubungkanAkun.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        400,
        parsed.error.errors[0].message,
        "VALIDATION_ERROR"
      );
    }

    const {
      platform_id,
      nama_akun,
      username,
      access_token,
      refresh_token,
      token_expires_at,
    } = parsed.data;

    // Cek apakah platform ada dan aktif
    const platform = await prisma.m_platform.findFirst({
      where: {
        id: platform_id,
        aktif: true,
        dihapus_pada: null,
      },
    });

    if (!platform) {
      return errorResponse(404, "Platform tidak ditemukan atau tidak aktif", "NOT_FOUND");
    }

    // Buat akun baru atau update jika sudah ada tapi soft-deleted
    const existing = await prisma.m_akun_sosmed.findFirst({
      where: {
        platform_id,
        username,
      },
    });

    let account;
    if (existing) {
      account = await prisma.m_akun_sosmed.update({
        where: { id: existing.id },
        data: {
          nama_akun,
          access_token,
          refresh_token: refresh_token || null,
          token_expires_at: token_expires_at ? new Date(token_expires_at) : null,
          status: "terhubung",
          dihapus_pada: null, // restore
        },
        include: {
          platform: true,
        },
      });
    } else {
      account = await prisma.m_akun_sosmed.create({
        data: {
          platform_id,
          nama_akun,
          username,
          access_token,
          refresh_token: refresh_token || null,
          token_expires_at: token_expires_at ? new Date(token_expires_at) : null,
          status: "terhubung",
        },
        include: {
          platform: true,
        },
      });
    }

    return successResponse(account, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
