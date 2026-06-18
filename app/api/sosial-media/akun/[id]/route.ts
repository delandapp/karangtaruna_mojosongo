import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaPerbaruiToken } from "@/lib/validations/sosial-media.schema";
import { IgApiClient } from "instagram-private-api";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ──────────────────────────────────────────────────────────
// PUT /api/sosial-media/akun/[id] — Perbarui Token Akun
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = parseId(rawId);
      if (!id) {
        return errorResponse(400, "ID Akun tidak valid", "VALIDATION_ERROR");
      }

      const body = await req.json();

      // Validasi input
      const parsed = schemaPerbaruiToken.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          400,
          parsed.error.issues[0].message,
          "VALIDATION_ERROR"
        );
      }

      const existing = await prisma.m_akun_sosmed.findFirst({
        where: {
          id,
          dihapus_pada: null,
        },
        include: {
          platform: true,
        },
      });

      if (!existing) {
        return errorResponse(404, "Akun tidak ditemukan", "NOT_FOUND");
      }

      const { access_token, refresh_token, token_expires_at } = parsed.data;

      const platformSlug = existing.platform.slug.toLowerCase();

      // Pre-validate Instagram credentials when updating password/token
      if (platformSlug === "instagram") {
        try {
          const ig = new IgApiClient();
          ig.state.generateDevice(existing.username);
          await ig.simulate.preLoginFlow();
          await ig.account.login(existing.username, access_token);
        } catch (loginError: any) {
          console.error("Instagram pre-validation login failed on update:", loginError);
          const errMsg = loginError?.message || "";
          const errName = loginError?.name || "";

          if (errMsg.includes("challenge") || errMsg.includes("checkpoint")) {
            return errorResponse(
              401,
              "Gagal memperbarui token karena verifikasi keamanan Instagram (OTP/Challenge). Silakan buka aplikasi Instagram Anda, setujui percobaan login, lalu coba kembali.",
              "AUTHENTICATION_CHALLENGE"
            );
          }

          if (
            errMsg.toLowerCase().includes("facebook") ||
            errMsg.toLowerCase().includes("linked facebook") ||
            errMsg.toLowerCase().includes("log in with your linked")
          ) {
            return errorResponse(
              401,
              "Akun Instagram ini terhubung ke Facebook dan tidak memiliki password Instagram sendiri. " +
              "Buka Instagram → Pengaturan → Keamanan → Password, buat password khusus Instagram, " +
              "lalu gunakan password baru tersebut di form ini.",
              "FACEBOOK_LINKED_ACCOUNT"
            );
          }

          if (
            errName === "IgLoginBadPasswordError" ||
            errMsg.toLowerCase().includes("bad password") ||
            errMsg.toLowerCase().includes("wrong password")
          ) {
            return errorResponse(
              401,
              "Password Instagram salah. Pastikan password yang Anda masukkan sudah benar.",
              "WRONG_PASSWORD"
            );
          }

          return errorResponse(
            400,
            `Gagal login ke Instagram: ${errMsg || "Kredensial salah atau diblokir"}`,
            "AUTHENTICATION_ERROR"
          );
        }
      }

      const updated = await prisma.m_akun_sosmed.update({
        where: { id },
        data: {
          access_token,
          refresh_token: refresh_token || null,
          token_expires_at: token_expires_at ? new Date(token_expires_at) : null,
          status: "terhubung",
        },
        include: {
          platform: true,
        },
      });

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// ──────────────────────────────────────────────────────────
// DELETE /api/sosial-media/akun/[id] — Putuskan Akun (Soft Delete)
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = parseId(rawId);
      if (!id) {
        return errorResponse(400, "ID Akun tidak valid", "VALIDATION_ERROR");
      }

      const existing = await prisma.m_akun_sosmed.findFirst({
        where: {
          id,
          dihapus_pada: null,
        },
      });

      if (!existing) {
        return errorResponse(404, "Akun tidak ditemukan", "NOT_FOUND");
      }

      // Soft delete: set status to "terputus" and set dihapus_pada
      await prisma.m_akun_sosmed.update({
        where: { id },
        data: {
          status: "terputus",
          dihapus_pada: new Date(),
        },
      });

      return successResponse({ message: "Akun berhasil diputuskan" }, 200);
    } catch (error) {
      return handleApiError(error);
    }
  }
);
