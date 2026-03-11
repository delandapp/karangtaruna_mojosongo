import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Anggaran {
  id: number;
  event_id: number;
  dibuat_oleh_id: number;
  disetujui_oleh_id?: number | null;
  skenario: string;
  versi: number;
  total_pemasukan_rencana: string | number;
  total_pengeluaran_rencana: string | number;
  total_pemasukan_realisasi?: string | number | null;
  total_pengeluaran_realisasi?: string | number | null;
  persen_cadangan: string | number;
  status: string;
  catatan?: string | null;
  disetujui_pada?: string | null;
  dibuat_oleh?: { id: number; nama_lengkap: string };
  disetujui_oleh?: { id: number; nama_lengkap: string } | null;
  item_anggaran?: any[];
  event?: { id: number; nama_event: string; status_event: string };
  dibuat_pada?: string;
  _count?: { item_anggaran: number; transaksi: number };
}

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta: ListMeta;
}
interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export type CreateAnggaranPayload = {
  skenario?: string;
  versi?: number;
  total_pemasukan_rencana?: number;
  total_pengeluaran_rencana?: number;
  total_pemasukan_realisasi?: number;
  total_pengeluaran_realisasi?: number;
  persen_cadangan?: number;
  status?: string;
  catatan?: string | null;
};

export type UpdateAnggaranPayload = Partial<CreateAnggaranPayload>;

export type ApproveAnggaranPayload = {
  status: string;
  catatan?: string | null;
};

export const anggaranApi = createApi({
  reducerPath: "anggaranApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Anggaran", "AllAnggaran"],
  endpoints: (builder) => ({
    getAnggaran: builder.query<
      ListResponse<Anggaran>,
      { eventId: number; page?: number; limit?: number; skenario?: string; status?: string }
    >({
      query: ({ eventId, page = 1, limit = 50, skenario, status }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (skenario) params.append("skenario", skenario);
        if (status) params.append("status", status);
        return `/events/${eventId}/anggaran?${params.toString()}`;
      },
      providesTags: (_r, _e, { eventId }) => [{ type: "Anggaran", id: eventId }],
    }),

    getAnggaranById: builder.query<
      SingleResponse<Anggaran>,
      { eventId: number; id: number }
    >({
      query: ({ eventId, id }) => `/events/${eventId}/anggaran/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: "Anggaran", id }],
    }),

    createAnggaran: builder.mutation<
      SingleResponse<Anggaran>,
      { eventId: number; body: CreateAnggaranPayload }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/anggaran`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "Anggaran", id: eventId }],
    }),

    updateAnggaran: builder.mutation<
      SingleResponse<Anggaran>,
      { eventId: number; id: number; body: UpdateAnggaranPayload }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/anggaran/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { eventId, id }) => [
        { type: "Anggaran", id: eventId },
        { type: "Anggaran", id },
      ],
    }),

    deleteAnggaran: builder.mutation<
      { success: boolean; data: null },
      { eventId: number; id: number }
    >({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/anggaran/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "Anggaran", id: eventId },
        "AllAnggaran",
      ],
    }),

    // Global listing — used from Keuangan dashboard page
    getAllAnggaran: builder.query<
      ListResponse<Anggaran>,
      { page?: number; limit?: number; status?: string; skenario?: string; search?: string }
    >({
      query: ({ page = 1, limit = 20, status, skenario, search }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (status) params.append("status", status);
        if (skenario) params.append("skenario", skenario);
        if (search) params.append("search", search);
        return `/anggaran?${params.toString()}`;
      },
      providesTags: ["AllAnggaran"],
    }),

    // Approve / change anggaran status
    approveAnggaran: builder.mutation<
      SingleResponse<Anggaran>,
      { eventId: number; id: number; body: ApproveAnggaranPayload }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/anggaran/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { eventId, id }) => [
        { type: "Anggaran", id: eventId },
        { type: "Anggaran", id },
        "AllAnggaran",
      ],
    }),
  }),
});

export const {
  useGetAnggaranQuery,
  useGetAnggaranByIdQuery,
  useCreateAnggaranMutation,
  useUpdateAnggaranMutation,
  useDeleteAnggaranMutation,
  useGetAllAnggaranQuery,
  useApproveAnggaranMutation,
} = anggaranApi;

