import { z } from "zod";

export const STATUS_RUNDOWN = ["belum", "berjalan", "selesai", "dilewati"] as const;

// Format "HH.MM" e.g. "09.00", "23.59"
const timeRegex = /^([01]\d|2[0-3])\.[0-5]\d$/;

export const createRundownSchema = z.object({
  pic_id: z.number().int().positive().optional().nullable(),
  hari_ke: z
    .number()
    .int("Hari ke harus bilangan bulat")
    .min(1, "Hari ke minimal 1"),
  urutan_no: z
    .number()
    .int("Urutan harus bilangan bulat")
    .min(1, "Urutan minimal 1"),
  waktu_mulai: z
    .string()
    .regex(timeRegex, "Format waktu tidak valid. Gunakan format HH.MM (contoh: 09.00)"),
  waktu_selesai: z
    .string()
    .regex(timeRegex, "Format waktu tidak valid. Gunakan format HH.MM (contoh: 10.00)"),
  nama_kegiatan: z
    .string()
    .min(3, "Nama kegiatan minimal 3 karakter")
    .max(200, "Nama kegiatan maksimal 200 karakter"),
  keterangan: z.string().max(2000).optional().nullable(),
  status: z
    .enum(STATUS_RUNDOWN, {
      error: `Status tidak valid. Pilihan: ${STATUS_RUNDOWN.join(", ")}`,
    })
    .default("belum"),
});

export const updateRundownSchema = createRundownSchema.partial();

export type CreateRundownInput = z.infer<typeof createRundownSchema>;
export type UpdateRundownInput = z.infer<typeof updateRundownSchema>;
