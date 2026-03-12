import { z } from "zod";
import { emailField, phoneField, urlField } from "./reusable.schema";

// ──────────────────────────────────────────────────────────
// Create Schema
// ──────────────────────────────────────────────────────────
export const createOrganisasiSchema = z.object({
  nama_org: z
    .string()
    .min(3, "Nama organisasi minimal 3 karakter")
    .max(200, "Nama organisasi maksimal 200 karakter"),
  kode_wilayah_induk_kelurahan: z
    .string()
    .min(2, "Kelurahan minimal 2 karakter")
    .max(100, "Kelurahan maksimal 100 karakter"),
  kode_wilayah_induk_kecamatan: z
    .string()
    .min(2, "Kecamatan minimal 2 karakter")
    .max(100, "Kecamatan maksimal 100 karakter"),
  kode_wilayah_induk_kota: z
    .string()
    .min(2, "Kota minimal 2 karakter")
    .max(100, "Kota maksimal 100 karakter"),
  kode_wilayah_induk_provinsi: z
    .string()
    .min(2, "Provinsi minimal 2 karakter")
    .max(100, "Provinsi maksimal 100 karakter"),
  no_handphone: phoneField,
  email: emailField,
  alamat: z
    .string()
    .max(500, "Alamat maksimal 500 karakter")
    .optional()
    .nullable(),
  logo_url: urlField,
  visi: z
    .string()
    .max(2000, "Visi maksimal 2000 karakter")
    .optional()
    .nullable(),
  misi: z
    .string()
    .max(2000, "Misi maksimal 2000 karakter")
    .optional()
    .nullable(),
  media_sosial: z
    .object({
      instagram: z.string().optional().nullable(),
      facebook: z.string().optional().nullable(),
      tiktok: z.string().optional().nullable(),
      youtube: z.string().optional().nullable(),
      whatsapp: phoneField,
    })
    .optional()
    .nullable(),
});

// ──────────────────────────────────────────────────────────
// Update Schema — semua field optional (PATCH-like behavior)
// ──────────────────────────────────────────────────────────
export const updateOrganisasiSchema = createOrganisasiSchema.partial();

export type CreateOrganisasiInput = z.infer<typeof createOrganisasiSchema>;
export type UpdateOrganisasiInput = z.infer<typeof updateOrganisasiSchema>;
