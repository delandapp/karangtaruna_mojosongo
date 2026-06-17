import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const publicQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(20),
  jenis_kas: z.enum(["masuk", "keluar"]).optional(),
  tahun: z.coerce.number().int().optional(),
  bulan: z.coerce.number().int().min(1).max(12).optional(),
  search: z.string().optional(),
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/keuangan/kas/public — Buku Kas Publik (Transparansi Keuangan)
// ──────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = publicQuerySchema.parse(Object.fromEntries(searchParams));
    const { page, limit, jenis_kas, tahun, bulan, search } = parsed;

    const skip = (page - 1) * limit;
    const isFiltered = !!(jenis_kas || tahun || bulan || search);

    // Build where clause — only disetujui for public transparency
    const where: Prisma.m_kasWhereInput = {
      status: "disetujui",
    };

    if (jenis_kas) where.jenis_kas = jenis_kas;

    if (tahun || bulan) {
      const gteDate = new Date(tahun ?? 2000, bulan ? bulan - 1 : 0, 1);
      const ltDate = bulan
        ? new Date(tahun ?? 2000, bulan, 1)          // next month
        : new Date((tahun ?? 2000) + 1, 0, 1);        // next year
      where.tanggal = { gte: gteDate, lt: ltDate };
    }

    if (search) {
      where.OR = [
        { sumber_tujuan: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
        { nomor_kas: { contains: search, mode: "insensitive" } },
      ];
    }

    // Cache key (only for unfiltered)
    const cacheKey = `keuangan:kas:public:${page}:${limit}:${jenis_kas ?? ""}:${tahun ?? ""}:${bulan ?? ""}`;
    if (!isFiltered) {
      const cached = await getCache<object>(cacheKey);
      if (cached) return NextResponse.json(cached, { status: 200 });
    }

    // Summary WHERE (filter jenis_kas + date but no search — for summary)
    const summaryWhere: Prisma.m_kasWhereInput = { ...where };
    delete (summaryWhere as Record<string, unknown>).OR;

    const [records, total, masukAgg, keluarAgg] = await Promise.all([
      prisma.m_kas.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggal: "desc" },
        select: {
          id: true,
          nomor_kas: true,
          jenis_kas: true,
          sumber_tujuan: true,
          jumlah: true,
          deskripsi: true,
          bukti_url: true,
          tanggal: true,
          status: true,
          catatan: true,
        },
      }),
      prisma.m_kas.count({ where }),
      prisma.m_kas.aggregate({
        where: { ...summaryWhere, jenis_kas: "masuk" },
        _sum: { jumlah: true },
        _count: { id: true },
      }),
      prisma.m_kas.aggregate({
        where: { ...summaryWhere, jenis_kas: "keluar" },
        _sum: { jumlah: true },
        _count: { id: true },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };
    const masukVal = masukAgg._sum.jumlah ? Number(masukAgg._sum.jumlah) : 0;
    const keluarVal = keluarAgg._sum.jumlah ? Number(keluarAgg._sum.jumlah) : 0;
    const saldo = masukVal - keluarVal;
    const summary = {
      total_masuk: masukAgg._sum.jumlah?.toString() ?? "0",
      total_keluar: keluarAgg._sum.jumlah?.toString() ?? "0",
      saldo: saldo.toString(),
      count_masuk: masukAgg._count.id,
      count_keluar: keluarAgg._count.id,
    };

    const responseBody = { success: true, summary, data: records, meta };

    if (!isFiltered) {
      await setCache(cacheKey, responseBody, DEFAULT_CACHE_TTL);
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

