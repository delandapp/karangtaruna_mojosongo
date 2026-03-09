import { z } from "zod";

/**
 * Memecah string dengan koma menjadi array number.
 * Berguna untuk URL query params seperti ?m_jabatan_id=1,2,3
 * @param value String nilai filter (contoh: "1,2,3" atau "1")
 * @returns Array unik number, terurut (contoh: [1, 2, 3])
 */
export const parseNumberArray = (value?: string | null): number[] => {
  if (!value) return [];
  
  const parsed = value
    .split(",")
    .map((v) => parseInt(v.trim(), 10))
    .filter((v) => !isNaN(v));

  // Hapus duplikat dan urutkan agar konsisten untuk cache key
  return Array.from(new Set(parsed)).sort((a, b) => a - b);
};

/**
 * Zod schema helper untuk memvalidasi query params berbentuk comma-separated numbers
 * Contoh input: "1,2,3" -> Output: [1, 2, 3]
 */
export const zCommaSeparatedNumbers = z
  .string()
  .optional()
  .transform((val) => parseNumberArray(val));

/**
 * Filter Condition Builder untuk Prisma
 * Merubah array filter (jika ada) langsung menjadi clause prisma { in: [...] }
 * @param filterArray array angka, e.g [1, 2]
 * @returns object untuk di spread di mana, atau undefined jika kosong
 */
export const buildInFilter = (filterArray?: number[]) => {
  if (!filterArray || filterArray.length === 0) return undefined;
  if (filterArray.length === 1) return filterArray[0]; // Optimization for single value
  return { in: filterArray };
};

/**
 * Generate string parameter dari array angka untuk direkatkan ke Cache Key
 * @param filterArray 
 * @param emptyValue String jika array kosong (default "all")
 * @returns 
 */
export const buildCacheKeyPart = (filterArray?: number[], emptyValue: string = "all") => {
  if (!filterArray || filterArray.length === 0) return emptyValue;
  // Karena filterArray sudah di-sort ascending dan unique, di-join saja dijamin deterministik
  return filterArray.join(",");
};
