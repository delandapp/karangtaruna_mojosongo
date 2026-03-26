import * as z from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export const wilayahQuerySchema = paginationSchema.extend({
  dropdown: z.boolean().or(z.string().transform((val) => val === "true")).optional(),
  m_provinsi_id: z.coerce.number().optional(),
  m_kota_id: z.coerce.number().optional(),
  m_kecamatan_id: z.coerce.number().optional(),
});

// PROVINSI
export const provinsiSchema = z.object({
  kode_wilayah: z.string().min(1, "Kode Wilayah wajib diisi").max(50),
  nama: z.string().min(1, "Nama Provinsi wajib diisi").max(100),
});

// KOTA
export const kotaSchema = z.object({
  kode_wilayah: z.string().min(1, "Kode Wilayah wajib diisi").max(50),
  nama: z.string().min(1, "Nama Kota wajib diisi").max(100),
  m_provinsi_id: z.coerce.number().positive("Provinsi wajib dipilih"),
});

// KECAMATAN
export const kecamatanSchema = z.object({
  kode_wilayah: z.string().min(1, "Kode Wilayah wajib diisi").max(50),
  nama: z.string().min(1, "Nama Kecamatan wajib diisi").max(100),
  m_kota_id: z.coerce.number().positive("Kota wajib dipilih"),
});

// KELURAHAN
export const kelurahanSchema = z.object({
  kode_wilayah: z.string().min(1, "Kode Wilayah wajib diisi").max(50),
  nama: z.string().min(1, "Nama Kelurahan wajib diisi").max(100),
  m_kecamatan_id: z.coerce.number().positive("Kecamatan wajib dipilih"),
});
