/**
 * ============================================================
 * News Published Handler
 * (Kafka telah dihapus — indexing dilakukan langsung ke ES)
 * ============================================================
 *
 * Fungsi handleNewsPublished() dipanggil langsung dari API route
 * saat berita dibuat / diupdate / dipublish, tanpa perantara Kafka.
 *
 * Flow:
 *  1. Index dokumen berita kaya (dengan join) ke Elasticsearch
 *  2. Invalidasi Redis cache yang relevan
 */

import { indexNewsDocument, ensureNewsIndex } from "./news-es";
import { invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS } from "@/lib/constants";
import type { NewsPublishedPayload } from "./news-kafka";

// ─── State ────────────────────────────────────────────────────────────────────

let isInitialized = false;

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * Pastikan Elasticsearch news index sudah ada sebelum pertama kali indexing.
 * Dipanggil lazy — hanya sekali.
 */
async function ensureInitialized(): Promise<void> {
  if (isInitialized) return;
  await ensureNewsIndex();
  isInitialized = true;
}

// ─── Core Handler ─────────────────────────────────────────────────────────────

/**
 * Index satu dokumen berita kaya ke Elasticsearch dan invalidasi cache Redis.
 *
 * Dipanggil langsung dari API route (POST/PUT /api/berita) setelah
 * data berhasil disimpan ke database.
 */
export async function handleNewsPublished(
  payload: NewsPublishedPayload,
): Promise<void> {
  try {
    await ensureInitialized();

    // 1. Index ke Elasticsearch dengan dokumen lengkap (hasil join)
    await indexNewsDocument({
      id: payload.id,
      judul: payload.judul,
      konten: payload.konten_plaintext,
      seo_description: payload.seo_description,
      keywords: payload.seo_keywords,
      kategori: payload.kategori,
      kategori_slug: payload.kategori_slug,
      tags: payload.tags,
      published_at: payload.published_at
        ? new Date(payload.published_at).toISOString()
        : null,
      total_views: payload.total_views,
      total_likes: payload.total_likes,
      trending_score: payload.trending_score,
      cover_url: payload.cover_url,
      is_featured: false,
      is_breaking_news: false,
      seo_slug: payload.seo_slug,
    });

    // 2. Invalidate Redis caches yang relevan
    await invalidateCachePrefix(REDIS_KEYS.BERITA.SINGLE(payload.id));
    await invalidateCachePrefix(
      REDIS_KEYS.BERITA.SINGLE_BY_SLUG(payload.seo_slug),
    );
    await invalidateCachePrefix(REDIS_KEYS.BERITA.ALL_PREFIX);
    await invalidateCachePrefix(REDIS_KEYS.BERITA.TRENDING);
    await invalidateCachePrefix(REDIS_KEYS.BERITA.TOP);
    await invalidateCachePrefix(
      REDIS_KEYS.BERITA.BY_KATEGORI(payload.kategori_slug, 1),
    );

    console.log(
      `[NEWS_PUBLISHED] ✅ Indexed berita id:${payload.id} slug:${payload.seo_slug}`,
    );
  } catch (error) {
    console.error(
      `[NEWS_PUBLISHED] ❌ Failed to index berita id:${payload.id}`,
      error,
    );
    // Tidak di-throw agar kegagalan ES tidak membatalkan respons API
  }
}

// ─── Legacy Lifecycle Stubs (backward-compat dengan StartNewsConsumer.ts) ─────

/**
 * @deprecated Kafka telah dihapus. Fungsi ini adalah no-op.
 */
export async function startNewsPublishedConsumer(): Promise<void> {
  console.log(
    "[NEWS_PUBLISHED] Kafka consumer dihapus. Indexing dilakukan langsung dari API route.",
  );
}

/**
 * @deprecated Kafka telah dihapus. Fungsi ini adalah no-op.
 */
export async function stopNewsPublishedConsumer(): Promise<void> {
  // no-op
}

export function getNewsPublishedConsumerStatus(): {
  isRunning: boolean;
  topic: string;
} {
  return { isRunning: false, topic: "n/a (kafka removed)" };
}
