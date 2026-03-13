import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface MediaSosial {
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  whatsapp?: string | null;
}

export interface Perusahaan {
  id: number;
  m_sektor_industri_id?: number | null;
  m_skala_perusahaan_id?: number | null;
  kode_wilayah_induk_provinsi?: string | null;
  kode_wilayah_induk_kota?: string | null;
  kode_wilayah_induk_kecamatan?: string | null;
  kode_wilayah_induk_kelurahan?: string | null;
  
  nama: string;
  nama_kontak?: string | null;
  jabatan_kontak?: string | null;
  no_handphone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  
  alamat?: string | null;
  sumber_informasi?: string | null;
  catatan?: string | null;
  logo_url?: string | null;

  // Relasi
  sektor?: { id: number; nama_sektor: string } | null;
  skala?: { id: number; nama: string } | null;
  m_provinsi?: { id: number; nama: string; kode_wilayah: string } | null;
  m_kota?: { id: number; nama: string; kode_wilayah: string } | null;
  m_kecamatan?: { id: number; nama: string; kode_wilayah: string } | null;
  m_kelurahan?: { id: number; nama: string; kode_wilayah: string } | null;

  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface PerusahaanListResponse {
  success: boolean;
  data: Perusahaan[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PerusahaanResponse {
  success: boolean;
  data: Perusahaan;
}

export interface CreatePerusahaanPayload {
  m_sektor_industri_id?: number | null;
  m_skala_perusahaan_id?: number | null;
  kode_wilayah_induk_provinsi?: string | null;
  kode_wilayah_induk_kota?: string | null;
  kode_wilayah_induk_kecamatan?: string | null;
  kode_wilayah_induk_kelurahan?: string | null;
  
  nama: string;
  nama_kontak?: string | null;
  jabatan_kontak?: string | null;
  no_handphone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  
  alamat?: string | null;
  sumber_informasi?: string | null;
  catatan?: string | null;
  logo_url?: string | null;
}

export interface UpdatePerusahaanPayload extends Partial<CreatePerusahaanPayload> {
  id: number;
}

export const perusahaanApi = createApi({
  reducerPath: "perusahaanApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/perusahaan",
    credentials: "include",
  }),
  tagTypes: ["Perusahaan"],
  endpoints: (builder) => ({
    getPerusahaanList: builder.query<
      PerusahaanListResponse,
      { page?: number; limit?: number; search?: string; dropdown?: boolean; m_sektor_industri_id?: number; m_skala_perusahaan_id?: number }
    >({
      query: ({ page = 1, limit = 10, search, dropdown, m_sektor_industri_id, m_skala_perusahaan_id } = {}) => {
        const params = new URLSearchParams();
        if (dropdown) {
           params.append("dropdown", "true");
        } else {
           params.append("page", String(page));
           params.append("limit", String(limit));
           if (search) params.append("search", search);
           if (m_sektor_industri_id) params.append("m_sektor_industri_id", String(m_sektor_industri_id));
           if (m_skala_perusahaan_id) params.append("m_skala_perusahaan_id", String(m_skala_perusahaan_id));
        }
        return `?${params.toString()}`;
      },
      providesTags: ["Perusahaan"],
    }),

    getPerusahaanById: builder.query<PerusahaanResponse, number>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Perusahaan", id }],
    }),

    createPerusahaan: builder.mutation<PerusahaanResponse, CreatePerusahaanPayload>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Perusahaan"],
    }),

    updatePerusahaan: builder.mutation<PerusahaanResponse, UpdatePerusahaanPayload>({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["Perusahaan", { type: "Perusahaan", id }],
    }),

    deletePerusahaan: builder.mutation<{ success: boolean; data: null }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Perusahaan"],
    }),
  }),
});

export const {
  useGetPerusahaanListQuery,
  useGetPerusahaanByIdQuery,
  useCreatePerusahaanMutation,
  useUpdatePerusahaanMutation,
  useDeletePerusahaanMutation,
} = perusahaanApi;
