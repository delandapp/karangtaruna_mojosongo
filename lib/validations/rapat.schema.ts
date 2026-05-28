import { z } from "zod";

export const STATUS_RAPAT = [
  "TERJADWAL",
  "BERLANGSUNG",
  "SELESAI",
  "DIBATALKAN",
  "DITUNDA",
] as const;

export const JENIS_RAPAT = [
  "INTERNAL",
  "EKSTERNAL",
  "KOORDINASI",
  "EVALUASI",
  "DARURAT",
  "LAINNYA",
] as const;

export const STATUS_KEHADIRAN = [
  "DIUNDANG",
  "HADIR",
  "TIDAK_HADIR",
  "IZIN",
  "TERLAMBAT",
] as const;

const agendaItemSchema = z.object({
  urutan: z.number().int().min(1),
  judul_agenda: z.string().min(1, "Judul agenda tidak boleh kosong"),
  deskripsi: z.string().optional().nullable(),
  durasi_menit: z.number().int().min(1).optional().nullable(),
  m_user_id: z.number().int().positive().optional().nullable(),
});

const pesertaRapatSchema = z.object({
  m_user_id: z.number().int().positive().optional().nullable(),
  nama_peserta: z.string().min(1, "Nama peserta tidak boleh kosong"),
  jabatan_peserta: z.string().optional().nullable(),
  instansi: z.string().optional().nullable(),
  email: z.string().email().or(z.literal("")).optional().nullable(),
  no_handphone: z.string().optional().nullable(),
  status_kehadiran: z.enum(STATUS_KEHADIRAN).default("DIUNDANG"),
  is_moderator: z.boolean().default(false),
  is_notulis: z.boolean().default(false),
});

export const createRapatSchema = z.object({
  m_kategori_rapat_id: z.number().int().positive().optional().nullable(),
  event_id: z.number().int().positive().optional().nullable(),
  judul_rapat: z
    .string()
    .min(3, "Judul rapat minimal 3 karakter")
    .max(200, "Judul rapat maksimal 200 karakter"),
  jenis_rapat: z.enum(JENIS_RAPAT).default("INTERNAL"),
  status_rapat: z.enum(STATUS_RAPAT).default("TERJADWAL"),
  deskripsi: z.string().optional().nullable(),
  tanggal_mulai: z.coerce.date({
    error: "Tanggal mulai rapat wajib diisi atau format tidak valid",
  }),
  tanggal_selesai: z.coerce.date().optional().nullable(),
  lokasi: z.string().max(255).optional().nullable(),
  link_online: z.string().url().or(z.literal("")).optional().nullable(),
  is_online: z.boolean().default(false),
  nomor_rapat: z.string().optional().nullable(),
  is_recurring: z.boolean().default(false),
  agendas: z.array(agendaItemSchema).optional().nullable(),
  peserta: z.array(pesertaRapatSchema).optional().nullable(),
});

export const updateRapatSchema = createRapatSchema.partial();

export type CreateRapatInput = z.infer<typeof createRapatSchema>;
export type UpdateRapatInput = z.infer<typeof updateRapatSchema>;
