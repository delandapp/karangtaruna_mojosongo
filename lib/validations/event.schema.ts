import { z } from "zod";

// ──────────────────────────────────────────────────────────
// Enum constants (mirrors schema.prisma comments)
// ──────────────────────────────────────────────────────────
export const JENIS_EVENT = [
  "festival",
  "lomba",
  "seminar",
  "bakti_sosial",
  "olahraga",
  "seni_budaya",
  "pelatihan",
  "lainnya",
] as const;

export const STATUS_EVENT = [
  "perencanaan",
  "persiapan",
  "siap",
  "berlangsung",
  "selesai",
  "dibatalkan",
] as const;

// ──────────────────────────────────────────────────────────
// Create Schema
// ──────────────────────────────────────────────────────────
export const createEventSchema = z
  .object({
    m_organisasi_id: z
      .number()
      .int("ID Organisasi harus bilangan bulat")
      .positive("ID Organisasi harus lebih dari 0"),

    nama_event: z
      .string()
      .min(3, "Nama event minimal 3 karakter")
      .max(200, "Nama event maksimal 200 karakter"),

    tema_event: z
      .string()
      .max(200, "Tema event maksimal 200 karakter")
      .optional()
      .nullable(),

    deskripsi: z
      .string()
      .max(5000, "Deskripsi maksimal 5000 karakter")
      .optional()
      .nullable(),

    jenis_event: z.enum(JENIS_EVENT, {
      error: `Jenis event tidak valid. Pilihan: ${JENIS_EVENT.join(", ")}`,
    }),

    status_event: z
      .enum(STATUS_EVENT, {
        error: `Status event tidak valid. Pilihan: ${STATUS_EVENT.join(", ")}`,
      })
      .default("perencanaan"),

    tanggal_mulai: z.coerce.date({
      error: "Tanggal mulai wajib diisi atau format tidak valid",
    }),

    tanggal_selesai: z.coerce.date({
      error: "Tanggal selesai wajib diisi atau format tidak valid",
    }),

    lokasi: z
      .string()
      .max(255, "Lokasi maksimal 255 karakter")
      .optional()
      .nullable(),

    target_peserta: z
      .number()
      .int("Target peserta harus bilangan bulat")
      .min(1, "Target peserta minimal 1")
      .optional()
      .nullable(),

    realisasi_peserta: z
      .number()
      .int("Realisasi peserta harus bilangan bulat")
      .min(0, "Realisasi peserta tidak boleh negatif")
      .optional()
      .nullable(),

    banner_url: z
      .string()
      .url("Format URL banner tidak valid")
      .max(255, "URL banner maksimal 255 karakter")
      .optional()
      .nullable(),

    tujuan: z
      .array(z.string().min(1, "Tujuan tidak boleh kosong"))
      .optional()
      .nullable(),
  })
  .refine((data) => data.tanggal_selesai >= data.tanggal_mulai, {
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
    path: ["tanggal_selesai"],
  });

// ──────────────────────────────────────────────────────────
// Update Schema — semua field optional, tetap validasi cross-field
// ──────────────────────────────────────────────────────────
export const updateEventSchema = z
  .object({
    m_organisasi_id: z
      .number()
      .int("ID Organisasi harus bilangan bulat")
      .positive("ID Organisasi harus lebih dari 0")
      .optional(),

    nama_event: z
      .string()
      .min(3, "Nama event minimal 3 karakter")
      .max(200, "Nama event maksimal 200 karakter")
      .optional(),

    tema_event: z.string().max(200).optional().nullable(),
    deskripsi: z.string().max(5000).optional().nullable(),

    jenis_event: z
      .enum(JENIS_EVENT, {
        error: `Jenis event tidak valid. Pilihan: ${JENIS_EVENT.join(", ")}`,
      })
      .optional(),

    status_event: z
      .enum(STATUS_EVENT, {
        error: `Status event tidak valid. Pilihan: ${STATUS_EVENT.join(", ")}`,
      })
      .optional(),

    tanggal_mulai: z.coerce.date().optional(),
    tanggal_selesai: z.coerce.date().optional(),

    lokasi: z.string().max(255).optional().nullable(),
    target_peserta: z.number().int().min(1).optional().nullable(),
    realisasi_peserta: z.number().int().min(0).optional().nullable(),
    banner_url: z.string().url("Format URL banner tidak valid").max(255).optional().nullable(),
    tujuan: z.array(z.string().min(1)).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.tanggal_mulai && data.tanggal_selesai) {
        return data.tanggal_selesai >= data.tanggal_mulai;
      }
      return true;
    },
    {
      message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
      path: ["tanggal_selesai"],
    }
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
