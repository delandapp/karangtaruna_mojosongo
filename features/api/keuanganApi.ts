import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// --- Types for Item Anggaran ---
export interface ItemAnggaran {
  id: number;
  anggaran_id: number;
  jenis_item: "pemasukan" | "pengeluaran";
  kategori: string;
  kode_item?: string | null;
  deskripsi: string;
  jumlah_satuan: number;
  harga_satuan_rencana: string | number;
  total_rencana: string | number;
  total_realisasi?: string | number | null;
  catatan?: string | null;
}

export type CreateItemAnggaranPayload = {
  jenis_item: "pemasukan" | "pengeluaran";
  kategori: string;
  kode_item?: string | null;
  deskripsi: string;
  jumlah_satuan: number;
  harga_satuan_rencana: number;
  catatan?: string | null;
};

export type UpdateItemAnggaranPayload = Partial<CreateItemAnggaranPayload> & {
  total_realisasi?: number;
};

// --- Types for Transaksi Keuangan ---
export interface TransaksiKeuangan {
  id: number;
  anggaran_id: number;
  item_anggaran_id?: number | null;
  dicatat_oleh_id: number;
  disetujui_oleh_id?: number | null;
  nomor_transaksi: string;
  jenis_transaksi: "pemasukan" | "pengeluaran";
  jumlah: string | number;
  deskripsi: string;
  bukti_url?: string | null;
  tanggal_transaksi: string;
  status: "menunggu_persetujuan" | "disetujui" | "ditolak" | "dibayar";
  catatan?: string | null;
  disetujui_pada?: string | null;

  dicatat_oleh?: { id: number; nama_lengkap: string };
  disetujui_oleh?: { id: number; nama_lengkap: string } | null;
  anggaran?: { id: number; skenario: string; versi: number; event: { nama_event: string } };
  item_anggaran?: { id: number; deskripsi: string; kategori: string } | null;
}

export type CreateTransaksiPayload = {
  anggaran_id: number;
  item_anggaran_id?: number | null;
  jenis_transaksi: "pemasukan" | "pengeluaran";
  jumlah: number;
  deskripsi: string;
  bukti_url?: string | null;
  tanggal_transaksi: string;
  catatan?: string | null;
};

export type UpdateTransaksiPayload = Partial<CreateTransaksiPayload> & {
  status?: "menunggu_persetujuan" | "disetujui" | "ditolak" | "dibayar";
};

// --- Shared Types ---
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

// --- Types for Kas (Buku Kas) ---
export interface Kas {
  id: number;
  nomor_kas: string;
  jenis_kas: "masuk" | "keluar";
  sumber_tujuan: string;
  jumlah: string | number;
  deskripsi: string;
  bukti_url?: string | null;
  tanggal: string;
  status: "menunggu_persetujuan" | "disetujui" | "ditolak";
  catatan?: string | null;
  dicatat_oleh_id: number;
  disetujui_oleh_id?: number | null;
  disetujui_pada?: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;

  dicatat_oleh?: { id: number; nama_lengkap: string };
  disetujui_oleh?: { id: number; nama_lengkap: string } | null;
}

export type CreateKasPayload = {
  jenis_kas: "masuk" | "keluar";
  sumber_tujuan: string;
  jumlah: number;
  deskripsi: string;
  bukti_url?: string | null;
  tanggal: string;
  catatan?: string | null;
};

export type UpdateKasPayload = Partial<CreateKasPayload> & {
  status?: "menunggu_persetujuan" | "disetujui" | "ditolak";
};

export interface KasPublicSummary {
  total_masuk: string | number;
  total_keluar: string | number;
  saldo: string | number;
  count_masuk: number;
  count_keluar: number;
  data: Kas[];
  meta: ListMeta;
}

// --- API Slice ---
export const keuanganApi = createApi({
  reducerPath: "keuanganApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["ItemAnggaran", "TransaksiKeuangan", "Kas"],
  endpoints: (builder) => ({
    
    // ==========================================
    // ITEM ANGGARAN ENDPOINTS
    // ==========================================
    getItemAnggaran: builder.query<
      ListResponse<ItemAnggaran>,
      { eventId: number; anggaranId: number; page?: number; limit?: number; jenis_item?: string }
    >({
      query: ({ eventId, anggaranId, page = 1, limit = 100, jenis_item }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (jenis_item) params.append("jenis_item", jenis_item);
        return `/events/${eventId}/anggaran/${anggaranId}/item?${params.toString()}`;
      },
      providesTags: (_r, _e, { anggaranId }) => [{ type: "ItemAnggaran", id: anggaranId }],
    }),

    getItemAnggaranById: builder.query<
      SingleResponse<ItemAnggaran>,
      { eventId: number; anggaranId: number; id: number }
    >({
      query: ({ eventId, anggaranId, id }) => `/events/${eventId}/anggaran/${anggaranId}/item/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: "ItemAnggaran", id }],
    }),

    createItemAnggaran: builder.mutation<
      SingleResponse<ItemAnggaran>,
      { eventId: number; anggaranId: number; body: CreateItemAnggaranPayload }
    >({
      query: ({ eventId, anggaranId, body }) => ({
        url: `/events/${eventId}/anggaran/${anggaranId}/item`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { anggaranId }) => [{ type: "ItemAnggaran", id: anggaranId }],
    }),

    updateItemAnggaran: builder.mutation<
      SingleResponse<ItemAnggaran>,
      { eventId: number; anggaranId: number; id: number; body: UpdateItemAnggaranPayload }
    >({
      query: ({ eventId, anggaranId, id, body }) => ({
        url: `/events/${eventId}/anggaran/${anggaranId}/item/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { anggaranId, id }) => [
        { type: "ItemAnggaran", id: anggaranId },
        { type: "ItemAnggaran", id },
      ],
    }),

    deleteItemAnggaran: builder.mutation<
      { success: boolean; data: null },
      { eventId: number; anggaranId: number; id: number }
    >({
      query: ({ eventId, anggaranId, id }) => ({
        url: `/events/${eventId}/anggaran/${anggaranId}/item/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { anggaranId }) => [{ type: "ItemAnggaran", id: anggaranId }],
    }),

    // ==========================================
    // TRANSAKSI KEUANGAN ENDPOINTS
    // ==========================================
    getTransaksiKeuangan: builder.query<
      ListResponse<TransaksiKeuangan>,
      { page?: number; limit?: number; anggaran_id?: number; item_anggaran_id?: number; jenis_transaksi?: string; status?: string }
    >({
      query: ({ page = 1, limit = 50, anggaran_id, item_anggaran_id, jenis_transaksi, status }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (anggaran_id) params.append("anggaran_id", String(anggaran_id));
        if (item_anggaran_id) params.append("item_anggaran_id", String(item_anggaran_id));
        if (jenis_transaksi) params.append("jenis_transaksi", jenis_transaksi);
        if (status) params.append("status", status);
        return `/transaksi-keuangan?${params.toString()}`;
      },
      providesTags: ["TransaksiKeuangan"],
    }),

    getTransaksiKeuanganById: builder.query<
      SingleResponse<TransaksiKeuangan>,
      number
    >({
      query: (id) => `/transaksi-keuangan/${id}`,
      providesTags: (_r, _e, id) => [{ type: "TransaksiKeuangan", id }],
    }),

    createTransaksiKeuangan: builder.mutation<
      SingleResponse<TransaksiKeuangan>,
      CreateTransaksiPayload
    >({
      query: (body) => ({
        url: `/transaksi-keuangan`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["TransaksiKeuangan"],
    }),

    updateTransaksiKeuangan: builder.mutation<
      SingleResponse<TransaksiKeuangan>,
      { id: number; body: UpdateTransaksiPayload }
    >({
      query: ({ id, body }) => ({
        url: `/transaksi-keuangan/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "TransaksiKeuangan", id },
        "TransaksiKeuangan",
      ],
    }),

    deleteTransaksiKeuangan: builder.mutation<
      { success: boolean; data: null },
      number
    >({
      query: (id) => ({
        url: `/transaksi-keuangan/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TransaksiKeuangan"],
    }),

    // ==========================================
    // KAS (BUKU KAS) ENDPOINTS
    // ==========================================
    getKasList: builder.query<
      ListResponse<Kas>,
      { page?: number; limit?: number; jenis_kas?: string; status?: string; search?: string }
    >({
      query: ({ page = 1, limit = 20, jenis_kas, status, search }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (jenis_kas) params.append("jenis_kas", jenis_kas);
        if (status) params.append("status", status);
        if (search) params.append("search", search);
        return `/keuangan/kas?${params.toString()}`;
      },
      providesTags: ["Kas"],
    }),

    getKasById: builder.query<SingleResponse<Kas>, number>({
      query: (id) => `/keuangan/kas/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Kas", id }],
    }),

    createKas: builder.mutation<SingleResponse<Kas>, CreateKasPayload>({
      query: (body) => ({
        url: `/keuangan/kas`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Kas"],
    }),

    updateKas: builder.mutation<SingleResponse<Kas>, { id: number; body: UpdateKasPayload }>({
      query: ({ id, body }) => ({
        url: `/keuangan/kas/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Kas", id }, "Kas"],
    }),

    deleteKas: builder.mutation<{ success: boolean; data: null }, number>({
      query: (id) => ({
        url: `/keuangan/kas/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Kas"],
    }),

    approveKas: builder.mutation<
      SingleResponse<Kas>,
      { id: number; body: { status: "disetujui" | "ditolak"; catatan?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/keuangan/kas/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Kas", id }, "Kas"],
    }),

    getKasPublic: builder.query<
      { success: boolean; summary: { total_masuk: string; total_keluar: string; saldo: string; count_masuk: number; count_keluar: number }; data: Kas[]; meta: ListMeta },
      { page?: number; limit?: number; jenis_kas?: string; tahun?: number; bulan?: number }
    >({
      query: ({ page = 1, limit = 20, jenis_kas, tahun, bulan }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (jenis_kas) params.append("jenis_kas", jenis_kas);
        if (tahun) params.append("tahun", String(tahun));
        if (bulan) params.append("bulan", String(bulan));
        return `/keuangan/kas/public?${params.toString()}`;
      },
      providesTags: ["Kas"],
    }),

  }),
});

export const {
  // Item Anggaran
  useGetItemAnggaranQuery,
  useGetItemAnggaranByIdQuery,
  useCreateItemAnggaranMutation,
  useUpdateItemAnggaranMutation,
  useDeleteItemAnggaranMutation,

  // Transaksi Keuangan
  useGetTransaksiKeuanganQuery,
  useGetTransaksiKeuanganByIdQuery,
  useCreateTransaksiKeuanganMutation,
  useUpdateTransaksiKeuanganMutation,
  useDeleteTransaksiKeuanganMutation,

  // Kas (Buku Kas)
  useGetKasListQuery,
  useGetKasByIdQuery,
  useCreateKasMutation,
  useUpdateKasMutation,
  useDeleteKasMutation,
  useApproveKasMutation,
  useGetKasPublicQuery,
} = keuanganApi;
