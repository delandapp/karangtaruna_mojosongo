import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type StatusRapat = "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "DIBATALKAN" | "DITUNDA";
export type JenisRapat = "INTERNAL" | "EKSTERNAL" | "KOORDINASI" | "EVALUASI" | "DARURAT" | "LAINNYA";
export type StatusKehadiran = "DIUNDANG" | "HADIR" | "TIDAK_HADIR" | "IZIN" | "TERLAMBAT";

export interface AgendaItem {
  id?: number;
  urutan: number;
  judul_agenda: string;
  deskripsi?: string | null;
  durasi_menit?: number | null;
  m_user_id?: number | null;
}

export interface PesertaItem {
  id?: number;
  m_user_id?: number | null;
  nama_peserta: string;
  jabatan_peserta?: string | null;
  instansi?: string | null;
  email?: string | null;
  no_handphone?: string | null;
  status_kehadiran: StatusKehadiran;
  is_moderator: boolean;
  is_notulis: boolean;
}

export interface Rapat {
  id: number;
  m_kategori_rapat_id?: number | null;
  event_id?: number | null;
  m_user_id: number; // pembuat
  judul_rapat: string;
  jenis_rapat: JenisRapat;
  status_rapat: StatusRapat;
  deskripsi?: string | null;
  tanggal_mulai: string;
  tanggal_selesai?: string | null;
  lokasi?: string | null;
  link_online?: string | null;
  is_online: boolean;
  nomor_rapat?: string | null;
  is_recurring: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
  kategori?: { id: number; nama_kategori: string; warna_hex?: string | null } | null;
  event?: { id: number; nama_event: string; kode_event: string } | null;
  dibuat_oleh?: { id: number; nama_lengkap: string } | null;
  agendas?: AgendaItem[] | null;
  peserta?: PesertaItem[] | null;
  notulen?: { id: number; nomor_notulen: string; status: string } | null;
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

export interface CreateRapatPayload {
  m_kategori_rapat_id?: number | null;
  event_id?: number | null;
  judul_rapat: string;
  jenis_rapat: JenisRapat;
  status_rapat: StatusRapat;
  deskripsi?: string | null;
  tanggal_mulai: string;
  tanggal_selesai?: string | null;
  lokasi?: string | null;
  link_online?: string | null;
  is_online: boolean;
  nomor_rapat?: string | null;
  is_recurring: boolean;
  agendas?: AgendaItem[] | null;
  peserta?: PesertaItem[] | null;
}

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
