import { z } from "zod";

export const STATUS_NOTULEN = [
  "DRAFT",
  "REVIEW",
  "DISETUJUI",
  "FINAL",
  "DITOLAK",
] as const;

export const STATUS_TINDAK_LANJUT = [
  "BELUM_MULAI",
  "DALAM_PROSES",
  "SELESAI",
  "TERLAMBAT",
  "DIBATALKAN",
] as const;

const poinBahasanSchema = z.object({
  c_agenda_rapat_id: z.number().int().positive().optional().nullable(),
  urutan: z.number().int().min(1),
  isi_bahasan: z.string().min(1, "Isi bahasan tidak boleh kosong"),
  pembicara: z.string().optional().nullable(),
});

const keputusanRapatSchema = z.object({
  urutan: z.number().int().min(1),
  isi_keputusan: z.string().min(1, "Isi keputusan tidak boleh kosong"),
  dasar_keputusan: z.string().optional().nullable(),
  is_konsensus: z.boolean().default(true),
});

const tindakLanjutSchema = z.object({
  m_user_id_pic: z.number().int().positive().optional().nullable(),
  judul: z.string().min(3, "Judul tindak lanjut minimal 3 karakter"),
  deskripsi: z.string().optional().nullable(),
  deadline: z.coerce.date().optional().nullable(),
  prioritas: z.enum(["TINGGI", "SEDANG", "RENDAH"]).default("SEDANG"),
  status: z.enum(STATUS_TINDAK_LANJUT).default("BELUM_MULAI"),
});

export const createNotulenSchema = z.object({
  m_rapat_id: z.number().int().positive(),
  nomor_notulen: z.string().optional().nullable(),
  status: z.enum(STATUS_NOTULEN).default("DRAFT"),
  pembukaan: z.string().optional().nullable(),
  penutupan: z.string().optional().nullable(),
  kesimpulan_umum: z.string().optional().nullable(),
  poin_bahasan: z.array(poinBahasanSchema).optional().nullable(),
  keputusan: z.array(keputusanRapatSchema).optional().nullable(),
  tindak_lanjut: z.array(tindakLanjutSchema).optional().nullable(),
});

export const updateNotulenSchema = createNotulenSchema.partial();

export const updateTindakLanjutProgresSchema = z.object({
  keterangan: z.string().min(5, "Keterangan minimal 5 karakter"),
  progres_persen: z.number().int().min(0).max(100),
  status_baru: z.enum(STATUS_TINDAK_LANJUT),
});

export const createKomentarNotulenSchema = z.object({
  parent_id: z.number().int().positive().optional().nullable(),
  isi_komentar: z.string().min(1, "Isi komentar tidak boleh kosong"),
});
