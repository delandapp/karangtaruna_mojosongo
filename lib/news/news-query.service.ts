/**
 * News Query Service — Aggregation queries untuk portal berita publik.
 *
 * Semua query menggunakan pola:
 *   Redis cache → miss → Elasticsearch → simpan ke Redis → return
 *
 * TTL Strategy:
 *   Trending   = 15 menit  (diupdate worker 15 menit sekali)
 *   Top        = 1 jam     (berubah perlahan)
 *   Terbaru p1 = 2 menit   (halaman 1 sering berubah)
 *   Terbaru p2+= 5 menit   (halaman 2+ jarang berubah)
 *   By Slug    = 10 menit  (stale setelah diedit)
 *   By Kategori= 5 menit   (medium frequency)
 */
import { searchDocuments } from "@/lib/elasticsearch";
import { getCache, setCache } from "@/lib/redis";
import { ELASTIC_INDICES, REDIS_KEYS } from "@/lib/constants";
import type { NewsEsDocument } from "./news-es";

// ─── TTL Constants (dalam detik) ─────────────────────────────────────────────

const TTL = {
  TRENDING:       15 * 60,
  TOP:            60 * 60,
  LATEST_P1:       2 * 60,
  LATEST_P2PLUS:   5 * 60,
  BY_SLUG:        10 * 60,
  BY_KATEGORI:     5 * 60,
} as const;

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type BeritaCard = Pick<
  NewsEsDocument,
  | "id"
  | "judul"
  | "cover_url"
  | "kategori"
  | "kategori_slug"
  | "tags"
  | "published_at"
  | "total_views"
  | "total_likes"
  | "trending_score"
  | "is_featured"
  | "seo_slug"
>;

const CARD_FIELDS = [
  "id",
  "judul",
  "cover_url",
  "kategori",
  "kategori_slug",
  "tags",
  "published_at",
  "total_views",
  "total_likes",
  "trending_score",
  "is_featured",
  "seo_slug",
];

// ─── Query Functions ──────────────────────────────────────────────────────────

/**
 * Berita Trending — 7 hari terakhir, sort by trending_score DESC.
 * Cache Redis: 15 menit.
 */
export async function getBeritaTrending(limit = 10): Promise<BeritaCard[]> {
  const cached = await getCache<BeritaCard[]>(REDIS_KEYS.BERITA.TRENDING);
  if (cached) return cached;

  const { hits } = await searchDocuments<BeritaCard>(
    ELASTIC_INDICES.BERITA,
    {
      bool: {
        filter: [{ range: { published_at: { gte: "now-7d/d" } } }],
      },
    },
    {
      size: limit,
      sort: [{ trending_score: { order: "desc" } }],
      _source: CARD_FIELDS,
    },
  );

  await setCache(REDIS_KEYS.BERITA.TRENDING, hits, TTL.TRENDING);
  return hits;
}

/**
 * Berita Top — 30 hari terakhir, sort by total_views DESC.
 * Cache Redis: 1 jam.
 */
export async function getBeritaTop(limit = 10): Promise<BeritaCard[]> {
  const cached = await getCache<BeritaCard[]>(REDIS_KEYS.BERITA.TOP);
  if (cached) return cached;

  const { hits } = await searchDocuments<BeritaCard>(
    ELASTIC_INDICES.BERITA,
    { range: { published_at: { gte: "now-30d/d" } } },
    {
      size: limit,
      sort: [{ total_views: { order: "desc" } }],
      _source: CARD_FIELDS,
    },
  );

  await setCache(REDIS_KEYS.BERITA.TOP, hits, TTL.TOP);
  return hits;
}

/**
 * Berita Terbaru — sort by published_at DESC, paginated.
 * Cache Redis: hal.1 = 2 menit, hal.2+ = 5 menit.
 */
export async function getBeritaTerbaru(
  page = 1,
  limit = 20,
): Promise<{ hits: BeritaCard[]; total: number }> {
  const cacheKey = REDIS_KEYS.BERITA.LATEST(page);
  const cached = await getCache<{ hits: BeritaCard[]; total: number }>(cacheKey);
  if (cached) return cached;

  const result = await searchDocuments<BeritaCard>(
    ELASTIC_INDICES.BERITA,
    { match_all: {} },
    {
      from: (page - 1) * limit,
      size: limit,
      sort: [{ published_at: { order: "desc" } }],
      _source: CARD_FIELDS,
    },
  );

  const data = { hits: result.hits, total: result.total };
  const ttl = page === 1 ? TTL.LATEST_P1 : TTL.LATEST_P2PLUS;
  await setCache(cacheKey, data, ttl);
  return data;
}

/**
 * Berita by SEO Slug — untuk halaman detail artikel publik.
 * Cache Redis: 10 menit.
 */
export async function getBeritaBySlug(
  slug: string,
): Promise<(NewsEsDocument & { id: string }) | null> {
  const cacheKey = REDIS_KEYS.BERITA.SINGLE_BY_SLUG(slug);
  const cached = await getCache<NewsEsDocument & { id: string }>(cacheKey);
  if (cached) return cached;

  const { hits } = await searchDocuments<NewsEsDocument>(
    ELASTIC_INDICES.BERITA,
    { term: { seo_slug: slug } },
    { size: 1 },
  );

  if (hits.length === 0) return null;

  const doc = hits[0] as NewsEsDocument & { id: string };
  await setCache(cacheKey, doc, TTL.BY_SLUG);
  return doc;
}

/**
 * Berita by Kategori Slug — paginated.
 * Cache Redis: 5 menit.
 */
export async function getBeritaByKategori(
  kategoriSlug: string,
  page = 1,
  limit = 20,
): Promise<{ hits: BeritaCard[]; total: number }> {
  const cacheKey = REDIS_KEYS.BERITA.BY_KATEGORI(kategoriSlug, page);
  const cached = await getCache<{ hits: BeritaCard[]; total: number }>(cacheKey);
  if (cached) return cached;

  const result = await searchDocuments<BeritaCard>(
    ELASTIC_INDICES.BERITA,
    { term: { kategori_slug: kategoriSlug } },
    {
      from: (page - 1) * limit,
      size: limit,
      sort: [{ published_at: { order: "desc" } }],
      _source: CARD_FIELDS,
    },
  );

  const data = { hits: result.hits, total: result.total };
  await setCache(cacheKey, data, TTL.BY_KATEGORI);
  return data;
}

/**
 * Full-text search berita — tanpa cache (hasil terlalu dinamis).
 * Boost: judul^3 > konten > seo_description > keywords > tags.
 */
export async function searchBerita(
  query: string,
  page = 1,
  limit = 20,
  kategoriSlug?: string,
): Promise<{ hits: BeritaCard[]; total: number }> {
  const filter: Record<string, unknown>[] = [];
  if (kategoriSlug) {
    filter.push({ term: { kategori_slug: kategoriSlug } });
  }

  const result = await searchDocuments<BeritaCard>(
    ELASTIC_INDICES.BERITA,
    {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ["judul^3", "konten", "seo_description", "keywords", "tags"],
              type: "best_fields",
              fuzziness: "AUTO",
            },
          },
        ],
        filter,
      },
    },
    {
      from: (page - 1) * limit,
      size: limit,
      sort: [
        { _score: { order: "desc" } },
        { published_at: { order: "desc" } },
      ],
      _source: CARD_FIELDS,
    },
  );

  return { hits: result.hits, total: result.total };
}
