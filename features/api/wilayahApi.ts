import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Wilayah {
  id: number;
  kode_wilayah: string;
  nama: string;
}

export interface WilayahResponse {
  success: boolean;
  data: Wilayah[];
}

export const wilayahApi = createApi({
  reducerPath: "wilayahApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/wilayah",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getProvinsi: builder.query<WilayahResponse, void>({
      query: () => "/provinsi",
    }),
    getKota: builder.query<WilayahResponse, string | void>({
      query: (provinsiKode) => {
        if (!provinsiKode) return "/kota";
        return `/kota?provinsi_kode=${provinsiKode}`;
      },
    }),
    getKecamatan: builder.query<WilayahResponse, string | void>({
      query: (kotaKode) => {
        if (!kotaKode) return "/kecamatan";
        return `/kecamatan?kota_kode=${kotaKode}`;
      },
    }),
    getKelurahan: builder.query<WilayahResponse, string | void>({
      query: (kecamatanKode) => {
        if (!kecamatanKode) return "/kelurahan";
        return `/kelurahan?kecamatan_kode=${kecamatanKode}`;
      },
    }),
  }),
});

export const {
  useGetProvinsiQuery,
  useGetKotaQuery,
  useGetKecamatanQuery,
  useGetKelurahanQuery,
} = wilayahApi;
