import { z } from "zod";

export const STATUS_RAPAT = [
  "dijadwalkan",
  "berlangsung",
  "selesai",
  "dibatalkan",
] as const;

const agendaItemSchema = z.object({
  nomor: z.number().int().min(1),
  topik: z.string().min(1, "Topik tidak boleh kosong"),
  durasi_menit: z.number().int().min(1).optional(),
  pic: z.string().optional(),
});

const actionItemSchema = z.object({
  tugas: z.string().min(1, "Tugas tidak boleh kosong"),
  pic: z.string().optional(),
  deadline: z.coerce.date().optional(),
});

export const createRapatSchema = z.object({
  event_id: z.number().int().positive().optional().nullable(),
  judul: z
    .string()
    .min(3, "Judul rapat minimal 3 karakter")
    .max(200, "Judul rapat maksimal 200 karakter"),
  tanggal_rapat: z.coerce.date({
    error: "Tanggal rapat wajib diisi atau format tidak valid",
  }),
  lokasi: z.string().max(255).optional().nullable(),
  notulensi: z.string().max(10000).optional().nullable(),
  agenda: z.array(agendaItemSchema).optional().nullable(),
  action_items: z.array(actionItemSchema).optional().nullable(),
  status: z
    .enum(STATUS_RAPAT, {
      error: `Status tidak valid. Pilihan: ${STATUS_RAPAT.join(", ")}`,
    })
    .default("dijadwalkan"),
});

export const updateRapatSchema = createRapatSchema.partial();

export type CreateRapatInput = z.infer<typeof createRapatSchema>;
export type UpdateRapatInput = z.infer<typeof updateRapatSchema>;
