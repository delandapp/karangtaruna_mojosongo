/**
 * Membangun URL Query String dari objek parameter yang diberikan.
 * Secara otomatis menghapus parameter dengan nilai `undefined`, `null`, atau string kosong.
 * Jika parameter berupa Array, akan diubah menjadi string comma-separated (e.g. [1, 2] -> "1,2").
 * 
 * @param baseUrl URL dasar (misal: "/users")
 * @param params Objek parameter query yang akan diserialisasi
 * @returns String URL lengkap beserta query string-nya
 */
export const buildQueryParams = (
  baseUrl: string,
  params?: Record<string, any>
): string => {
  if (!params) return baseUrl;

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    // Abaikan falsy values (kecuali 0 atau boolean false jika di-support)
    if (value === undefined || value === null || value === "") return;

    // Jika nilai berupa Array, jadikan comma-separated string
    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.append(key, value.join(","));
      }
    } 
    // Tangani object spesial seperti "filter: { dropdown: true }"
    else if (typeof value === "object" && !Array.isArray(value)) {
      if (key === "filter" && value.dropdown) {
        searchParams.append("dropdown", "true");
      }
    } 
    // Sisanya primitive
    else {
      searchParams.append(key, String(value));
    }
  });

  const qs = searchParams.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
};
