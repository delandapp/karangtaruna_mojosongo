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
