import { z } from "zod";

export const DIVISI_PANITIA = [
  "acara",
  "logistik",
  "humas",
  "konsumsi",
  "keamanan",
  "dokumentasi",
  "dekorasi",
  "transportasi",
  "lainnya",
] as const;

export const POSISI_PANITIA = ["Koordinator", "Anggota"] as const;

export const createPanitiaSchema = z.object({
  user_id: z
    .number()
    .int("ID User harus bilangan bulat")
    .positive("ID User harus lebih dari 0"),
  m_jabatan_id: z.number().int().positive().optional().nullable(),
  divisi: z.enum(DIVISI_PANITIA, {
    error: `Divisi tidak valid. Pilihan: ${DIVISI_PANITIA.join(", ")}`,
  }),
  posisi: z.enum(POSISI_PANITIA, {
    error: "Posisi harus 'Koordinator' atau 'Anggota'",
  }),
  deskripsi_tugas: z
    .string()
    .max(2000, "Deskripsi tugas maksimal 2000 karakter")
    .optional()
    .nullable(),
  is_aktif: z.boolean().default(true),
});

export const updatePanitiaSchema = z.object({
  m_jabatan_id: z.number().int().positive().optional().nullable(),
  divisi: z
    .enum(DIVISI_PANITIA, {
      error: `Divisi tidak valid. Pilihan: ${DIVISI_PANITIA.join(", ")}`,
    })
    .optional(),
  posisi: z
    .enum(POSISI_PANITIA, {
      error: "Posisi harus 'Koordinator' atau 'Anggota'",
    })
    .optional(),
  deskripsi_tugas: z.string().max(2000).optional().nullable(),
  is_aktif: z.boolean().optional(),
});

export type CreatePanitiaInput = z.infer<typeof createPanitiaSchema>;
export type UpdatePanitiaInput = z.infer<typeof updatePanitiaSchema>;
