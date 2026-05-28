import { prisma } from "@/lib/prisma";
import { updateNotulenSchema } from "@/lib/validations/notulen.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import {
  REDIS_KEYS,
  ELASTIC_INDICES,
  DEFAULT_CACHE_TTL,
} from "@/lib/constants";
import {
  getDocument,
  indexDocument,
  deleteDocument,
} from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = { params: Promise<{ id: string }> };

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// GET /api/notulen/:id — Detail Notulen
// ──────────────────────────────────────────────────────────
export const GET = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const notulenId = parseId(id);
      if (!notulenId)
        return errorResponse(400, "ID Notulen tidak valid", "VALIDATION_ERROR");

      const cacheKey = REDIS_KEYS.NOTULEN.SINGLE(notulenId);
      const cached = await getCache<unknown>(cacheKey);
      if (cached) return successResponse(cached, 200);

      // Coba ES dulu, fallback ke DB
      let notulen: any = await getDocument(ELASTIC_INDICES.NOTULEN, notulenId);
      if (!notulen) {
        notulen = await prisma.m_notulen.findUnique({
          where: { id: notulenId },
          include: {
            rapat: { select: { id: true, judul_rapat: true } },
            notulis: { select: { id: true, nama_lengkap: true } },
            poin_bahasan: { orderBy: { urutan: "asc" } },
            keputusan: { orderBy: { urutan: "asc" } },
            tindak_lanjut: true,
          },
        });
      }

      if (!notulen)
        return errorResponse(404, "Notulen tidak ditemukan", "NOT_FOUND");

      await setCache(cacheKey, notulen, DEFAULT_CACHE_TTL);
      return successResponse(notulen, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// PUT /api/notulen/:id — Update Notulen
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const notulenId = parseId(id);
      if (!notulenId)
        return errorResponse(400, "ID Notulen tidak valid", "VALIDATION_ERROR");

      const { userId } = req.user;
      const existing = await prisma.m_notulen.findUnique({
        where: { id: notulenId },
        select: { id: true, status: true },
      });
      if (!existing)
        return errorResponse(404, "Notulen tidak ditemukan", "NOT_FOUND");

      if (existing.status === "FINAL") {
        return errorResponse(
          422,
          "Notulen dengan status FINAL tidak dapat diubah",
          "UNPROCESSABLE_ENTITY",
        );
      }

      const data = updateNotulenSchema.parse(await req.json());

      const updated = await prisma.m_notulen.update({
        where: { id: notulenId },
        data: {
          nomor_notulen: data.nomor_notulen,
          status: data.status,
          pembukaan: data.pembukaan,
          penutupan: data.penutupan,
          kesimpulan_umum: data.kesimpulan_umum,
          poin_bahasan: data.poin_bahasan
            ? {
                deleteMany: {},
                create: data.poin_bahasan.map((pb) => ({
                  urutan: pb.urutan,
                  isi_bahasan: pb.isi_bahasan,
                  pembicara: pb.pembicara,
                  c_agenda_rapat_id: pb.c_agenda_rapat_id,
                })),
              }
            : undefined,
          keputusan: data.keputusan
            ? {
                deleteMany: {},
                create: data.keputusan.map((k) => ({
                  urutan: k.urutan,
                  isi_keputusan: k.isi_keputusan,
                  dasar_keputusan: k.dasar_keputusan,
                  is_konsensus: k.is_konsensus,
                })),
              }
            : undefined,
          tindak_lanjut: data.tindak_lanjut
            ? {
                deleteMany: {},
                create: data.tindak_lanjut.map((tl) => ({
                  m_user_id_pic: tl.m_user_id_pic,
                  m_user_id_pembuat: userId,
                  judul: tl.judul,
                  deskripsi: tl.deskripsi,
                  deadline: tl.deadline,
                  prioritas: tl.prioritas,
                  status: tl.status,
                })),
              }
            : undefined,
        },
        include: {
          rapat: { select: { id: true, judul_rapat: true } },
          notulis: { select: { id: true, nama_lengkap: true } },
          poin_bahasan: { orderBy: { urutan: "asc" } },
          keputusan: { orderBy: { urutan: "asc" } },
          tindak_lanjut: true,
        },
      });

      // Audit trail: catat perubahan status
      if (data.status && data.status !== existing.status) {
        // Ambil count revisi saat ini untuk nomor_revisi
        const revisiCount = await prisma.c_revisi_notulen.count({
          where: { m_notulen_id: notulenId },
        });
        await prisma.c_revisi_notulen.create({
          data: {
            m_notulen_id: notulenId,
            m_user_id: userId,
            nomor_revisi: revisiCount + 1,
            snapshot_json: JSON.stringify(updated),
            catatan_revisi: `Status berubah dari ${existing.status} menjadi ${data.status}`,
            status_dari: existing.status,
            status_ke: data.status,
          },
        });
      }

      await invalidateCachePrefix(REDIS_KEYS.NOTULEN.SINGLE(notulenId));
      await indexDocument(ELASTIC_INDICES.NOTULEN, String(updated.id), updated);
      await invalidateCachePrefix(REDIS_KEYS.NOTULEN.ALL_PREFIX);
      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/notulen/:id — Hapus Notulen (hanya DRAFT)
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (_req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id } = await params;
      const notulenId = parseId(id);
      if (!notulenId)
        return errorResponse(400, "ID Notulen tidak valid", "VALIDATION_ERROR");

      const existing = await prisma.m_notulen.findUnique({
        where: { id: notulenId },
        select: { id: true, status: true },
      });
      if (!existing)
        return errorResponse(404, "Notulen tidak ditemukan", "NOT_FOUND");

      if (existing.status !== "DRAFT") {
        return errorResponse(
          422,
          "Hanya notulen dengan status DRAFT yang dapat dihapus",
          "UNPROCESSABLE_ENTITY",
        );
      }

      await prisma.m_notulen.delete({ where: { id: notulenId } });

      await invalidateCachePrefix(REDIS_KEYS.NOTULEN.SINGLE(notulenId));
      await deleteDocument(ELASTIC_INDICES.NOTULEN, String(id));
      await invalidateCachePrefix(REDIS_KEYS.NOTULEN.ALL_PREFIX);
      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
