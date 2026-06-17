import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaPerbaruiToken } from "@/lib/validations/sosial-media.schema";

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
          parsed.error.errors[0].message,
          "VALIDATION_ERROR"
        );
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

      const { access_token, refresh_token, token_expires_at } = parsed.data;

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
