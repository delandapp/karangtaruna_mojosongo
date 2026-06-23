import { z } from "zod";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const schemaCreateQrCode = z.object({
  judul: z
    .string()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  konten: z
    .string()
    .min(1, "Konten QR Code wajib diisi"),
  tipe_konten: z
    .enum(["url", "teks", "email", "telepon", "wifi", "vcard"]),
  warna_depan: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna depan tidak valid (harus hex color)")
    .default("#000000"),
  warna_belakang: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna belakang tidak valid (harus hex color)")
    .default("#FFFFFF"),
  gaya_titik: z
    .enum(["square", "rounded", "dots", "classy", "classy-rounded", "extra-rounded"])
    .default("square"),
  gaya_sudut_luar: z
    .enum(["square", "extra-rounded", "dot"])
    .default("square"),
  gaya_sudut_dalam: z
    .enum(["square", "dot"])
    .default("square"),
  warna_sudut_luar: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna sudut luar tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  warna_sudut_dalam: z
    .string()
    .regex(HEX_COLOR_REGEX, "Format warna sudut dalam tidak valid")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  logo_url: z
    .string()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  logo_ukuran: z
    .coerce.number()
    .min(5, "Ukuran logo minimal 5%")
    .max(35, "Ukuran logo maksimal 35%")
    .default(20),
  logo_margin: z
    .coerce.number()
    .min(0, "Margin logo minimal 0px")
    .max(20, "Margin logo maksimal 20px")
    .default(5),
  logo_hapus_bg: z
    .boolean()
    .default(true),
  ukuran: z
    .coerce.number()
    .min(100, "Ukuran minimal 100px")
    .max(2000, "Ukuran maksimal 2000px")
    .default(300),
  margin: z
    .coerce.number()
    .min(0, "Margin minimal 0")
    .max(50, "Margin maksimal 50")
    .default(10),
  level_koreksi: z
    .enum(["L", "M", "Q", "H"])
    .default("M"),
});

export const schemaUpdateQrCode = schemaCreateQrCode.partial();

export type FormCreateQrCode = z.infer<typeof schemaCreateQrCode>;
export type FormUpdateQrCode = z.infer<typeof schemaUpdateQrCode>;
