import {
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { ApiErrorResponse } from "@/lib/types/api.types";
import { RootState } from "./store"; // Impor RootState dari store Anda

// Membuat instance fetchBaseQuery standar
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  /**
   * Fungsi prepareHeaders akan dipanggil sebelum setiap permintaan.
   * Ini adalah tempat yang tepat untuk menyisipkan token otentikasi.
   */ prepareHeaders: (headers, { getState }) => {
    // Ambil token dari state Redux 'auth'
    const token = (getState() as RootState).auth.token; // Jika token ada di state, tambahkan ke header Authorization

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

/**
 * Wrapper kustom di sekitar fetchBaseQuery yang tugas utamanya adalah
 * mencegat dan mencatat (log) error secara terpusat.
 */
export const baseQueryWithCustomHandler: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Melakukan permintaan API menggunakan baseQuery asli
  const result = await baseQuery(args, api, extraOptions); // Jika terjadi error, kita bisa mencatatnya di sini untuk debugging

  if (result.error) {
    console.error("RTK Query Error:", result.error.data as ApiErrorResponse);
    if (result.error.status === 401) {
      if (typeof window !== "undefined") {
        document.cookie = "token=; path=/; max-age=0";
        window.location.href = "/login";
      }
    }
  }

  return result;
};
