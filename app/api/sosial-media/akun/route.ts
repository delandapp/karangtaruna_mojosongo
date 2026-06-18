import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaHubungkanAkun } from "@/lib/validations/sosial-media.schema";
import { authenticateInstagram } from "@/lib/instagram-login";

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
        parsed.error.issues[0].message,
        "VALIDATION_ERROR"
      );
    }

    const {
      platform_id,
      nama_akun,
      username,
      access_token,
      session_id,
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

    const platformSlug = platform.slug.toLowerCase();

    // Pre-validate Instagram credentials using robust auth (API + Puppeteer fallback)
    let igSerializedState: string | null = null;
    if (platformSlug === "instagram") {
      try {
        console.log(`[Instagram] Authenticating ${username} before saving account...`);
        const { serializedState } = await authenticateInstagram(username, access_token ?? undefined, session_id ?? undefined);
        igSerializedState = serializedState;
        console.log(`[Instagram] Authentication successful for ${username}.`);
      } catch (loginError: any) {
        console.error("Instagram pre-validation login failed:", loginError);
        const errMsg = loginError?.message || "";
        const errName = loginError?.name || "";

        if (errMsg.includes("challenge") || errMsg.includes("checkpoint")) {
          return errorResponse(
            401,
            "Gagal menghubungkan akun karena verifikasi keamanan Instagram (OTP/Challenge). Silakan buka aplikasi Instagram Anda, setujui percobaan login, lalu coba hubungkan kembali.",
            "AUTHENTICATION_CHALLENGE"
          );
        }

        if (errMsg === "WRONG_PASSWORD" || errMsg.toLowerCase().includes("password instagram salah")) {
          return errorResponse(
            401,
            "Password Instagram salah. Pastikan password yang Anda masukkan saat menghubungkan akun sudah benar.",
            "WRONG_PASSWORD"
          );
        }

        if (errMsg === "SECURITY_CHALLENGE" || errMsg.toLowerCase().includes("verifikasi keamanan")) {
          return errorResponse(
            401,
            "Verifikasi keamanan Instagram diperlukan. Silakan buka aplikasi Instagram Anda untuk memverifikasi login, lalu coba hubungkan kembali.",
            "SECURITY_CHALLENGE"
          );
        }

        if (errName === "IgLoginBadPasswordError" || errMsg.toLowerCase().includes("bad password")) {
          return errorResponse(
            401,
            "Password Instagram salah. Pastikan password yang Anda masukkan saat menghubungkan akun sudah benar.",
            "WRONG_PASSWORD"
          );
        }

        return errorResponse(
          401,
          `Gagal login ke Instagram: ${errMsg || "Kredensial tidak valid atau akun diblokir"}`,
          "AUTHENTICATION_ERROR"
        );
      }
    }

    // Buat akun baru atau update jika sudah ada tapi soft-deleted
    const existing = await prisma.m_akun_sosmed.findFirst({
      where: {
        platform_id,
        username,
      },
    });

    // For Instagram, use the serialized session state as refresh_token (overrides any user-supplied value)
    const finalRefreshToken = igSerializedState ?? refresh_token ?? null;
    const finalAccessToken = (platformSlug === "instagram" && session_id) ? session_id : (access_token ?? "");

    let account;
    if (existing) {
      account = await prisma.m_akun_sosmed.update({
        where: { id: existing.id },
        data: {
          nama_akun,
          access_token: finalAccessToken,
          refresh_token: finalRefreshToken,
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
          access_token: finalAccessToken,
          refresh_token: finalRefreshToken,
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
