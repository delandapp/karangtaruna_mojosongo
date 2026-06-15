import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type StatusBerita =
  | "DRAFT"
  | "REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED"
  | "REJECTED";

export type TipeCover =
  | "LANDSCAPE_16_9"
  | "LANDSCAPE_4_3"
  | "SQUARE_1_1"
  | "PORTRAIT_9_16";

// ─── Entities ────────────────────────────────────────────────────────────────

export interface KategoriBerita {
  id: number;
  nama: string;
  slug: string;
  deskripsi?: string | null;
  warna_hex?: string | null;
  icon_url?: string | null;
  is_aktif: boolean;
  urutan: number;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface TagBerita {
  id: number;
  nama: string;
  slug: string;
  deskripsi?: string | null;
  total_berita: number;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface BeritaCover {
  id: number;
  c_berita_id: number;
  tipe: TipeCover;
  s3_key: string;
  s3_url: string;
  alt_text?: string | null;
  mime_type: string;
  width: number;
  height: number;
  ukuran_byte?: number | null;
  is_primary: boolean;
  dibuat_pada: string;
}

export interface Berita {
  id: number;
  judul: string;
  sub_judul?: string | null;
  penulis: string;
  editor?: string | null;
  konten_json: Record<string, unknown>;
  konten_html: string;
  konten_plaintext: string;
  status: StatusBerita;
  is_featured: boolean;
  is_breaking_news: boolean;
  scheduled_at?: string | null;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_slug: string;
  seo_canonical_url?: string | null;
  seo_og_title?: string | null;
  seo_og_description?: string | null;
  seo_og_image_url?: string | null;
  seo_twitter_card?: string | null;
  seo_keywords: string[];
  seo_robots?: string | null;
  seo_schema_json?: Record<string, unknown> | null;
  total_views: number;
  total_likes: number;
  total_dislikes: number;
  total_komentar: number;
  total_share: number;
  trending_score: number;
  m_kategori_berita_id: number;
  m_user_id?: number | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada?: string | null;
  // Includes
  m_kategori_berita?: KategoriBerita;
  r_berita_tag?: { id: number; m_tag: TagBerita }[];
  c_berita_cover?: BeritaCover[];
}

// Berita card (dari Elasticsearch — portal publik)
export interface BeritaCard {
  id: number;
  judul: string;
  cover_url?: string | null;
  kategori: string;
  kategori_slug: string;
  tags: string[];
  published_at?: string | null;
  total_views: number;
  total_likes: number;
  trending_score: number;
  is_featured: boolean;
  seo_slug: string;
  // Dari ES detail (slug endpoint)
  konten?: string;
  seo_description?: string | null;
  keywords?: string[];
  is_breaking_news?: boolean;
  penulis?: string;
  sub_judul?: string | null;
}

// ─── Request / Response ───────────────────────────────────────────────────────

export interface BeritaListResponse {
  success: boolean;
  data: Berita[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BeritaResponse {
  success: boolean;
  data: Berita;
}

export interface BeritaCardListResponse {
  success: boolean;
  data: BeritaCard[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BeritaCardResponse {
  success: boolean;
  data: BeritaCard;
}

export interface KategoriBeritaListResponse {
  success: boolean;
  data: KategoriBerita[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TagBeritaListResponse {
  success: boolean;
  data: TagBerita[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateBeritaPayload {
  judul: string;
  sub_judul?: string;
  penulis: string;
  editor?: string;
  konten_json: Record<string, unknown>;
  konten_html: string;
  konten_plaintext: string;
  m_kategori_berita_id: number;
  tag_ids?: number[];
  is_featured?: boolean;
  is_breaking_news?: boolean;
  scheduled_at?: string;
  seo_slug: string;
  seo_title?: string;
  seo_description?: string;
  seo_canonical_url?: string;
  seo_og_title?: string;
  seo_og_description?: string;
  seo_og_image_url?: string;
  seo_twitter_card?: "summary" | "summary_large_image";
  seo_keywords?: string[];
  seo_robots?: string;
  seo_schema_json?: Record<string, unknown>;
}

export interface UpdateBeritaPayload extends Partial<CreateBeritaPayload> {
  id: number;
}

export interface PublishBeritaPayload {
  id: number;
  action: "PUBLISH" | "ARCHIVE" | "REJECT" | "REVIEW" | "DRAFT";
  scheduled_at?: string;
  alasan?: string;
}

export interface BeritaListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: StatusBerita;
  kategori?: string;
  is_featured?: boolean;
}

export interface CreateKategoriPayload {
  nama: string;
  slug: string;
  deskripsi?: string;
  warna_hex?: string;
  icon_url?: string;
  urutan?: number;
}

export interface CreateTagPayload {
  nama: string;
  slug: string;
  deskripsi?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const beritaApi = createApi({
  reducerPath: "beritaApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
  }),
  tagTypes: ["Berita", "KategoriBerita", "TagBerita"],
  endpoints: (builder) => ({

    // ── Admin CMS ──────────────────────────────────────────────────────────

    /** GET /api/berita — CMS list (semua status, protected) */
    getBeritaList: builder.query<BeritaListResponse, BeritaListParams>({
      query: ({ page = 1, limit = 20, search, status, kategori, is_featured } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(search     ? { search }                         : {}),
          ...(status     ? { status }                         : {}),
          ...(kategori   ? { kategori }                       : {}),
          ...(is_featured !== undefined ? { is_featured: String(is_featured) } : {}),
        });
        return `/berita?${params.toString()}`;
      },
      providesTags: ["Berita"],
    }),

    /** GET /api/berita/[id] — Detail by ID (CMS edit) */
    getBeritaById: builder.query<BeritaResponse, number>({
      query: (id) => `/berita/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Berita", id }],
    }),

    /** POST /api/berita — Create berita */
    createBerita: builder.mutation<BeritaResponse, CreateBeritaPayload>({
      query: (body) => ({
        url: "/berita",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Berita"],
    }),

    /** PATCH /api/berita/[id] — Update berita */
    updateBerita: builder.mutation<BeritaResponse, UpdateBeritaPayload>({
      query: ({ id, ...body }) => ({
        url: `/berita/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["Berita", { type: "Berita", id }],
    }),

    /** DELETE /api/berita/[id] — Soft delete */
    deleteBerita: builder.mutation<{ success: boolean; data: { message: string } }, number>({
      query: (id) => ({
        url: `/berita/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Berita"],
    }),

    /** PATCH /api/berita/[id]/publish — Ubah status */
    publishBerita: builder.mutation<BeritaResponse, PublishBeritaPayload>({
      query: ({ id, ...body }) => ({
        url: `/berita/${id}/publish`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["Berita", { type: "Berita", id }],
    }),

    // ── Portal Publik ──────────────────────────────────────────────────────

    /** GET /api/berita/terbaru — Berita terbaru (publik) */
    getBeritaTerbaru: builder.query<BeritaCardListResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 12 } = {}) =>
        `/berita/terbaru?page=${page}&limit=${limit}`,
      providesTags: ["Berita"],
    }),

    /** GET /api/berita/trending — Trending (publik) */
    getBeritaTrending: builder.query<{ success: boolean; data: BeritaCard[] }, { limit?: number }>({
      query: ({ limit = 5 } = {}) => `/berita/trending?limit=${limit}`,
      providesTags: ["Berita"],
    }),

    /** GET /api/berita/top — Top views (publik) */
    getBeritaTop: builder.query<{ success: boolean; data: BeritaCard[] }, { limit?: number }>({
      query: ({ limit = 5 } = {}) => `/berita/top?limit=${limit}`,
      providesTags: ["Berita"],
    }),

    /** GET /api/berita/slug/[slug] — Detail artikel publik */
    getBeritaBySlug: builder.query<BeritaCardResponse, string>({
      query: (slug) => `/berita/slug/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: "Berita", id: `slug-${slug}` }],
    }),

    /** GET /api/berita/kategori/[slug] — Berita by kategori (publik) */
    getBeritaByKategori: builder.query<
      BeritaCardListResponse,
      { slug: string; page?: number; limit?: number }
    >({
      query: ({ slug, page = 1, limit = 12 }) =>
        `/berita/kategori/${slug}?page=${page}&limit=${limit}`,
      providesTags: ["Berita"],
    }),

    // ── Kategori Berita ────────────────────────────────────────────────────

    /** GET /api/kategori-berita — List kategori (publik + admin) */
    getKategoriBerita: builder.query<
      KategoriBeritaListResponse,
      { dropdown?: boolean; page?: number; limit?: number; search?: string }
    >({
      query: ({ dropdown = false, page = 1, limit = 50, search } = {}) => {
        if (dropdown) return `/kategori-berita?dropdown=true`;
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set("search", search);
        return `/kategori-berita?${params.toString()}`;
      },
      providesTags: ["KategoriBerita"],
    }),

    /** POST /api/kategori-berita — Buat kategori */
    createKategoriBerita: builder.mutation<{ success: boolean; data: KategoriBerita }, CreateKategoriPayload>({
      query: (body) => ({
        url: "/kategori-berita",
        method: "POST",
        body,
      }),
      invalidatesTags: ["KategoriBerita"],
    }),

    // ── Tag Berita ─────────────────────────────────────────────────────────

    /** GET /api/tag-berita — List tag (dropdown & admin) */
    getTagBerita: builder.query<
      TagBeritaListResponse,
      { dropdown?: boolean; page?: number; limit?: number; search?: string }
    >({
      query: ({ dropdown = false, page = 1, limit = 50, search } = {}) => {
        if (dropdown) return `/tag-berita?dropdown=true`;
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set("search", search);
        return `/tag-berita?${params.toString()}`;
      },
      providesTags: ["TagBerita"],
    }),

    /** POST /api/tag-berita — Buat tag */
    createTagBerita: builder.mutation<{ success: boolean; data: TagBerita }, CreateTagPayload>({
      query: (body) => ({
        url: "/tag-berita",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TagBerita"],
    }),
  }),
});

export const {
  // Admin CMS
  useGetBeritaListQuery,
  useGetBeritaByIdQuery,
  useCreateBeritaMutation,
  useUpdateBeritaMutation,
  useDeleteBeritaMutation,
  usePublishBeritaMutation,
  // Portal Publik
  useGetBeritaTerbaruQuery,
  useGetBeritaTrendingQuery,
  useGetBeritaTopQuery,
  useGetBeritaBySlugQuery,
  useGetBeritaByKategoriQuery,
  // Kategori
  useGetKategoriBeritaQuery,
  useCreateKategoriBeritaMutation,
  // Tag
  useGetTagBeritaQuery,
  useCreateTagBeritaMutation,
} = beritaApi;
