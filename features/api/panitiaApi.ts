import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type DivisiPanitia =
  | "acara"
  | "logistik"
  | "humas"
  | "konsumsi"
  | "keamanan"
  | "dokumentasi"
  | "dekorasi"
  | "transportasi"
  | "lainnya";

export type PosisiPanitia = "Koordinator" | "Anggota";

export interface AnggotaPanitia {
  id: number;
  event_id: number;
  user_id: number;
  m_jabatan_id?: number | null;
  divisi: DivisiPanitia;
  posisi: PosisiPanitia;
  deskripsi_tugas?: string | null;
  is_aktif: boolean;
  bergabung_pada: string;
  user?: { id: number; nama_lengkap: string; username: string };
  jabatan?: { id: number; nama_jabatan: string } | null;
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

export type CreatePanitiaPayload = {
  user_id: number;
  m_jabatan_id?: number | null;
  divisi: DivisiPanitia;
  posisi: PosisiPanitia;
  deskripsi_tugas?: string | null;
  is_aktif?: boolean;
};

export type UpdatePanitiaPayload = Partial<Omit<CreatePanitiaPayload, "user_id">>;

export const panitiaApi = createApi({
  reducerPath: "panitiaApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Panitia"],
  endpoints: (builder) => ({
    getPanitia: builder.query<
      ListResponse<AnggotaPanitia>,
      { eventId: number; page?: number; limit?: number }
    >({
      query: ({ eventId, page = 1, limit = 50 }) =>
        `/events/${eventId}/panitia?page=${page}&limit=${limit}`,
      providesTags: (_r, _e, { eventId }) => [{ type: "Panitia", id: eventId }],
    }),

    getPanitiaById: builder.query<
      SingleResponse<AnggotaPanitia>,
      { eventId: number; id: number }
    >({
      query: ({ eventId, id }) => `/events/${eventId}/panitia/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: "Panitia", id }],
    }),

    createPanitia: builder.mutation<
      SingleResponse<AnggotaPanitia>,
      { eventId: number; body: CreatePanitiaPayload }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/panitia`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "Panitia", id: eventId }],
    }),

    updatePanitia: builder.mutation<
      SingleResponse<AnggotaPanitia>,
      { eventId: number; id: number; body: UpdatePanitiaPayload }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/panitia/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { eventId, id }) => [
        { type: "Panitia", id: eventId },
        { type: "Panitia", id },
      ],
    }),

    deletePanitia: builder.mutation<
      { success: boolean; data: null },
      { eventId: number; id: number }
    >({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/panitia/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "Panitia", id: eventId }],
    }),
  }),
});

export const {
  useGetPanitiaQuery,
  useGetPanitiaByIdQuery,
  useCreatePanitiaMutation,
  useUpdatePanitiaMutation,
  useDeletePanitiaMutation,
} = panitiaApi;
