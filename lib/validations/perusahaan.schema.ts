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

// ==========================================
// MASTER: SKALA PERUSAHAAN
// ==========================================
export const createSkalaPerusahaanSchema = z.object({
    nama: z
        .string()
        .min(2, "Nama Skala Perusahaan minimal 2 karakter")
        .max(30, "Maksimal 30 karakter")
        .transform(capitalizeWords),
});

export const updateSkalaPerusahaanSchema = createSkalaPerusahaanSchema;

// ==========================================
// MASTER: SEKTOR INDUSTRI
// ==========================================
export const createSektorIndustriSchema = z.object({
    nama_sektor: z
        .string()
        .min(2, "Nama Sektor Industri minimal 2 karakter")
        .max(100, "Maksimal 100 karakter")
        .transform(capitalizeWords),
    deskripsi_sektor: z.string().optional(),
});

export const updateSektorIndustriSchema = createSektorIndustriSchema;

// ==========================================
// MASTER: PERUSAHAAN
// ==========================================
export const createPerusahaanSchema = z.object({
    m_sektor_industri_id: z.number().positive("Sektor Industri ID harus valid").optional().nullable(),
    m_skala_perusahaan_id: z.number().positive("Skala Perusahaan ID harus valid").optional().nullable(),
    
    kode_wilayah_induk_provinsi: z.string().optional().nullable(),
    kode_wilayah_induk_kota: z.string().optional().nullable(),
    kode_wilayah_induk_kecamatan: z.string().optional().nullable(),
    kode_wilayah_induk_kelurahan: z.string().optional().nullable(),

    nama: z
        .string()
        .min(2, "Nama Perusahaan minimal 2 karakter")
        .max(200, "Maksimal 200 karakter")
        .transform(capitalizeWords),

    nama_kontak: z.string().max(150, "Maksimal 150 karakter").optional().nullable(),
    jabatan_kontak: z.string().max(100, "Maksimal 100 karakter").optional().nullable(),
    no_handphone: z.string().max(20, "Maksimal 20 karakter").optional().nullable(),
    email: z
        .string()
        .email("Format email tidak valid")
        .max(150, "Maksimal 150 karakter")
        .optional()
        .nullable()
        .or(z.literal("")),
    website: z.string().max(255).optional().nullable().or(z.literal("")),
    instagram: z
        .string()
        .regex(/^@?(?:[\w\.]*\w)?$/, "Format username Instagram tidak valid (contoh: @username)")
        .max(100)
        .optional()
        .nullable()
        .or(z.literal("")),
    linkedin: z.string().url("Format URL LinkedIn tidak valid").max(255).optional().nullable().or(z.literal("")),
    whatsapp: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Nomor WhatsApp tidak valid. Gunakan format internasional tanpa spasi")
        .max(20)
        .optional()
        .nullable()
        .or(z.literal("")),

    alamat: z.string().optional().nullable(),
    sumber_informasi: z.string().max(255).optional().nullable(),
    catatan: z.string().optional().nullable(),
    logo_url: z.string().max(500).url("Format URL tidak valid").optional().nullable().or(z.literal("")),
});

export const updatePerusahaanSchema = createPerusahaanSchema;
