import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Platform,
  AkunSosmed,
  HubungkanAkunPayload,
  PerbaruiTokenPayload,
  Konten,
  BuatKontenPayload,
  UpdateKontenPayload,
  KontenFilter,
  Chat,
  BalasChatPayload,
  ChatFilter,
  Analitik,
  AnalitikFilter,
  AnalitikSummary,
  TopKontenItem,
  ApiResponse,
  PaginatedResponse,
  UnreadCountResponse,
  KontakWA,
  BuatKontakPayload,
  UpdateKontakPayload,
  KontakFilter,
  ImportKontakPayload,
  BlazzingWA,
  BuatBlazzingPayload,
} from "@/lib/types/sosial-media.types";

export const sosialMediaApi = createApi({
  reducerPath: "sosialMediaApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/sosial-media",
    credentials: "include",
  }),
  tagTypes: ["Platform", "AkunSosmed", "Konten", "Chat", "Analitik", "Kontak", "Blazzing"],
  endpoints: (builder) => ({
    // ─── Platform ─────────────────────────────────────────────────────────────
    getDaftarPlatform: builder.query<ApiResponse<Platform[]>, void>({
      query: () => "/platform",
      providesTags: ["Platform"],
    }),

    // ─── Akun Sosial Media ───────────────────────────────────────────────────
    getAkunByPlatform: builder.query<ApiResponse<AkunSosmed[]>, number | void>({
      query: (platformId) => platformId ? `/akun?platform_id=${platformId}` : `/akun`,
      providesTags: ["AkunSosmed"],
    }),
    hubungkanAkun: builder.mutation<ApiResponse<AkunSosmed>, HubungkanAkunPayload>({
      query: (body) => ({
        url: "/akun",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AkunSosmed"],
    }),
    putuskanAkun: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/akun/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AkunSosmed"],
    }),
    perbaruiToken: builder.mutation<ApiResponse<AkunSosmed>, { id: number; body: PerbaruiTokenPayload }>({
      query: ({ id, body }) => ({
        url: `/akun/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AkunSosmed"],
    }),
    sinkronisasiAkun: builder.mutation<ApiResponse<any>, number | { id: number; method?: "qr" | "pairing" }>({
      query: (arg) => {
        const id = typeof arg === "number" ? arg : arg.id;
        const method = typeof arg === "number" ? "qr" : (arg.method || "qr");
        return {
          url: `/akun/${id}/sync?method=${method}`,
          method: "POST",
        };
      },
      invalidatesTags: ["AkunSosmed", "Konten", "Chat", "Analitik"],
    }),

    // ─── Konten ──────────────────────────────────────────────────────────────
    getDaftarKonten: builder.query<ApiResponse<Konten[]>, KontenFilter>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.akun_id) queryParams.set("akun_id", String(params.akun_id));
        if (params.platform_id) queryParams.set("platform_id", String(params.platform_id));
        if (params.status) queryParams.set("status", params.status);
        if (params.tipe_konten) queryParams.set("tipe_konten", params.tipe_konten);
        if (params.search) queryParams.set("search", params.search);

        const url = `/konten${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        return url;
      },
      providesTags: ["Konten"],
    }),
    getKontenById: builder.query<ApiResponse<Konten>, number>({
      query: (id) => `/konten/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Konten", id }],
    }),
    buatKonten: builder.mutation<ApiResponse<Konten>, BuatKontenPayload>({
      query: (body) => ({
        url: "/konten",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Konten"],
    }),
    updateKonten: builder.mutation<ApiResponse<Konten>, UpdateKontenPayload>({
      query: ({ id, ...body }) => ({
        url: `/konten/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["Konten", { type: "Konten", id }],
    }),
    hapusKonten: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/konten/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Konten"],
    }),
    publishKonten: builder.mutation<ApiResponse<Konten>, number>({
      query: (id) => ({
        url: `/konten/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => ["Konten", { type: "Konten", id }],
    }),

    // ─── Chat ────────────────────────────────────────────────────────────────
    getDaftarChat: builder.query<ApiResponse<Chat[]>, ChatFilter>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.akun_id) queryParams.set("akun_id", String(params.akun_id));
        if (params.platform_id) queryParams.set("platform_id", String(params.platform_id));
        if (params.status) queryParams.set("status", params.status);
        if (params.search) queryParams.set("search", params.search);

        const url = `/chat${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        return url;
      },
      providesTags: ["Chat"],
    }),
    getChatById: builder.query<ApiResponse<Chat>, number>({
      query: (id) => `/chat/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Chat", id }],
    }),
    balasChat: builder.mutation<ApiResponse<null>, BalasChatPayload>({
      query: (body) => ({
        url: "/chat/balas",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Chat"],
    }),
    updateStatusChat: builder.mutation<ApiResponse<Chat>, { id: number; status: Chat["status"] }>({
      query: ({ id, status }) => ({
        url: `/chat/${id}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => ["Chat", { type: "Chat", id }],
    }),
    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => "/chat/unread",
      providesTags: ["Chat"],
    }),
    buatChat: builder.mutation<ApiResponse<Chat>, { akun_id: number; nomor_telp: string; nama?: string }>({
      query: (body) => ({
        url: "/chat",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Chat"],
    }),
    hapusPesan: builder.mutation<ApiResponse<{ message: string }>, { id: number; type: "reply" | "parent" }>({
      query: ({ id, type }) => ({
        url: `/chat/pesan/${id}?type=${type}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chat"],
    }),
    clearChat: builder.mutation<ApiResponse<{ message: string }>, number>({
      query: (id) => ({
        url: `/chat/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chat"],
    }),

    // ─── Analitik ────────────────────────────────────────────────────────────
    getAnalitik: builder.query<ApiResponse<Analitik[]>, AnalitikFilter>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.akun_id) queryParams.set("akun_id", String(params.akun_id));
        if (params.platform_id) queryParams.set("platform_id", String(params.platform_id));
        if (params.periode) queryParams.set("periode", params.periode);
        if (params.tanggal_mulai) queryParams.set("tanggal_mulai", params.tanggal_mulai);
        if (params.tanggal_selesai) queryParams.set("tanggal_selesai", params.tanggal_selesai);

        const url = `/analitik${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        return url;
      },
      providesTags: ["Analitik"],
    }),
    getTopKonten: builder.query<ApiResponse<TopKontenItem[]>, { platform_id?: number; akun_id?: number }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.platform_id) queryParams.set("platform_id", String(params.platform_id));
        if (params.akun_id) queryParams.set("akun_id", String(params.akun_id));
        const url = `/analitik/top-konten${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        return url;
      },
      providesTags: ["Analitik"],
    }),
    exportAnalitik: builder.mutation<ApiResponse<string>, AnalitikFilter>({
      query: (body) => ({
        url: "/analitik/export",
        method: "POST",
        body,
      }),
    }),

    // ─── Kontak WA ────────────────────────────────────────────────────────────
    getDaftarKontak: builder.query<ApiResponse<KontakWA[]>, KontakFilter>({
      query: (params) => {
        const q = new URLSearchParams();
        q.set("akun_id", String(params.akun_id));
        if (params.search) q.set("search", params.search);
        return `/kontak?${q.toString()}`;
      },
      providesTags: ["Kontak"],
    }),
    buatKontak: builder.mutation<ApiResponse<KontakWA>, BuatKontakPayload>({
      query: (body) => ({ url: "/kontak", method: "POST", body }),
      invalidatesTags: ["Kontak"],
    }),
    updateKontak: builder.mutation<ApiResponse<KontakWA>, UpdateKontakPayload>({
      query: ({ id, ...body }) => ({ url: `/kontak/${id}`, method: "PUT", body }),
      invalidatesTags: ["Kontak"],
    }),
    hapusKontak: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/kontak/${id}`, method: "DELETE" }),
      invalidatesTags: ["Kontak"],
    }),
    importKontak: builder.mutation<ApiResponse<{ imported: number; skipped: number }>, ImportKontakPayload>({
      query: (body) => ({ url: "/kontak/import", method: "POST", body }),
      invalidatesTags: ["Kontak"],
    }),

    // ─── Blazzing WA ─────────────────────────────────────────────────────────
    getDaftarBlazing: builder.query<ApiResponse<BlazzingWA[]>, { akun_id: number }>({
      query: ({ akun_id }) => `/blazzing?akun_id=${akun_id}`,
      providesTags: ["Blazzing"],
    }),
    buatBlazing: builder.mutation<ApiResponse<BlazzingWA>, BuatBlazzingPayload>({
      query: (body) => ({ url: "/blazzing", method: "POST", body }),
      invalidatesTags: ["Blazzing"],
    }),
    hapusBlazing: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/blazzing/${id}`, method: "DELETE" }),
      invalidatesTags: ["Blazzing"],
    }),
  }),
});

export const {
  useGetDaftarPlatformQuery,
  useGetAkunByPlatformQuery,
  useHubungkanAkunMutation,
  usePutuskanAkunMutation,
  usePerbaruiTokenMutation,
  useSinkronisasiAkunMutation,
  useGetDaftarKontenQuery,
  useGetKontenByIdQuery,
  useBuatKontenMutation,
  useUpdateKontenMutation,
  useHapusKontenMutation,
  usePublishKontenMutation,
  useGetDaftarChatQuery,
  useGetChatByIdQuery,
  useBalasChatMutation,
  useUpdateStatusChatMutation,
  useGetUnreadCountQuery,
  useBuatChatMutation,
  useHapusPesanMutation,
  useClearChatMutation,
  useGetAnalitikQuery,
  useGetTopKontenQuery,
  useExportAnalitikMutation,
  // Kontak WA
  useGetDaftarKontakQuery,
  useBuatKontakMutation,
  useUpdateKontakMutation,
  useHapusKontakMutation,
  useImportKontakMutation,
  // Blazzing WA
  useGetDaftarBlazingQuery,
  useBuatBlazingMutation,
  useHapusBlazingMutation,
} = sosialMediaApi;
