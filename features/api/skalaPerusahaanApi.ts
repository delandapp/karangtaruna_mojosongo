import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface SkalaPerusahaan {
  id: number;
  nama: string;
}

export interface SkalaPerusahaanListResponse {
  success: boolean;
  data: SkalaPerusahaan[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SkalaPerusahaanResponse {
  success: boolean;
  data: SkalaPerusahaan;
}

export interface CreateSkalaPerusahaanPayload {
  nama: string;
}

export interface UpdateSkalaPerusahaanPayload extends Partial<CreateSkalaPerusahaanPayload> {
  id: number;
}

export const skalaPerusahaanApi = createApi({
  reducerPath: "skalaPerusahaanApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/skala-perusahaan",
    credentials: "include",
  }),
  tagTypes: ["SkalaPerusahaan"],
  endpoints: (builder) => ({
    getSkalaPerusahaanList: builder.query<
      SkalaPerusahaanListResponse,
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
      providesTags: ["SkalaPerusahaan"],
    }),

    getSkalaPerusahaanById: builder.query<SkalaPerusahaanResponse, number>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "SkalaPerusahaan", id }],
    }),

    createSkalaPerusahaan: builder.mutation<SkalaPerusahaanResponse, CreateSkalaPerusahaanPayload>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SkalaPerusahaan"],
    }),

    updateSkalaPerusahaan: builder.mutation<SkalaPerusahaanResponse, UpdateSkalaPerusahaanPayload>({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["SkalaPerusahaan", { type: "SkalaPerusahaan", id }],
    }),

    deleteSkalaPerusahaan: builder.mutation<{ success: boolean; data: null }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SkalaPerusahaan"],
    }),
  }),
});

export const {
  useGetSkalaPerusahaanListQuery,
  useGetSkalaPerusahaanByIdQuery,
  useCreateSkalaPerusahaanMutation,
  useUpdateSkalaPerusahaanMutation,
  useDeleteSkalaPerusahaanMutation,
} = skalaPerusahaanApi;
