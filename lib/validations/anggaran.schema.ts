import { z } from "zod";

export const createAnggaranSchema = z.object({
  skenario: z.string().optional().default("moderat"),
  versi: z.number().int().optional().default(1),
  total_pemasukan_rencana: z.number().min(0).optional().default(0),
  total_pengeluaran_rencana: z.number().min(0).optional().default(0),
  total_pemasukan_realisasi: z.number().min(0).optional(),
  total_pengeluaran_realisasi: z.number().min(0).optional(),
  persen_cadangan: z.number().min(0).max(100).optional().default(10),
  status: z.string().optional().default("draft"),
  catatan: z.string().optional().nullable(),
});

export const updateAnggaranSchema = z.object({
  skenario: z.string().optional(),
  versi: z.number().int().optional(),
  total_pemasukan_rencana: z.number().min(0).optional(),
  total_pengeluaran_rencana: z.number().min(0).optional(),
  total_pemasukan_realisasi: z.number().min(0).optional().nullable(),
  total_pengeluaran_realisasi: z.number().min(0).optional().nullable(),
  persen_cadangan: z.number().min(0).max(100).optional(),
  status: z.string().optional(),
  catatan: z.string().optional().nullable(),
});
