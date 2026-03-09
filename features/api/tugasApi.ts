import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type PrioritusTugas = "rendah" | "sedang" | "tinggi" | "kritis";
export type StatusTugas =
  | "belum_mulai"
  | "sedang_berjalan"
  | "selesai"
  | "terlambat"
  | "dibatalkan";

export interface TugasEvent {
  id: number;
  event_id: number;
  ditugaskan_ke_id?: number | null;
  dibuat_oleh_id: number;
  parent_tugas_id?: number | null;
  nama_tugas: string;
  deskripsi?: string | null;
  prioritas: PrioritusTugas;
  status: StatusTugas;
  batas_waktu?: string | null;
  selesai_pada?: string | null;
  ditugaskan_ke?: { id: number; nama_lengkap: string } | null;
  dibuat_oleh?: { id: number; nama_lengkap: string };
  parent_tugas?: { id: number; nama_tugas: string } | null;
  sub_tugas?: Pick<TugasEvent, "id" | "nama_tugas" | "status" | "prioritas">[];
}

interface ListMeta { page: number; limit: number; total: number; totalPages: number; }
interface ListResponse<T> { success: boolean; data: T[]; meta: ListMeta; }
interface SingleResponse<T> { success: boolean; data: T; }

export type CreateTugasPayload = {
  ditugaskan_ke_id?: number | null;
  parent_tugas_id?: number | null;
  nama_tugas: string;
  deskripsi?: string | null;
  prioritas?: PrioritusTugas;
  status?: StatusTugas;
  batas_waktu?: string | null;
  selesai_pada?: string | null;
};
export type UpdateTugasPayload = Partial<CreateTugasPayload>;

export const tugasApi = createApi({
  reducerPath: "tugasApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Tugas"],
  endpoints: (builder) => ({
    getTugas: builder.query<
      ListResponse<TugasEvent>,
      { eventId: number; status?: string; prioritas?: string; ditugaskan_ke_id?: number; page?: number }
    >({
      query: ({ eventId, status, prioritas, ditugaskan_ke_id, page = 1 }) => {
        const params = new URLSearchParams({ page: String(page) });
        if (status) params.set("status", status);
        if (prioritas) params.set("prioritas", prioritas);
        if (ditugaskan_ke_id) params.set("ditugaskan_ke_id", String(ditugaskan_ke_id));
        return `/events/${eventId}/tugas?${params}`;
      },
      providesTags: (_r, _e, { eventId }) => [{ type: "Tugas", id: eventId }],
    }),

    getTugasById: builder.query<
      SingleResponse<TugasEvent>,
      { eventId: number; id: number }
    >({
      query: ({ eventId, id }) => `/events/${eventId}/tugas/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: "Tugas", id }],
    }),

    createTugas: builder.mutation<
      SingleResponse<TugasEvent>,
      { eventId: number; body: CreateTugasPayload }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/tugas`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "Tugas", id: eventId }],
    }),

    updateTugas: builder.mutation<
      SingleResponse<TugasEvent>,
      { eventId: number; id: number; body: UpdateTugasPayload }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/tugas/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { eventId, id }) => [
        { type: "Tugas", id: eventId },
        { type: "Tugas", id },
      ],
    }),

    deleteTugas: builder.mutation<
      { success: boolean; data: null },
      { eventId: number; id: number }
    >({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/tugas/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "Tugas", id: eventId }],
    }),
  }),
});

export const {
  useGetTugasQuery,
  useGetTugasByIdQuery,
  useCreateTugasMutation,
  useUpdateTugasMutation,
  useDeleteTugasMutation,
} = tugasApi;
