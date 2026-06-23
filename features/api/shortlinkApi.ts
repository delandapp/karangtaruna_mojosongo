import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Shortlink,
  ShortlinkListResponse,
  ShortlinkResponse,
  ShortlinkStatsResponse,
  ShortlinkListParams,
  CreateShortlinkPayload,
  UpdateShortlinkPayload,
} from "@/lib/types/shortlink.types";

// ─── API ──────────────────────────────────────────────────────────────────────

export const shortlinkApi = createApi({
  reducerPath: "shortlinkApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/shortlink",
    credentials: "include",
  }),
  tagTypes: ["Shortlink"],
  endpoints: (builder) => ({
    // ── List ───────────────────────────────────────────────────────────────
    /** GET /api/shortlink — List shortlinks (paginated) */
    getShortlinkList: builder.query<ShortlinkListResponse, ShortlinkListParams>({
      query: ({ page = 1, limit = 20, search, is_aktif } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search) params.set("search", search);
        if (is_aktif !== undefined) params.set("is_aktif", String(is_aktif));
        return `?${params.toString()}`;
      },
      providesTags: ["Shortlink"],
    }),

    // ── Detail ─────────────────────────────────────────────────────────────
    /** GET /api/shortlink/[id] — Detail by ID */
    getShortlinkById: builder.query<ShortlinkResponse, number>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Shortlink", id }],
    }),

    // ── Stats ──────────────────────────────────────────────────────────────
    /** GET /api/shortlink/[id]/stats — Click statistics */
    getShortlinkStats: builder.query<ShortlinkStatsResponse, number>({
      query: (id) => `/${id}/stats`,
      providesTags: (_result, _error, id) => [{ type: "Shortlink", id: `stats-${id}` }],
    }),

    // ── Create ─────────────────────────────────────────────────────────────
    /** POST /api/shortlink — Create shortlink */
    createShortlink: builder.mutation<ShortlinkResponse, CreateShortlinkPayload>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shortlink"],
    }),

    // ── Update ─────────────────────────────────────────────────────────────
    /** PATCH /api/shortlink/[id] — Update shortlink */
    updateShortlink: builder.mutation<ShortlinkResponse, UpdateShortlinkPayload>({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Shortlink",
        { type: "Shortlink", id },
      ],
    }),

    // ── Delete ─────────────────────────────────────────────────────────────
    /** DELETE /api/shortlink/[id] — Soft delete */
    deleteShortlink: builder.mutation<{ success: boolean; data: { message: string } }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shortlink"],
    }),
  }),
});

export const {
  useGetShortlinkListQuery,
  useGetShortlinkByIdQuery,
  useGetShortlinkStatsQuery,
  useCreateShortlinkMutation,
  useUpdateShortlinkMutation,
  useDeleteShortlinkMutation,
} = shortlinkApi;
