import { z } from "zod";

// ─── Konstanta ───────────────────────────────────────────────────────────────

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ─── Schema: Create Shortlink ────────────────────────────────────────────────

export const schemaCreateShortlink = z.object({
  judul: z
    .string()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  url_tujuan: z
    .string()
    .min(1, "URL tujuan wajib diisi")
    .url("Format URL tidak valid (harus diawali http:// atau https://)"),
  slug: z
    .string()
    .max(100, "Slug maksimal 100 karakter")
    .regex(SLUG_REGEX, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)")
    .optional()
    .or(z.literal("")),
  deskripsi: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
  is_aktif: z.boolean().optional().default(true),
  kedaluwarsa_pada: z
    .string()
    .datetime({ message: "Format tanggal kedaluwarsa tidak valid" })
    .optional()
    .or(z.literal("")),
});

// ─── Schema: Update Shortlink ────────────────────────────────────────────────

export const schemaUpdateShortlink = schemaCreateShortlink.partial();

// ─── Schema: Filter Shortlink (Query Params) ────────────────────────────────

export const schemaFilterShortlink = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  is_aktif: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type FormCreateShortlink = z.infer<typeof schemaCreateShortlink>;
export type FormUpdateShortlink = z.infer<typeof schemaUpdateShortlink>;
export type FilterShortlink = z.infer<typeof schemaFilterShortlink>;
