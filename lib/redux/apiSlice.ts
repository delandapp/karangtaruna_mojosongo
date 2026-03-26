import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithCustomHandler } from "./baseQuery";

/**
 * API slice inti yang akan menjadi dasar untuk semua feature slice lainnya.
 * Endpoint akan disuntikkan dari file terpisah.
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithCustomHandler,
  // Tag types digunakan untuk caching dan invalidasi data di seluruh aplikasi
  tagTypes: [
    "Level",
    "Jabatan",
    "User",
    "Brand",
    "KategoriBrand",
    "BidangBrand",
    "HakAkses",
    "Sponsor",
    "SponsorPipeline",
    "SponsorProposal",
    "Provinsi",
    "Kota",
    "Kecamatan",
    "Kelurahan",
  ],
  endpoints: () => ({}), // Endpoints awal sengaja dikosongkan
});
