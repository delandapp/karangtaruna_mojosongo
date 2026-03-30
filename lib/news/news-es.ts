/**
 * News Elasticsearch Index Management
 *
 * Mendefinisikan mapping yang dioptimasi untuk:
 *  - Full-text search (judul, konten)
 *  - Filter by kategori, tags
 *  - Sort by trending_score, total_views, published_at
 *  - Range filter by published_at
 */
import { ensureIndex, indexDocument } from "@/lib/elasticsearch";
import { ELASTIC_INDICES } from "@/lib/constants";

// ─── Index Mapping ────────────────────────────────────────────────────────────

const NEWS_INDEX_MAPPING = {
  mappings: {
    properties: {
      id: { type: "integer" },
      judul: { type: "text", analyzer: "standard" },
      konten: { type: "text", analyzer: "standard" },
      seo_description: { type: "text" },
      keywords: { type: "keyword" },
      kategori: { type: "keyword" },
      kategori_slug: { type: "keyword" },
      tags: { type: "keyword" },
      published_at: { type: "date" },
      total_views: { type: "long" },
      total_likes: { type: "integer" },
      trending_score: { type: "float" },
      cover_url: { type: "keyword", index: false },
      is_featured: { type: "boolean" },
      is_breaking_news: { type: "boolean" },
      seo_slug: { type: "keyword" },
    },
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
};

// ─── Document Type ────────────────────────────────────────────────────────────

export interface NewsEsDocument {
  [key: string]: unknown;
  id: number;
  judul: string;
  konten: string;
  seo_description: string | null;
  keywords: string[];
  kategori: string;
  kategori_slug: string;
  tags: string[];
  published_at: string | null;
  total_views: number;
  total_likes: number;
  trending_score: number;
  cover_url: string | null;
  is_featured: boolean;
  is_breaking_news: boolean;
  seo_slug: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Pastikan news index ada dengan mapping yang benar.
 * Dipanggil sekali saat consumer/startup.
 */
export async function ensureNewsIndex(): Promise<void> {
  await ensureIndex(ELASTIC_INDICES.BERITA, NEWS_INDEX_MAPPING);
}

/**
 * Index / upsert satu dokumen berita ke Elasticsearch.
 */
export async function indexNewsDocument(doc: NewsEsDocument): Promise<void> {
  await indexDocument(ELASTIC_INDICES.BERITA, doc.id, doc);
}
