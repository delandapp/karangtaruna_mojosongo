import { z } from "zod";

// ─── Konstanta ───────────────────────────────────────────────────────────────

export const STATUS_AKUN = [
  "terhubung",
  "terputus",
  "expired",
] as const;

export const STATUS_KONTEN = [
  "draft",
  "scheduled",
  "published",
  "failed",
] as const;

export const TIPE_KONTEN = [
  "post",
  "story",
  "reels",
  "tweet",
] as const;

export const STATUS_CHAT = [
  "baru",
  "dijawab",
  "diarsipkan",
] as const;

export const STATUS_JOB = [
  "pending",
  "running",
  "done",
  "failed",
] as const;

export const TIPE_MEDIA = [
  "image",
  "video",
  "document",
] as const;

export const PERIODE_ANALITIK = [
  "7d",
  "30d",
  "custom",
] as const;

// ─── Schema: Hubungkan Akun ──────────────────────────────────────────────────

export const schemaHubungkanAkun = z.object({
  platform_id: z.number({
    required_error: "Platform wajib dipilih",
  }).int().positive(),
  nama_akun: z
    .string()
    .min(1, "Nama akun wajib diisi")
    .max(100, "Nama akun maksimal 100 karakter"),
  username: z
    .string()
    .min(1, "Username wajib diisi")
    .max(100, "Username maksimal 100 karakter"),
  access_token: z
    .string()
    .min(1, "Access token wajib diisi"),
  refresh_token: z.string().optional().or(z.literal("")),
  token_expires_at: z.string().datetime().optional().or(z.literal("")),
});

// ─── Schema: Perbarui Token ──────────────────────────────────────────────────

export const schemaPerbaruiToken = z.object({
  access_token: z
    .string()
    .min(1, "Access token baru wajib diisi"),
  refresh_token: z.string().optional().or(z.literal("")),
  token_expires_at: z.string().datetime().optional().or(z.literal("")),
});

// ─── Schema: Buat Konten ─────────────────────────────────────────────────────

export const schemaBuatKonten = z.object({
  akun_id: z.number({
    required_error: "Akun wajib dipilih",
  }).int().positive(),
  tipe_konten: z.enum(TIPE_KONTEN, {
    required_error: "Tipe konten wajib dipilih",
  }),
  caption: z
    .string()
    .min(1, "Caption wajib diisi")
    .max(2200, "Caption maksimal 2200 karakter"),
  platform_ids: z
    .array(z.number().int().positive())
    .min(1, "Pilih minimal satu platform"),
  jadwal: z.string().datetime().optional().or(z.literal("")),
  media_urls: z
    .array(z.string().url("Format URL media tidak valid"))
    .optional(),
});

// ─── Schema: Update Konten ───────────────────────────────────────────────────

export const schemaUpdateKonten = schemaBuatKonten.partial();

// ─── Schema: Balas Chat ──────────────────────────────────────────────────────

export const schemaBalasChat = z.object({
  chat_id: z.number({
    required_error: "Chat ID wajib ada",
  }).int().positive(),
  isi_balasan: z
    .string()
    .min(1, "Balasan tidak boleh kosong")
    .max(1000, "Balasan maksimal 1000 karakter"),
});

// ─── Schema: Filter Konten (Query Params) ────────────────────────────────────

export const schemaFilterKonten = z.object({
  akun_id: z.coerce.number().int().positive().optional(),
  platform_id: z.coerce.number().int().positive().optional(),
  status: z.enum(STATUS_KONTEN).optional(),
  tipe_konten: z.enum(TIPE_KONTEN).optional(),
  search: z.string().optional(),
});

// ─── Schema: Filter Chat (Query Params) ──────────────────────────────────────

export const schemaFilterChat = z.object({
  akun_id: z.coerce.number().int().positive().optional(),
  platform_id: z.coerce.number().int().positive().optional(),
  status: z.enum(STATUS_CHAT).optional(),
  search: z.string().optional(),
});

// ─── Schema: Filter Analitik (Query Params) ──────────────────────────────────

export const schemaFilterAnalitik = z.object({
  akun_id: z.coerce.number().int().positive().optional(),
  platform_id: z.coerce.number().int().positive().optional(),
  periode: z.enum(PERIODE_ANALITIK).optional().default("30d"),
  tanggal_mulai: z.string().datetime().optional(),
  tanggal_selesai: z.string().datetime().optional(),
});

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type FormHubungkanAkun = z.infer<typeof schemaHubungkanAkun>;
export type FormPerbaruiToken = z.infer<typeof schemaPerbaruiToken>;
export type FormBuatKonten = z.infer<typeof schemaBuatKonten>;
export type FormUpdateKonten = z.infer<typeof schemaUpdateKonten>;
export type FormBalasChat = z.infer<typeof schemaBalasChat>;
export type FilterKonten = z.infer<typeof schemaFilterKonten>;
export type FilterChat = z.infer<typeof schemaFilterChat>;
export type FilterAnalitik = z.infer<typeof schemaFilterAnalitik>;
