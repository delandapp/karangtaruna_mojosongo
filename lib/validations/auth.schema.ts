import { z } from "zod";

export const registerSchema = z.object({
  nama_lengkap: z
    .string()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  username: z
    .string()
    .min(4, "Username minimal 4 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username hanya boleh terdiri dari huruf, angka, dan underscore (_)",
    ),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka",
    ),
  no_handphone: z
    .string()
    .min(10, "Nomor handphone minimal 10 digit")
    .max(15, "Nomor handphone maksimal 15 digit")
    .regex(/^[0-9]+$/, "Nomor handphone hanya boleh berisi angka"),
  rt: z.string().min(1, "RT harus diisi").max(5, "Format RT tidak valid"),
  rw: z.string().min(1, "RW harus diisi").max(5, "Format RW tidak valid"),
  alamat: z.string().optional(),
  jenis_kelamin: z
    .enum(["L", "P"], {
      message: "Jenis kelamin harus 'L' atau 'P'",
    })
    .optional(),
  m_jabatan_id: z.number().int().positive().optional(),
  m_level_id: z.number().int().positive().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username harus diisi"),
  password: z.string().min(1, "Password harus diisi"),
});
