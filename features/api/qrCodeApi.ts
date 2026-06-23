import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface QrCode {
  id: number;
  dibuat_oleh_id: number | null;
  judul: string;
  konten: string;
  tipe_konten: string;
  warna_depan: string;
  warna_belakang: string;
  gaya_titik: string;
  gaya_sudut_luar: string;
  gaya_sudut_dalam: string;
  warna_sudut_luar: string | null;
  warna_sudut_dalam: string | null;
  logo_url: string | null;
  logo_ukuran: number;
  logo_margin: number;
  logo_hapus_bg: boolean;
  ukuran: number;
  margin: number;
  level_koreksi: string;
  gambar_url: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
}

interface QrCodeListResponse {
  success: boolean;
  data: QrCode[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface QrCodeResponse {
  success: boolean;
  data: QrCode;
}

interface QrCodeListParams {
  page?: number;
  limit?: number;
  search?: string;
  tipe_konten?: string;
}

export const qrCodeApi = createApi({
  reducerPath: "qrCodeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/qr-code",
    credentials: "include",
  }),
  tagTypes: ["QrCode"],
  endpoints: (builder) => ({
    getQrCodeList: builder.query<QrCodeListResponse, QrCodeListParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.page) queryParams.set("page", String(params.page));
          if (params.limit) queryParams.set("limit", String(params.limit));
          if (params.search) queryParams.set("search", params.search);
          if (params.tipe_konten) queryParams.set("tipe_konten", params.tipe_konten);
        }
        return `?${queryParams.toString()}`;
      },
      providesTags: ["QrCode"],
    }),
    getQrCodeById: builder.query<QrCodeResponse, number>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "QrCode", id }],
    }),
    createQrCode: builder.mutation<QrCodeResponse, any>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
      invalidatesTags: ["QrCode"],
    }),
    updateQrCode: builder.mutation<QrCodeResponse, { id: number; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["QrCode", { type: "QrCode", id }],
    }),
    deleteQrCode: builder.mutation<{ success: boolean; data: { message: string } }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["QrCode"],
    }),
  }),
});

export const {
  useGetQrCodeListQuery,
  useGetQrCodeByIdQuery,
  useCreateQrCodeMutation,
  useUpdateQrCodeMutation,
  useDeleteQrCodeMutation,
} = qrCodeApi;
