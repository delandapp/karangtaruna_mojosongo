import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { invalidateCachePrefix } from "@/lib/redis";
import { z } from "zod";

interface RouteProps {
  params: Promise<{ id: string }>;
}

const approveSchema = z.object({
  status: z.enum(["disetujui", "ditolak"]),
  catatan: z.string().optional().nullable(),
});

// ──────────────────────────────────────────────────────────
// POST /api/keuangan/kas/[id]/approve — Setujui/Tolak Kas
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { userId, m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    
    // Gunakan permission PUT pada anggaran sebagai pemetaan akses approve keuangan
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak: Anda tidak memiliki izin untuk memvalidasi kas.", "FORBIDDEN");
    }

    const { id: idStr } = await props.params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const existing = await prisma.m_kas.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(404, "Transaksi kas tidak ditemukan", "NOT_FOUND");
    }

    const body = await req.json();
    const { status, catatan } = approveSchema.parse(body);

    const updated = await prisma.m_kas.update({
      where: { id },
      data: {
        status,
        catatan: catatan || existing.catatan,
        disetujui_oleh_id: userId,
        disetujui_pada: new Date(),
      },
      include: {
        dicatat_oleh: { select: { id: true, nama_lengkap: true } },
        disetujui_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    // Invalidate caches
    await invalidateCachePrefix("keuangan:kas:*");

    return successResponse(updated, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
