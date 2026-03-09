import { z } from "zod";

export const PRIORITAS_TUGAS = ["rendah", "sedang", "tinggi", "kritis"] as const;

export const STATUS_TUGAS = [
  "belum_mulai",
  "sedang_berjalan",
  "selesai",
  "terlambat",
  "dibatalkan",
] as const;

export const createTugasSchema = z.object({
  ditugaskan_ke_id: z.number().int().positive().optional().nullable(),
  parent_tugas_id: z.number().int().positive().optional().nullable(),
  nama_tugas: z
    .string()
    .min(3, "Nama tugas minimal 3 karakter")
    .max(200, "Nama tugas maksimal 200 karakter"),
  deskripsi: z.string().max(5000).optional().nullable(),
  prioritas: z
    .enum(PRIORITAS_TUGAS, {
      error: `Prioritas tidak valid. Pilihan: ${PRIORITAS_TUGAS.join(", ")}`,
    })
    .default("sedang"),
  status: z
    .enum(STATUS_TUGAS, {
      error: `Status tidak valid. Pilihan: ${STATUS_TUGAS.join(", ")}`,
    })
    .default("belum_mulai"),
  batas_waktu: z.coerce.date().optional().nullable(),
  selesai_pada: z.coerce.date().optional().nullable(),
});

export const updateTugasSchema = createTugasSchema.partial();

export type CreateTugasInput = z.infer<typeof createTugasSchema>;
export type UpdateTugasInput = z.infer<typeof updateTugasSchema>;
