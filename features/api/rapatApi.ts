import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type StatusRapat = "dijadwalkan" | "berlangsung" | "selesai" | "dibatalkan";

export interface AgendaItem {
  nomor: number;
  topik: string;
  durasi_menit?: number;
  pic?: string;
}

export interface ActionItem {
  tugas: string;
  pic?: string;
  deadline?: string;
}

export interface Rapat {
  id: number;
  event_id?: number | null;
  dibuat_oleh_id: number;
  judul: string;
  tanggal_rapat: string;
  lokasi?: string | null;
  notulensi?: string | null;
  agenda?: AgendaItem[] | null;
  action_items?: ActionItem[] | null;
  status: StatusRapat;
  event?: { id: number; nama_event: string; kode_event: string } | null;
  dibuat_oleh?: { id: number; nama_lengkap: string };
}

interface ListMeta { page: number; limit: number; total: number; totalPages: number; }
interface ListResponse<T> { success: boolean; data: T[]; meta: ListMeta; }
interface SingleResponse<T> { success: boolean; data: T; }

export type CreateRapatPayload = {
  event_id?: number | null;
  judul: string;
  tanggal_rapat: string;
  lokasi?: string | null;
  notulensi?: string | null;
  agenda?: AgendaItem[] | null;
  action_items?: ActionItem[] | null;
  status?: StatusRapat;
};
export type UpdateRapatPayload = Partial<CreateRapatPayload>;

export interface GetRapatParams {
  event_id?: number;
  status?: StatusRapat;
  search?: string;
  page?: number;
  limit?: number;
}

export const rapatApi = createApi({
  reducerPath: "rapatApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Rapat"],
  endpoints: (builder) => ({
    getRapat: builder.query<ListResponse<Rapat>, GetRapatParams | void>({
      query: (params = {}) => {
        const { event_id, status, search, page = 1, limit = 10 } = params || {};
        const p = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (event_id) p.set("event_id", String(event_id));
        if (status) p.set("status", status);
        if (search) p.set("search", search);
        return `/rapat?${p}`;
      },
      providesTags: ["Rapat"],
    }),

    getRapatById: builder.query<SingleResponse<Rapat>, number>({
      query: (id) => `/rapat/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Rapat", id }],
    }),

    createRapat: builder.mutation<SingleResponse<Rapat>, CreateRapatPayload>({
      query: (body) => ({ url: "/rapat", method: "POST", body }),
      invalidatesTags: ["Rapat"],
    }),

    updateRapat: builder.mutation<
      SingleResponse<Rapat>,
      { id: number; body: UpdateRapatPayload }
    >({
      query: ({ id, body }) => ({ url: `/rapat/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => ["Rapat", { type: "Rapat", id }],
    }),

    deleteRapat: builder.mutation<{ success: boolean; data: null }, number>({
      query: (id) => ({ url: `/rapat/${id}`, method: "DELETE" }),
      invalidatesTags: ["Rapat"],
    }),
  }),
});

export const {
  useGetRapatQuery,
  useGetRapatByIdQuery,
  useCreateRapatMutation,
  useUpdateRapatMutation,
  useDeleteRapatMutation,
} = rapatApi;
