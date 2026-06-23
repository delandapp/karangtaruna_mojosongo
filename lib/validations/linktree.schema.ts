import { z } from "zod";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const schemaCreateLinktree = z.object({
  judul: z
    .string()
    .min(1, "Judul profil wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  bio: z
    .string()
    .max(300, "Bio maksimal 300 karakter")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  slug: z
    .string()
    .min(1, "Slug wajib diisi")
    .max(100, "Slug maksimal 100 karakter")
    .regex(SLUG_REGEX, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)"),
  tema: z
    .string()
    .default("minimal-light"),
  foto_profil_url: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  warna_primer: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  warna_latar: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna latar tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  font_kustom: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  bg_image_url: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  
  // Custom button styling
  gaya_tombol: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  animasi_tombol: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  warna_tombol_latar: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna latar tombol tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  warna_tombol_teks: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna teks tombol tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  warna_tombol_border: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna border tombol tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  border_radius_tombol: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),

  // Social media footer
  sosmed_instagram: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  sosmed_tiktok: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  sosmed_whatsapp: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  sosmed_facebook: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  sosmed_youtube: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  sosmed_github: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  sosmed_email: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  sosmed_telepon: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),

  // SEO & meta
  meta_judul: z
    .string()
    .max(60, "Meta judul maksimal 60 karakter")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  meta_deskripsi: z
    .string()
    .max(160, "Meta deskripsi maksimal 160 karakter")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  aktif: z
    .boolean()
    .default(true),
});

export const schemaUpdateLinktree = schemaCreateLinktree.partial();

export const schemaTambahLinkLinktree = z.object({
  judul: z
    .string()
    .min(1, "Judul link wajib diisi")
    .max(200, "Judul link maksimal 200 karakter"),
  url: z
    .string()
    .min(1, "URL tujuan wajib diisi")
    .url("Format URL tidak valid (harus diawali http:// atau https://)"),
  ikon: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  warna_ikon: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  aktif: z
    .boolean()
    .default(true),
  
  // Override kustomisasi per link
  warna_latar: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna latar tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  warna_teks: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna teks tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  warna_border: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna border tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  animasi: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
});

export const schemaUpdateLinkLinktree = schemaTambahLinkLinktree.partial();

export type FormCreateLinktree = z.infer<typeof schemaCreateLinktree>;
export type FormUpdateLinktree = z.infer<typeof schemaUpdateLinktree>;
export type FormTambahLinkLinktree = z.infer<typeof schemaTambahLinkLinktree>;
export type FormUpdateLinkLinktree = z.infer<typeof schemaUpdateLinkLinktree>;
