/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Membuat fungsi debounced yang menunda pemanggilan `func` hingga setelah `delay` milidetik
 * berlalu sejak terakhir kali fungsi debounced dipanggil.
 *
 * @template T Tipe fungsi yang akan di-debounce.
 * @param {T} func Fungsi yang akan di-debounce.
 * @param {number} delay Jumlah milidetik untuk menunda.
 * @returns {(...args: Parameters<T>) => void} Fungsi debounced yang baru.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  // Fungsi yg dikembalikan tidak me-return value dari func asli

  // Tipe untuk ID timeout. NodeJS.Timeout umum di lingkungan Node/TS.
  // Gunakan 'number | null' jika hanya menargetkan browser.
  let timeoutId: NodeJS.Timeout | null = null;

  // Kembalikan fungsi debounced yang baru
  return (...args: Parameters<T>): void => {
    // Hapus timeout sebelumnya jika ada
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set timeout baru
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

// ──────────────────────────────────────────────────────────
// Helper: Normalisasi nomor handphone → awalan 08
// ──────────────────────────────────────────────────────────
export const normalizePhone = (val: string) => {
  const digits = val.replace(/\D/g, "");
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
};
