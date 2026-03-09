import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type StatusRundown = "belum" | "berjalan" | "selesai" | "dilewati";

export interface RundownAcara {
  id: number;
  event_id: number;
  pic_id?: number | null;
  hari_ke: number;
  urutan_no: number;
  waktu_mulai: string;
  waktu_selesai: string;
  nama_kegiatan: string;
  keterangan?: string | null;
  status: StatusRundown;
  pic?: { id: number; nama_lengkap: string } | null;
}

interface ListMeta { page: number; limit: number; total: number; totalPages: number; }
interface ListResponse<T> { success: boolean; data: T[]; meta: ListMeta; }
interface SingleResponse<T> { success: boolean; data: T; }

export type CreateRundownPayload = {
  pic_id?: number | null;
  hari_ke: number;
  urutan_no: number;
  waktu_mulai: string;
  waktu_selesai: string;
  nama_kegiatan: string;
  keterangan?: string | null;
  status?: StatusRundown;
};
export type UpdateRundownPayload = Partial<CreateRundownPayload>;

export const rundownApi = createApi({
  reducerPath: "rundownApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Rundown"],
  endpoints: (builder) => ({
    getRundown: builder.query<
      ListResponse<RundownAcara>,
      { eventId: number; hariKe?: number; page?: number }
    >({
      query: ({ eventId, hariKe, page = 1 }) => {
        const params = new URLSearchParams({ page: String(page), limit: "100" });
        if (hariKe) params.set("hari_ke", String(hariKe));
        return `/events/${eventId}/rundown?${params}`;
      },
      providesTags: (_r, _e, { eventId }) => [{ type: "Rundown", id: eventId }],
    }),

    getRundownById: builder.query<
      SingleResponse<RundownAcara>,
      { eventId: number; id: number }
    >({
      query: ({ eventId, id }) => `/events/${eventId}/rundown/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: "Rundown", id }],
    }),

    createRundown: builder.mutation<
      SingleResponse<RundownAcara>,
      { eventId: number; body: CreateRundownPayload }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/rundown`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "Rundown", id: eventId }],
    }),

    updateRundown: builder.mutation<
      SingleResponse<RundownAcara>,
      { eventId: number; id: number; body: UpdateRundownPayload }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/rundown/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "Rundown", id: eventId }],
    }),

    deleteRundown: builder.mutation<
      { success: boolean; data: null },
      { eventId: number; id: number }
    >({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/rundown/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "Rundown", id: eventId }],
    }),
  }),
});

export const {
  useGetRundownQuery,
  useGetRundownByIdQuery,
  useCreateRundownMutation,
  useUpdateRundownMutation,
  useDeleteRundownMutation,
} = rundownApi;
