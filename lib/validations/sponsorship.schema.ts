import { z } from "zod";

// Helper function to capitalize the first letter of each word
const capitalizeWords = (val: string) => {
    if (!val) return val;
    return val
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

// Validations for Kategori Brand
export const createKategoriBrandSchema = z.object({
    nama_kategori: z
        .string()
        .min(2, "Nama Kategori minimal 2 karakter")
        .transform(capitalizeWords),
    deskripsi_kategori: z.string().optional(),
});

// Validations for Bidang Brand
export const createBidangBrandSchema = z.object({
    nama_bidang: z
        .string()
        .min(2, "Nama Bidang minimal 2 karakter")
        .transform(capitalizeWords),
    deskripsi_bidang: z.string().optional(),
});

// Validations for Brand
export const createBrandSchema = z.object({
    nama_brand: z
        .string()
        .min(2, "Nama Brand minimal 2 karakter")
        .transform(capitalizeWords),
    m_bidang_brand_id: z.number().positive("Bidang Brand ID harus valid").optional(),
    m_kategori_brand_id: z.number().positive("Kategori Brand ID harus valid").optional(),

    // ketat konsisten nomor whatsapp
    whatsapp_brand: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Nomor WhatsApp tidak valid. Gunakan format internasional tanpa spasi")
        .optional()
        .or(z.literal("")),

    email_brand: z
        .string()
        .email("Format email tidak valid")
        .optional()
        .or(z.literal("")),

    linkend_brand: z
        .string()
        .url("Format URL LinkedIn tidak valid")
        .optional()
        .or(z.literal("")),

    instagram_brand: z
        .string()
        .regex(/^@?(?:[\w\.]*\w)?$/, "Format username Instagram tidak valid (contoh: @username)")
        .optional()
        .or(z.literal("")),

    presentase_keberhasilan: z
        .number()
        .min(0, "Minimal 0%")
        .max(100, "Maksimal 100%")
        .optional(),

    perusahaan_induk: z
        .string()
        .transform(capitalizeWords)
        .optional(),
});

// ==========================================
// MASTER SPONSOR (m_sponsor)
// ==========================================
export const sponsorSchema = z.object({
  m_perusahaan_id: z.number().optional().nullable(),
  m_brand_id: z.number().optional().nullable(),
  m_kategori_sponsor_id: z.number().optional().nullable(),
  total_disponsori: z.number().optional().nullable(),
}).refine(data => data.m_perusahaan_id || data.m_brand_id, {
  message: "Pilih salah satu: Perusahaan atau Brand",
  path: ["m_perusahaan_id"]
}).refine(data => !(data.m_perusahaan_id && data.m_brand_id), {
  message: "Tidak boleh memilih Keduanya. Pilih Perusahaan atau Brand",
  path: ["m_perusahaan_id"]
});

export type SponsorValues = z.infer<typeof sponsorSchema>;

// ==========================================
// EVENT SPONSOR (Pipeline)
// ==========================================
export const StatusPipelineEnum = z.enum(["prospek", "dihubungi", "negosiasi", "dikonfirmasi", "lunas", "selesai", "batal"]);

export const TierSponsorEnum = z.enum(["platinum", "gold", "silver", "bronze", "inkind"]);

export const JenisKontribusiEnum = z.enum(["uang", "barang", "jasa", "campuran"]);

export const eventSponsorSchema = z.object({
  event_id: z.number(),
  m_sponsor_id: z.number().optional().nullable(),
  m_perusahaan_id: z.number().optional().nullable(),
  m_brand_id: z.number().optional().nullable(),
  ditangani_oleh_id: z.number().optional().nullable(),
  tier: TierSponsorEnum,
  jenis_kontribusi: JenisKontribusiEnum,
  status_pipeline: StatusPipelineEnum.default("prospek"),
  jumlah_disepakati: z.number().min(0).optional().nullable(),
  jumlah_diterima: z.number().min(0).optional().nullable(),
  deskripsi_inkind: z.string().optional().nullable(),
  benefit_disepakati: z.array(z.string()).optional().nullable(),
  benefit_terealisasi: z.array(z.string()).optional().nullable(),
  url_mou: z.string().url("Format URL tidak valid").optional().nullable(),
  keterangan: z.string().optional().nullable(),
}).refine(data => data.m_perusahaan_id || data.m_brand_id || data.m_sponsor_id, {
  message: "Pilih salah satu: Perusahaan, Brand, atau Sponsor ID",
  path: ["m_perusahaan_id"]
});

export type EventSponsorValues = z.infer<typeof eventSponsorSchema>;

// ==========================================
// PROPOSAL SPONSOR
// ==========================================
export const TierProposalEnum = z.enum(["platinum", "gold", "silver", "bronze"]);

export const ResponsProposalEnum = z.enum(["diterima", "ditolak", "negosiasi", "menunggu"]);

export const proposalSponsorSchema = z.object({
  event_id: z.number(),
  m_sponsor_id: z.number(),
  dikirim_oleh_id: z.number(),
  tier_diusulkan: TierProposalEnum,
  respons: ResponsProposalEnum.optional().nullable(),
  url_file_proposal: z.string().url("Format URL tidak valid").optional().nullable(),
  catatan: z.string().optional().nullable(),
});

export type ProposalSponsorValues = z.infer<typeof proposalSponsorSchema>;

// ==========================================
// PORTAL SPONSOR LOGIN
// ==========================================
export const portalSponsorLoginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type PortalSponsorLoginValues = z.infer<typeof portalSponsorLoginSchema>;
