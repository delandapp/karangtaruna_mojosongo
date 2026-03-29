import { prisma } from "@/lib/prisma";
import { updateRapatSchema } from "@/lib/validations/rapat.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { ELASTIC_INDICES } from "@/lib/constants";
import { getDocument } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/rapat", "GET");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { id } = await props.params;
    const rapatId = parseInt(id, 10);
    if (isNaN(rapatId)) return errorResponse(400, "ID Rapat tidak valid", "BAD_REQUEST");

    const cacheKey = `rapat:${rapatId}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return successResponse(cached, 200);

    // 2. Ambil dari Elasticsearch
    const rapat = await getDocument(ELASTIC_INDICES.RAPAT, id);
    if (!rapat) return errorResponse(404, "Rapat tidak ditemukan", "NOT_FOUND");

    return successResponse(rapat, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/rapat", "PUT");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { id } = await props.params;
    const rapatId = parseInt(id, 10);
    if (isNaN(rapatId)) return errorResponse(400, "ID Rapat tidak valid", "BAD_REQUEST");

    const existing = await prisma.rapat.findUnique({ where: { id: rapatId }, select: { id: true, status: true } });
    if (!existing) return errorResponse(404, "Rapat tidak ditemukan", "NOT_FOUND");

    if (existing.status === "selesai" || existing.status === "dibatalkan") {
      return errorResponse(422, `Rapat dengan status "${existing.status}" tidak dapat diubah`, "UNPROCESSABLE_ENTITY");
    }

    const data = updateRapatSchema.parse(await req.json());

    if (data.event_id) {
      const eventExists = await prisma.event.findUnique({ where: { id: data.event_id }, select: { id: true } });
      if (!eventExists) return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
    }

    const updated = await prisma.rapat.update({
      where: { id: rapatId },
      data: {
        event_id:       data.event_id,
        judul:          data.judul,
        tanggal_rapat:  data.tanggal_rapat,
        lokasi:         data.lokasi,
        notulensi:      data.notulensi,
        status:         data.status,
        agenda:         data.agenda !== undefined ? (data.agenda as any) : undefined,
        action_items:   data.action_items !== undefined ? (data.action_items as any) : undefined,
      },
      include: {
        event:       { select: { id: true, nama_event: true, kode_event: true } },
        dibuat_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });
    return successResponse(updated, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/rapat", "DELETE");
    if (!hasAccess) return errorResponse(403, "Akses ditolak.", "FORBIDDEN");

    const { id } = await props.params;
    const rapatId = parseInt(id, 10);
    if (isNaN(rapatId)) return errorResponse(400, "ID Rapat tidak valid", "BAD_REQUEST");

    const existing = await prisma.rapat.findUnique({ where: { id: rapatId }, select: { id: true, status: true } });
    if (!existing) return errorResponse(404, "Rapat tidak ditemukan", "NOT_FOUND");

    if (existing.status === "berlangsung") {
      return errorResponse(422, "Rapat yang sedang berlangsung tidak dapat dihapus", "UNPROCESSABLE_ENTITY");
    }

    await prisma.rapat.delete({ where: { id: rapatId } });
    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
