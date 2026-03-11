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

// --- API Slice ---
export const keuanganApi = createApi({
  reducerPath: "keuanganApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["ItemAnggaran", "TransaksiKeuangan"],
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
} = keuanganApi;
