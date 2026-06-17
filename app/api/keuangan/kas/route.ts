import { prisma } from "@/lib/prisma";
import { createKasSchema } from "@/lib/validations/keuangan.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { z } from "zod";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  jenis_kas: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

function generateNomorKas(jenis: string): string {
  const prefix = jenis === "masuk" ? "KAS-IN" : "KAS-OUT";
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomStr}`;
}

// ──────────────────────────────────────────────────────────
// GET /api/keuangan/kas — List Buku Kas untuk Admin
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak: Anda tidak memiliki izin untuk melihat data keuangan.", "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, jenis_kas, status, search } =
      listQuerySchema.parse(Object.fromEntries(searchParams));

    const skip = (page - 1) * limit;
    const isFiltered = !!(jenis_kas || status || search);

    // Cek cache untuk request non-filter
    const cacheKey = `keuangan:kas:all:page:${page}:limit:${limit}`;
    if (!isFiltered) {
      const cached = await getCache<{ data: any[]; meta: any }>(cacheKey);
      if (cached) {
        return paginatedResponse(cached.data, cached.meta, 200);
      }
    }

    // Build where filter
    const where: any = {};
    if (jenis_kas) {
      where.jenis_kas = jenis_kas;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { sumber_tujuan: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.m_kas.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggal: "desc" },
        include: {
          dicatat_oleh: { select: { id: true, nama_lengkap: true } },
          disetujui_oleh: { select: { id: true, nama_lengkap: true } },
        },
      }),
      prisma.m_kas.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    if (!isFiltered) {
      await setCache(cacheKey, { data: records, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(records, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/keuangan/kas — Buat Ajuan Kas Masuk/Keluar
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userId, m_level_id: levelId, m_jabatan_id: jabatanId } = req.user;
    const hasAccess = await checkUserAccess(levelId, jabatanId, "/api/events/anggaran", "POST");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak: Anda tidak memiliki izin untuk mencatat data keuangan.", "FORBIDDEN");
    }

    const body = await req.json();
    const data = createKasSchema.parse(body);

    const nomor_kas = generateNomorKas(data.jenis_kas);

    const record = await prisma.m_kas.create({
      data: {
        nomor_kas,
        jenis_kas: data.jenis_kas,
        sumber_tujuan: data.sumber_tujuan,
        jumlah: data.jumlah,
        deskripsi: data.deskripsi,
        bukti_url: data.bukti_url,
        tanggal: new Date(data.tanggal),
        catatan: data.catatan,
        dicatat_oleh_id: userId,
        status: "menunggu_persetujuan", // Default status is pending
      },
      include: {
        dicatat_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    // Invalidate caches
    await invalidateCachePrefix("keuangan:kas:*");

    return successResponse(record, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
