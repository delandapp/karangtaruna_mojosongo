import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface EProposal {
  id: number;
  event_id: number;
  dibuat_oleh_id: number;
  judul: string;
  slug: string;
  deskripsi: string | null;
  file_pdf_url: string;
  cover_url: string | null;
  is_aktif: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
  pengaturan?: EProposalPengaturan | null;
  daftar_isi?: EProposalDaftarIsi[];
}

export interface EProposalPengaturan {
  id: number;
  m_eproposal_id: number;
  auto_flip: boolean;
  sound_effect: boolean;
  bg_music_url: string | null;
  theme_color: string;
  animasi_transisi: string;
}

export interface EProposalDaftarIsi {
  id?: number;
  judul: string;
  halaman: number;
  urutan: number;
}

export interface EProposalResponse {
  success: boolean;
  data: EProposal;
}

export interface CreateEProposalPayload {
  event_id: number;
  judul: string;
  slug: string;
  deskripsi?: string | null;
  file_pdf_url: string;
  cover_url?: string | null;
  pengaturan?: Pick<
    EProposalPengaturan,
    "auto_flip" | "sound_effect" | "bg_music_url" | "theme_color" | "animasi_transisi"
  >;
  daftar_isi?: Omit<EProposalDaftarIsi, "id">[];
}

export interface UpdateEProposalPayload extends Partial<CreateEProposalPayload> {
  id: number;
}

export const eproposalApi = createApi({
  reducerPath: "eproposalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
  }),
  tagTypes: ["EProposal"],
  endpoints: (builder) => ({
    getEProposalByEventId: builder.query<EProposalResponse, number>({
      query: (eventId) => `/events/${eventId}/eproposal`,
      providesTags: (_result, _error, eventId) => [{ type: "EProposal", id: `event-${eventId}` }],
    }),

    getEProposalBySlug: builder.query<EProposalResponse, string>({
      query: (slug) => `/proposal/${slug}/api`, // Explicitly different path or query structure if needed
      providesTags: (_result, _error, slug) => [{ type: "EProposal", id: `slug-${slug}` }],
    }),

    createEProposal: builder.mutation<EProposalResponse, CreateEProposalPayload>({
      query: (body) => ({
        url: "/eproposal",
        method: "POST",
        body,
      }),
      invalidatesTags: ["EProposal"],
    }),

    updateEProposal: builder.mutation<EProposalResponse, UpdateEProposalPayload>({
      query: ({ id, ...body }) => ({
        url: `/eproposal/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "EProposal",
        { type: "EProposal", id },
      ], // We may also want to invalidate the event-bound one, but a broad "EProposal" tag invalidation covers it.
    }),

    deleteEProposal: builder.mutation<{ success: boolean; data: null }, number>({
      query: (id) => ({
        url: `/eproposal/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EProposal"],
    }),
  }),
});

export const {
  useGetEProposalByEventIdQuery,
  useGetEProposalBySlugQuery,
  useCreateEProposalMutation,
  useUpdateEProposalMutation,
  useDeleteEProposalMutation,
} = eproposalApi;
