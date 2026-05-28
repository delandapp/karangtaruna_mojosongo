import { prisma } from "@/lib/prisma";
import { updateRapatSchema } from "@/lib/validations/rapat.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import {
  REDIS_KEYS,
  DEFAULT_CACHE_TTL,
} from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// GET /api/rapat/:id — Detail Rapat
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const rapatId = parseId(id);
      if (!rapatId)
        return errorResponse(400, "ID Rapat tidak valid", "VALIDATION_ERROR");

      // 1. Cek Redis cache
      const cacheKey = REDIS_KEYS.RAPAT.SINGLE(rapatId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // Ambil langsung dari database
      let rapat = await prisma.m_rapat.findUnique({
        where: { id: rapatId },
        include: {
          kategori: true,
          event: { select: { id: true, nama_event: true, kode_event: true } },
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
          agendas: { orderBy: { urutan: "asc" } },
          peserta: true,
          notulen: true,
        },
      });

      if (!rapat)
        return errorResponse(404, "Rapat tidak ditemukan", "NOT_FOUND");

      // 3. Simpan ke cache
      await setCache(cacheKey, rapat, DEFAULT_CACHE_TTL);

      return successResponse(rapat, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/rapat/:id — Update Rapat
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const rapatId = parseId(id);
      if (!rapatId)
        return errorResponse(400, "ID Rapat tidak valid", "VALIDATION_ERROR");

      const existing = await prisma.m_rapat.findUnique({
        where: { id: rapatId },
        select: { id: true, status_rapat: true },
      });
      if (!existing)
        return errorResponse(404, "Rapat tidak ditemukan", "NOT_FOUND");

      // Larang update rapat yang sudah selesai atau dibatalkan
      if (existing.status_rapat === "SELESAI" || existing.status_rapat === "DIBATALKAN") {
        return errorResponse(
          422,
          `Rapat dengan status "${existing.status_rapat}" tidak dapat diubah`,
          "UNPROCESSABLE_ENTITY",
        );
      }

      const data = updateRapatSchema.parse(await req.json());

      // Validasi event_id jika diberikan
      if (data.event_id) {
        const eventExists = await prisma.event.findUnique({
          where: { id: data.event_id },
          select: { id: true },
        });
        if (!eventExists)
          return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
      }

      const updated = await prisma.m_rapat.update({
        where: { id: rapatId },
        data: {
          m_kategori_rapat_id: data.m_kategori_rapat_id,
          event_id: data.event_id,
          judul_rapat: data.judul_rapat,
          jenis_rapat: data.jenis_rapat,
          status_rapat: data.status_rapat,
          deskripsi: data.deskripsi,
          tanggal_mulai: data.tanggal_mulai,
          tanggal_selesai: data.tanggal_selesai,
          lokasi: data.lokasi,
          link_online: data.link_online,
          is_online: data.is_online,
          nomor_rapat: data.nomor_rapat,
          is_recurring: data.is_recurring,
          agendas: data.agendas ? {
            deleteMany: {},
            create: data.agendas.map((a) => ({
              urutan: a.urutan,
              judul_agenda: a.judul_agenda,
              deskripsi: a.deskripsi,
              durasi_menit: a.durasi_menit,
              m_user_id: a.m_user_id,
            }))
          } : undefined,
          peserta: data.peserta ? {
            deleteMany: {},
            create: data.peserta.map((p) => ({
              m_user_id: p.m_user_id,
              nama_peserta: p.nama_peserta,
              jabatan_peserta: p.jabatan_peserta,
              instansi: p.instansi,
              email: p.email,
              no_handphone: p.no_handphone,
              status_kehadiran: p.status_kehadiran,
              is_moderator: p.is_moderator,
              is_notulis: p.is_notulis,
            }))
          } : undefined,
        },
        include: {
          kategori: true,
          event: { select: { id: true, nama_event: true, kode_event: true } },
          dibuat_oleh: { select: { id: true, nama_lengkap: true } },
          agendas: { orderBy: { urutan: "asc" } },
          peserta: true,
          notulen: true,
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.RAPAT.SINGLE(rapatId));
      await invalidateCachePrefix(REDIS_KEYS.RAPAT.ALL_PREFIX);
      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/rapat/:id — Hapus Rapat
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const rapatId = parseId(id);
      if (!rapatId)
        return errorResponse(400, "ID Rapat tidak valid", "VALIDATION_ERROR");

      const existing = await prisma.m_rapat.findUnique({
        where: { id: rapatId },
        select: { id: true, status_rapat: true },
      });
      if (!existing)
        return errorResponse(404, "Rapat tidak ditemukan", "NOT_FOUND");

      // Larang hapus rapat yang sedang berlangsung
      if (existing.status_rapat === "BERLANGSUNG") {
        return errorResponse(
          422,
          "Rapat yang sedang berlangsung tidak dapat dihapus",
          "UNPROCESSABLE_ENTITY",
        );
      }

      await prisma.m_rapat.delete({ where: { id: rapatId } });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.RAPAT.SINGLE(rapatId));
      await invalidateCachePrefix(REDIS_KEYS.RAPAT.ALL_PREFIX);
      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
