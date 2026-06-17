import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { z } from "zod";
import { STATUS_CHAT } from "@/lib/validations/sosial-media.schema";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ──────────────────────────────────────────────────────────
// GET /api/sosial-media/chat/[id] — Detail Chat + Tandai Dibaca
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = parseId(rawId);
      if (!id) {
        return errorResponse(400, "ID Chat tidak valid", "VALIDATION_ERROR");
      }

      const existing = await prisma.m_chat.findFirst({
        where: {
          id,
          dihapus_pada: null,
        },
      });

      if (!existing) {
        return errorResponse(404, "Pesan tidak ditemukan", "NOT_FOUND");
      }

      // Automatically mark as read if not already read
      let chat = existing;
      if (!existing.sudah_dibaca) {
        chat = await prisma.m_chat.update({
          where: { id },
          data: { sudah_dibaca: true },
        });
      }

      const fullChat = await prisma.m_chat.findUnique({
        where: { id },
        include: {
          akun: {
            include: {
              platform: true,
            },
          },
          balasan: {
            where: {
              dihapus_pada: null,
            },
            orderBy: {
              dibuat_pada: "asc",
            },
          },
        },
      });

      return successResponse(fullChat, 200);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// ──────────────────────────────────────────────────────────
// PUT /api/sosial-media/chat/[id] — Update Status Chat (e.g. arsipkan)
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const id = parseId(rawId);
      if (!id) {
        return errorResponse(400, "ID Chat tidak valid", "VALIDATION_ERROR");
      }

      const body = await req.json();

      // Validate the status input
      const schemaStatus = z.object({
        status: z.enum(STATUS_CHAT, {
          required_error: "Status wajib diisi",
        }),
      });

      const parsed = schemaStatus.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          400,
          parsed.error.errors[0].message,
          "VALIDATION_ERROR"
        );
      }

      const { status } = parsed.data;

      const existing = await prisma.m_chat.findFirst({
        where: {
          id,
          dihapus_pada: null,
        },
      });

      if (!existing) {
        return errorResponse(404, "Pesan tidak ditemukan", "NOT_FOUND");
      }

      const updated = await prisma.m_chat.update({
        where: { id },
        data: { status },
        include: {
          akun: {
            include: {
              platform: true,
            },
          },
          balasan: {
            where: {
              dihapus_pada: null,
            },
            orderBy: {
              dibuat_pada: "asc",
            },
          },
        },
      });

      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  }
);
