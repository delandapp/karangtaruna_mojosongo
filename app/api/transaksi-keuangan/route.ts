import { prisma } from "@/lib/prisma";
import { createTransaksiKeuanganSchema } from "@/lib/validations/keuangan.schema";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { ELASTIC_INDICES, DEFAULT_CACHE_TTL } from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { z } from "zod";

// ─── Cache Keys ───────────────────────────────────────────────────────────────

const cacheKeyList = (page: number, limit: number) =>
  `transaksi_keuangan:all:page:${page}:limit:${limit}`;
const CACHE_INVALIDATE_PREFIX = "transaksi_keuangan:all:*";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateNomorTransaksi(jenis: string): string {
  const prefix = jenis === "pemasukan" ? "TRXI" : "TRXO";
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomStr}`;
}

// ─── Query Schema ─────────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(100),
  anggaran_id: z.coerce.number().int().positive().optional(),
  item_anggaran_id: z.coerce.number().int().positive().optional(),
  jenis_transaksi: z.string().optional(),
  status: z.string().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/transaksi-keuangan — List dengan Pagination & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const {
      page,
      limit,
      anggaran_id,
      item_anggaran_id,
      jenis_transaksi,
      status,
    } = listQuerySchema.parse(Object.fromEntries(searchParams));

    const skip = (page - 1) * limit;
    const isFiltered = !!(
      anggaran_id ||
      item_anggaran_id ||
      jenis_transaksi ||
      status
    );

    // Cek cache hanya untuk query tanpa filter
    const cacheKey = cacheKeyList(page, limit);
    if (!isFiltered) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    // Build Elasticsearch query
    const must: Record<string, unknown>[] = [];
    if (anggaran_id) must.push({ term: { anggaran_id } });
    if (item_anggaran_id) must.push({ term: { item_anggaran_id } });
    if (jenis_transaksi) must.push({ term: { jenis_transaksi } });
    if (status) must.push({ term: { status } });

    const esQuery = must.length > 0 ? { bool: { must } } : { match_all: {} };

    const { hits, total } = await searchDocuments(
      ELASTIC_INDICES.TRANSAKSI_KEUANGAN,
      esQuery,
      {
        from: skip,
        size: limit,
        sort: [
          { tanggal_transaksi: { order: "desc" } },
          { id: { order: "desc" } },
        ],
      },
    );

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache hanya untuk query tanpa filter
    if (!isFiltered) {
      await setCache(cacheKey, { data: hits, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(hits, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/transaksi-keuangan — Catat Transaksi Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userId } = req.user;

    const body = await req.json();
    const data = createTransaksiKeuanganSchema.parse(body);

    // Validasi anggaran_id
    const anggaranExists = await prisma.anggaran.findUnique({
      where: { id: data.anggaran_id },
      select: { id: true, event_id: true },
    });
    if (!anggaranExists)
      return errorResponse(404, "Anggaran tidak ditemukan", "NOT_FOUND");

    // Validasi item_anggaran_id jika diberikan
    if (data.item_anggaran_id) {
      const itemExists = await prisma.item_anggaran.findUnique({
        where: {
          id: data.item_anggaran_id,
          anggaran_id: data.anggaran_id,
        },
        select: { id: true },
      });
      if (!itemExists)
        return errorResponse(
          404,
          "Item Anggaran tidak valid untuk anggaran ini",
          "NOT_FOUND",
        );
    }

    const nomor_transaksi = generateNomorTransaksi(data.jenis_transaksi);

    const transaksi = await prisma.transaksi_keuangan.create({
      data: {
        anggaran_id: data.anggaran_id,
        item_anggaran_id: data.item_anggaran_id,
        dicatat_oleh_id: userId,
        nomor_transaksi,
        jenis_transaksi: data.jenis_transaksi,
        jumlah: data.jumlah,
        deskripsi: data.deskripsi,
        bukti_url: data.bukti_url,
        tanggal_transaksi: new Date(data.tanggal_transaksi),
        catatan: data.catatan,
        status: "menunggu_persetujuan",
      },
      include: {
        dicatat_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(CACHE_INVALIDATE_PREFIX);

    return successResponse(transaksi, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
