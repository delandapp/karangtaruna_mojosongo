import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface MediaSosial {
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  whatsapp?: string | null;
}

export interface Organisasi {
  id: number;
  nama_org: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  logo_url?: string | null;
  visi?: string | null;
  misi?: string | null;
  no_handphone?: string | null;
  email?: string | null;
  alamat?: string | null;
  media_sosial?: MediaSosial | null;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface OrganisasiListResponse {
  success: boolean;
  data: Organisasi[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrganisasiResponse {
  success: boolean;
  data: Organisasi;
}

export interface CreateOrganisasiPayload {
  nama_org: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  no_handphone?: string | null;
  email?: string | null;
  alamat?: string | null;
  logo_url?: string | null;
  visi?: string | null;
  misi?: string | null;
  media_sosial?: MediaSosial | null;
}

export interface UpdateOrganisasiPayload extends Partial<CreateOrganisasiPayload> {
  id: number;
}

export const organisasiApi = createApi({
  reducerPath: "organisasiApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
  }),
  tagTypes: ["Organisasi"],
  endpoints: (builder) => ({
    getOrganisasis: builder.query<
      OrganisasiListResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(search ? { search } : {}),
        });
        return `/organisasi?${params.toString()}`;
      },
      providesTags: ["Organisasi"],
    }),

    getOrganisasiById: builder.query<OrganisasiResponse, number>({
      query: (id) => `/organisasi/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Organisasi", id }],
    }),

    createOrganisasi: builder.mutation<OrganisasiResponse, CreateOrganisasiPayload>({
      query: (body) => ({
        url: "/organisasi",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Organisasi"],
    }),

    updateOrganisasi: builder.mutation<OrganisasiResponse, UpdateOrganisasiPayload>({
      query: ({ id, ...body }) => ({
        url: `/organisasi/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["Organisasi", { type: "Organisasi", id }],
    }),

    deleteOrganisasi: builder.mutation<{ success: boolean; data: null }, number>({
      query: (id) => ({
        url: `/organisasi/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Organisasi"],
    }),
  }),
});

export const {
  useGetOrganisasisQuery,
  useGetOrganisasiByIdQuery,
  useCreateOrganisasiMutation,
  useUpdateOrganisasiMutation,
  useDeleteOrganisasiMutation,
} = organisasiApi;
