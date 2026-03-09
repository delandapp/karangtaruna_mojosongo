import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type JenisEvent =
  | "festival"
  | "lomba"
  | "seminar"
  | "bakti_sosial"
  | "olahraga"
  | "seni_budaya"
  | "pelatihan"
  | "lainnya";

export type StatusEvent =
  | "perencanaan"
  | "persiapan"
  | "siap"
  | "berlangsung"
  | "selesai"
  | "dibatalkan";

export interface Event {
  id: number;
  kode_event: string;
  m_organisasi_id: number;
  dibuat_oleh_id: number;
  nama_event: string;
  tema_event?: string | null;
  deskripsi?: string | null;
  jenis_event: JenisEvent;
  status_event: StatusEvent;
  tanggal_mulai: string;
  tanggal_selesai: string;
  lokasi?: string | null;
  target_peserta?: number | null;
  realisasi_peserta?: number | null;
  banner_url?: string | null;
  tujuan?: string[] | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  organisasi?: { id: number; nama_org: string };
  dibuat_oleh?: { id: number; nama_lengkap: string; username: string };
}

export interface EventListResponse {
  success: boolean;
  data: Event[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EventResponse {
  success: boolean;
  data: Event;
}

export interface CreateEventPayload {
  m_organisasi_id: number;
  nama_event: string;
  jenis_event: JenisEvent;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tema_event?: string | null;
  deskripsi?: string | null;
  status_event?: StatusEvent;
  lokasi?: string | null;
  target_peserta?: number | null;
  realisasi_peserta?: number | null;
  banner_url?: string | null;
  tujuan?: string[] | null;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  id: number;
}

export interface EventListParams {
  page?: number;
  limit?: number;
  search?: string;
  status_event?: StatusEvent;
  jenis_event?: JenisEvent;
  m_organisasi_id?: number;
}

export const eventApi = createApi({
  reducerPath: "eventApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
  }),
  tagTypes: ["Event"],
  endpoints: (builder) => ({
    getEvents: builder.query<EventListResponse, EventListParams>({
      query: ({ page = 1, limit = 10, search, status_event, jenis_event, m_organisasi_id } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(search           ? { search }                                : {}),
          ...(status_event     ? { status_event }                          : {}),
          ...(jenis_event      ? { jenis_event }                           : {}),
          ...(m_organisasi_id  ? { m_organisasi_id: String(m_organisasi_id) } : {}),
        });
        return `/events?${params.toString()}`;
      },
      providesTags: ["Event"],
    }),

    getEventById: builder.query<EventResponse, number>({
      query: (id) => `/events/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Event", id }],
    }),

    createEvent: builder.mutation<EventResponse, CreateEventPayload>({
      query: (body) => ({
        url: "/events",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Event"],
    }),

    updateEvent: builder.mutation<EventResponse, UpdateEventPayload>({
      query: ({ id, ...body }) => ({
        url: `/events/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["Event", { type: "Event", id }],
    }),

    deleteEvent: builder.mutation<{ success: boolean; data: null }, number>({
      query: (id) => ({
        url: `/events/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Event"],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetEventByIdQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventApi;
