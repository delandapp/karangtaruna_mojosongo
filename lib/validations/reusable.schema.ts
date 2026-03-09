import { normalizePhone } from "@/utils/helpers/helper";
import { z } from "zod";

// ──────────────────────────────────────────────────────────
// Reusable field validators
// ──────────────────────────────────────────────────────────
const phoneFieldBase = z
  .string()
  .min(10, "Nomor handphone minimal 10 digit")
  .max(15, "Nomor handphone maksimal 15 digit")
  .regex(/^[0-9+]+$/, "Nomor handphone hanya boleh berisi angka")
  .transform(normalizePhone)
  .refine(
    (val) => /^08[0-9]{8,12}$/.test(val),
    "Nomor handphone harus diawali 08 dan terdiri dari 10–15 digit",
  );

const phoneField = z.union([
  phoneFieldBase,
  z.literal(""),
  z.literal(null),
  z.undefined()
]).transform(val => val === "" ? null : val);

const emailFieldBase = z
  .string()
  .email("Format email tidak valid")
  .max(100, "Email maksimal 100 karakter")
  .toLowerCase();

const emailField = z.union([
  emailFieldBase,
  z.literal(""),
  z.literal(null),
  z.undefined()
]).transform(val => val === "" ? null : val);

const urlFieldBase = z
  .string()
  .url("Format URL tidak valid")
  .max(2000, "URL maksimal 2000 karakter");

const urlField = z.union([
  urlFieldBase,
  z.literal(""),
  z.literal(null),
  z.undefined()
]).transform(val => val === "" ? null : val);

export { phoneField, emailField, urlField };
