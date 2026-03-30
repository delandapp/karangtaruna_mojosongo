import { z } from "zod";

const slugRegex = /^[a-z0-9-]+$/;

// =============================================================================
// Berita
// =============================================================================

export const createBeritaSchema = z.object({
  judul:                z.string().min(5, "Judul minimal 5 karakter").max(300),
  sub_judul:            z.string().max(500).optional(),
  penulis:              z.string().min(2).max(150),
  editor:               z.string().max(150).optional(),
  konten_json:          z.record(z.unknown()),      // Tiptap / Editor.js JSON
  konten_html:          z.string().min(1),
  konten_plaintext:     z.string().min(1),
  m_kategori_berita_id: z.number().int().positive(),
  tag_ids:              z.array(z.number().int().positive()).default([]),
  is_featured:          z.boolean().default(false),
  is_breaking_news:     z.boolean().default(false),
  scheduled_at:         z.string().datetime().optional(),

  // SEO
  seo_title:            z.string().max(70).optional(),
  seo_description:      z.string().max(160).optional(),
  seo_slug:             z
    .string()
    .max(300)
    .regex(slugRegex, "seo_slug hanya boleh huruf kecil, angka, dan tanda hubung (-)"),
  seo_canonical_url:    z.string().url().optional(),
  seo_og_title:         z.string().max(200).optional(),
  seo_og_description:   z.string().max(300).optional(),
  seo_og_image_url:     z.string().url().optional(),
  seo_twitter_card:     z.enum(["summary", "summary_large_image"]).optional(),
  seo_keywords:         z.array(z.string()).default([]),
  seo_robots:           z.string().max(100).optional(),
  seo_schema_json:      z.record(z.unknown()).optional(), // JSON-LD structured data
});

export const updateBeritaSchema = createBeritaSchema.partial();

export const publishBeritaSchema = z.object({
  action:       z.enum(["PUBLISH", "ARCHIVE", "REJECT", "REVIEW", "DRAFT"]),
  scheduled_at: z.string().datetime().optional(), // hanya relevan untuk action PUBLISH + penjadwalan
  alasan:       z.string().optional(),            // hanya untuk action REJECT
});

export const beritaListQuerySchema = z.object({
  page:        z.coerce.number().int().positive().default(1),
  limit:       z.coerce.number().int().positive().max(100).default(20),
  search:      z.string().optional(),
  status:      z
    .enum(["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED", "REJECTED"])
    .optional(),
  kategori:    z.string().optional(),          // filter by kategori slug
  is_featured: z.coerce.boolean().optional(),
});

// =============================================================================
// Kategori Berita
// =============================================================================

export const createKategoriBeritaSchema = z.object({
  nama:      z.string().min(2).max(100),
  slug:      z.string().max(120).regex(slugRegex, "slug hanya huruf kecil, angka, tanda hubung"),
  deskripsi: z.string().optional(),
  warna_hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus #RRGGBB")
    .optional(),
  icon_url:  z.string().url().optional(),
  urutan:    z.number().int().min(0).default(0),
});

export const updateKategoriBeritaSchema = createKategoriBeritaSchema.partial();

// =============================================================================
// Tag Berita
// =============================================================================

export const createTagBeritaSchema = z.object({
  nama:      z.string().min(2).max(80),
  slug:      z.string().max(100).regex(slugRegex, "slug hanya huruf kecil, angka, tanda hubung"),
  deskripsi: z.string().optional(),
});

export const updateTagBeritaSchema = createTagBeritaSchema.partial();

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateBeritaInput        = z.infer<typeof createBeritaSchema>;
export type UpdateBeritaInput        = z.infer<typeof updateBeritaSchema>;
export type PublishBeritaInput       = z.infer<typeof publishBeritaSchema>;
export type BeritaListQuery          = z.infer<typeof beritaListQuerySchema>;
export type CreateKategoriBeritaInput = z.infer<typeof createKategoriBeritaSchema>;
export type CreateTagBeritaInput     = z.infer<typeof createTagBeritaSchema>;
