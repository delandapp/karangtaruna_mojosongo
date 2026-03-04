import { z } from "zod";

export const createJabatanSchema = z.object({
  nama_jabatan: z
    .string()
    .min(3, "Nama jabatan minimal 3 karakter")
    .max(50, "Nama jabatan maksimal 50 karakter"),
  deskripsi_jabatan: z.string().optional(),
});

export const updateJabatanSchema = z.object({
  nama_jabatan: z
    .string()
    .min(3, "Nama jabatan minimal 3 karakter")
    .max(50, "Nama jabatan maksimal 50 karakter")
    .optional(),
  deskripsi_jabatan: z.string().optional(),
});
