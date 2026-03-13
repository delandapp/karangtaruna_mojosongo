import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface SektorIndustri {
  id: number;
  nama_sektor: string;
  deskripsi_sektor?: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface SektorIndustriListResponse {
  success: boolean;
  data: SektorIndustri[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SektorIndustriResponse {
  success: boolean;
  data: SektorIndustri;
}

export interface CreateSektorIndustriPayload {
  nama_sektor: string;
  deskripsi_sektor?: string | null;
}

export interface UpdateSektorIndustriPayload extends Partial<CreateSektorIndustriPayload> {
  id: number;
}

export const sektorIndustriApi = createApi({
  reducerPath: "sektorIndustriApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/sektor-industri",
    credentials: "include",
  }),
  tagTypes: ["SektorIndustri"],
  endpoints: (builder) => ({
    getSektorIndustriList: builder.query<
      SektorIndustriListResponse,
      { page?: number; limit?: number; search?: string; dropdown?: boolean }
    >({
      query: ({ page = 1, limit = 10, search, dropdown } = {}) => {
        const params = new URLSearchParams();
        if (dropdown) {
           params.append("dropdown", "true");
        } else {
           params.append("page", String(page));
           params.append("limit", String(limit));
           if (search) params.append("search", search);
        }
        return `?${params.toString()}`;
      },
      providesTags: ["SektorIndustri"],
    }),

    getSektorIndustriById: builder.query<SektorIndustriResponse, number>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "SektorIndustri", id }],
    }),

    createSektorIndustri: builder.mutation<SektorIndustriResponse, CreateSektorIndustriPayload>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SektorIndustri"],
    }),

    updateSektorIndustri: builder.mutation<SektorIndustriResponse, UpdateSektorIndustriPayload>({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["SektorIndustri", { type: "SektorIndustri", id }],
    }),

    deleteSektorIndustri: builder.mutation<{ success: boolean; data: null }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SektorIndustri"],
    }),
  }),
});

export const {
  useGetSektorIndustriListQuery,
  useGetSektorIndustriByIdQuery,
  useCreateSektorIndustriMutation,
  useUpdateSektorIndustriMutation,
  useDeleteSektorIndustriMutation,
} = sektorIndustriApi;
