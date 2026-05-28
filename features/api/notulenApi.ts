import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type StatusNotulen = "DRAFT" | "REVIEW" | "FINAL";
export type PrioritasTindakLanjut = "RENDAH" | "SEDANG" | "TINGGI";
export type StatusTindakLanjut = "BELUM_MULAI" | "SEDANG_BERJALAN" | "SELESAI" | "DITUNDA";

export interface PoinBahasan {
  id?: number;
  urutan: number;
  isi_bahasan: string;
  pembicara?: string | null;
  c_agenda_rapat_id?: number | null;
}

export interface KeputusanRapat {
  id?: number;
  urutan: number;
  isi_keputusan: string;
  dasar_keputusan?: string | null;
  is_konsensus: boolean;
}

export interface TindakLanjut {
  id?: number;
  m_user_id_pic?: number | null;

  m_user_id_pembuat?: number;
  judul: string;
  deskripsi?: string | null;
  deadline?: string | null;
  prioritas: PrioritasTindakLanjut;
  status: StatusTindakLanjut;
  pic?: { id: number; nama_lengkap: string } | null;
}

export interface Notulen {
  id: number;
  m_rapat_id: number;
  m_user_id: number; // Notulis
  m_approver_id?: number | null; // Approver
  nomor_notulen: string;
  status: StatusNotulen;
  pembukaan?: string | null;
  penutupan?: string | null;
  kesimpulan_umum?: string | null;
  diajukan_pada?: string | null;
  disetujui_pada?: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  rapat?: { id: number; judul_rapat: string } | null;
  notulis?: { id: number; nama_lengkap: string } | null;
  poin_bahasan?: PoinBahasan[] | null;
  keputusan?: KeputusanRapat[] | null;
  tindak_lanjut?: TindakLanjut[] | null;
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

export interface CreateNotulenPayload {
  m_rapat_id: number;
  nomor_notulen: string;
  status?: StatusNotulen;
  pembukaan?: string | null;
  penutupan?: string | null;
  kesimpulan_umum?: string | null;
  poin_bahasan?: PoinBahasan[] | null;
  keputusan?: KeputusanRapat[] | null;
  tindak_lanjut?: TindakLanjut[] | null;
}

export type UpdateNotulenPayload = Partial<CreateNotulenPayload>;

export interface GetNotulenParams {
  status?: StatusNotulen;
  search?: string;
  page?: number;
  limit?: number;
}

export const notulenApi = createApi({
  reducerPath: "notulenApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Notulen"],
  endpoints: (builder) => ({
    getNotulen: builder.query<ListResponse<Notulen>, GetNotulenParams | void>({
      query: (params = {}) => {
        const { status, search, page = 1, limit = 10 } = params || {};
        const p = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status) p.set("status", status);
        if (search) p.set("search", search);
        return `/notulen?${p}`;
      },
      providesTags: ["Notulen"],
    }),

    getNotulenById: builder.query<SingleResponse<Notulen>, number>({
      query: (id) => `/notulen/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Notulen", id }],
    }),

    createNotulen: builder.mutation<SingleResponse<Notulen>, CreateNotulenPayload>({
      query: (body) => ({ url: "/notulen", method: "POST", body }),
      invalidatesTags: ["Notulen"],
    }),

    updateNotulen: builder.mutation<
      SingleResponse<Notulen>,
      { id: number; body: UpdateNotulenPayload }
    >({
      query: ({ id, body }) => ({ url: `/notulen/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => ["Notulen", { type: "Notulen", id }],
    }),

    deleteNotulen: builder.mutation<{ success: boolean; data: null }, number>({
      query: (id) => ({ url: `/notulen/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notulen"],
    }),
  }),
});

export const {
  useGetNotulenQuery,
  useGetNotulenByIdQuery,
  useCreateNotulenMutation,
  useUpdateNotulenMutation,
  useDeleteNotulenMutation,
} = notulenApi;
