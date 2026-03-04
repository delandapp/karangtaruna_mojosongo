import { z } from "zod";

export const createLevelSchema = z.object({
  nama_level: z
    .string()
    .min(3, "Nama level minimal 3 karakter")
    .max(50, "Nama level maksimal 50 karakter"),
});

export const updateLevelSchema = z.object({
  nama_level: z
    .string()
    .min(3, "Nama level minimal 3 karakter")
    .max(50, "Nama level maksimal 50 karakter"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});
