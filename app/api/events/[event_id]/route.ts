import { prisma } from "@/lib/prisma";
import { updateEventSchema } from "@/lib/validations/event.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { ELASTIC_INDICES } from "@/lib/constants";
import { getDocument } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

interface RouteProps {
  params: Promise<{ event_id: string }>;
}

// ──────────────────────────────────────────────────────────
// GET /api/events/:id — Detail Event
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/events", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin membaca data event.", "FORBIDDEN");
    }

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);

    if (isNaN(eventId)) {
      return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");
    }

    // 1. Ambil dari Elasticsearch
    const event = await getDocument(ELASTIC_INDICES.EVENTS, String(eventId));

    if (!event) {
      return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
    }

    return successResponse(event, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/events/:id — Update Event
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/events", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin mengubah data event.", "FORBIDDEN");
    }

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);

    if (isNaN(eventId)) {
      return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");
    }

    // 1. Pastikan event ada
    const existing = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, kode_event: true, status_event: true },
    });
    if (!existing) {
      return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
    }

    // 2. Larang update event yang sudah selesai / dibatalkan
    if (existing.status_event === "selesai" || existing.status_event === "dibatalkan") {
      return errorResponse(
        422,
        `Event dengan status "${existing.status_event}" tidak dapat diubah.`,
        "UNPROCESSABLE_ENTITY"
      );
    }

    const body = await req.json();

    // 3. Validasi Zod — kode_event diabaikan meski dikirim user
    const { ...safeBody } = body;
    delete safeBody.kode_event;  // pastikan user tidak bisa ubah kode
    const validatedData = updateEventSchema.parse(safeBody);

    // 4. Jika ada perubahan m_organisasi_id, verifikasi dulu
    if (validatedData.m_organisasi_id) {
      const orgExists = await prisma.m_organisasi.findUnique({
        where: { id: validatedData.m_organisasi_id },
        select: { id: true },
      });
      if (!orgExists) {
        return errorResponse(404, "Organisasi dengan ID tersebut tidak ditemukan.", "NOT_FOUND");
      }
    }

    // 5. Update ke database
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(validatedData.m_organisasi_id   && { m_organisasi_id:   validatedData.m_organisasi_id }),
        ...(validatedData.nama_event        && { nama_event:        validatedData.nama_event }),
        tema_event:        validatedData.tema_event,
        deskripsi:         validatedData.deskripsi,
        ...(validatedData.jenis_event       && { jenis_event:       validatedData.jenis_event }),
        ...(validatedData.status_event      && { status_event:      validatedData.status_event }),
        ...(validatedData.tanggal_mulai     && { tanggal_mulai:     validatedData.tanggal_mulai }),
        ...(validatedData.tanggal_selesai   && { tanggal_selesai:   validatedData.tanggal_selesai }),
        lokasi:            validatedData.lokasi,
        target_peserta:    validatedData.target_peserta,
        realisasi_peserta: validatedData.realisasi_peserta,
        banner_url:        validatedData.banner_url,
        ...(validatedData.tujuan !== undefined && { tujuan: validatedData.tujuan ?? undefined }),
      },
      include: {
        organisasi:  { select: { id: true, nama_org: true } },
        dibuat_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    return successResponse(updatedEvent, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/events/:id — Hapus Event
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/events", "DELETE");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin menghapus event.", "FORBIDDEN");
    }

    const { event_id } = await props.params;
    const eventId = parseInt(event_id, 10);

    if (isNaN(eventId)) {
      return errorResponse(400, "ID Event tidak valid", "BAD_REQUEST");
    }

    // 1. Pastikan event ada
    const existing = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, status_event: true },
    });
    if (!existing) {
      return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
    }

    // 2. Larang hapus event yang sedang berlangsung atau sudah selesai
    if (existing.status_event === "berlangsung" || existing.status_event === "selesai") {
      return errorResponse(
        422,
        `Event dengan status "${existing.status_event}" tidak dapat dihapus.`,
        "UNPROCESSABLE_ENTITY"
      );
    }

    // 3. Hapus dari database (cascade akan menghapus data anak-anaknya)
    await prisma.event.delete({ where: { id: eventId } });

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
