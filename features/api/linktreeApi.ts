import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface LinktreeLink {
  id: number;
  linktree_id: number;
  judul: string;
  url: string;
  ikon: string | null;
  warna_ikon: string | null;
  urutan: number;
  aktif: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
  warna_latar?: string | null;
  warna_teks?: string | null;
  warna_border?: string | null;
  animasi?: string | null;
}

export interface Linktree {
  id: number;
  dibuat_oleh_id: number | null;
  slug: string;
  judul: string;
  bio: string | null;
  foto_profil_url: string | null;
  tema: string;
  aktif: boolean;
  warna_primer: string | null;
  warna_latar: string | null;
  font_kustom: string | null;
  bg_image_url?: string | null;
  gaya_tombol?: string | null;
  animasi_tombol?: string | null;
  warna_tombol_latar?: string | null;
  warna_tombol_teks?: string | null;
  warna_tombol_border?: string | null;
  border_radius_tombol?: string | null;
  sosmed_instagram?: string | null;
  sosmed_tiktok?: string | null;
  sosmed_whatsapp?: string | null;
  sosmed_facebook?: string | null;
  sosmed_youtube?: string | null;
  sosmed_github?: string | null;
  sosmed_email?: string | null;
  sosmed_telepon?: string | null;
  meta_judul: string | null;
  meta_deskripsi: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
  links?: LinktreeLink[];
}

interface LinktreeListResponse {
  success: boolean;
  data: Linktree[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LinktreeResponse {
  success: boolean;
  data: Linktree;
}

interface LinktreeListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const linktreeApi = createApi({
  reducerPath: "linktreeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/linktree",
    credentials: "include",
  }),
  tagTypes: ["Linktree"],
  endpoints: (builder) => ({
    getLinktreeList: builder.query<LinktreeListResponse, LinktreeListParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.page) queryParams.set("page", String(params.page));
          if (params.limit) queryParams.set("limit", String(params.limit));
          if (params.search) queryParams.set("search", params.search);
        }
        return `?${queryParams.toString()}`;
      },
      providesTags: ["Linktree"],
    }),
    getLinktreeById: builder.query<LinktreeResponse, number>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Linktree", id }],
    }),
    createLinktree: builder.mutation<LinktreeResponse, any>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Linktree"],
    }),
    updateLinktree: builder.mutation<LinktreeResponse, { id: number; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["Linktree", { type: "Linktree", id }],
    }),
    deleteLinktree: builder.mutation<{ success: boolean; data: { message: string } }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Linktree"],
    }),
    cekSlugTersedia: builder.query<{ success: boolean; tersedia: boolean }, { slug: string; excludeId?: number }>({
      query: ({ slug, excludeId }) => {
        const params = new URLSearchParams({ slug });
        if (excludeId) params.set("excludeId", String(excludeId));
        return `/cek-slug?${params.toString()}`;
      },
    }),
    tambahLink: builder.mutation<LinktreeResponse, { linktreeId: number; [key: string]: any }>({
      query: ({ linktreeId, ...body }) => ({
        url: `/${linktreeId}/link`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { linktreeId }) => [{ type: "Linktree", id: linktreeId }],
    }),
    updateLink: builder.mutation<LinktreeResponse, { linktreeId: number; linkId: number; [key: string]: any }>({
      query: ({ linktreeId, linkId, ...body }) => ({
        url: `/${linktreeId}/link/${linkId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { linktreeId }) => [{ type: "Linktree", id: linktreeId }],
    }),
    deleteLink: builder.mutation<LinktreeResponse, { linktreeId: number; linkId: number }>({
      query: ({ linktreeId, linkId }) => ({
        url: `/${linktreeId}/link/${linkId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { linktreeId }) => [{ type: "Linktree", id: linktreeId }],
    }),
    urutanUlangLink: builder.mutation<LinktreeResponse, { linktreeId: number; links: { id: number; urutan: number }[] }>({
      query: ({ linktreeId, links }) => ({
        url: `/${linktreeId}/reorder`,
        method: "PATCH",
        body: { links },
      }),
      invalidatesTags: (_result, _error, { linktreeId }) => [{ type: "Linktree", id: linktreeId }],
    }),
  }),
});

export const {
  useGetLinktreeListQuery,
  useGetLinktreeByIdQuery,
  useCreateLinktreeMutation,
  useUpdateLinktreeMutation,
  useDeleteLinktreeMutation,
  useCekSlugTersediaQuery,
  useTambahLinkMutation,
  useUpdateLinkMutation,
  useDeleteLinkMutation,
  useUrutanUlangLinkMutation,
} = linktreeApi;
