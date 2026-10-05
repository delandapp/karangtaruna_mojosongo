/**
 * ============================================================
 * News Published Handler
 * ============================================================
 *
 * Fungsi handleNewsPublished() dipanggil saat berita dibuat / diupdate / dipublish.
 * Menginvalidasi Redis cache yang relevan.
 */

import { invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS } from "@/lib/constants";
import type { NewsPublishedPayload } from "./news-kafka";

/**
 * Invalidasi cache Redis saat berita dipublish / diperbarui.
 */
export async function handleNewsPublished(
  payload: NewsPublishedPayload,
): Promise<void> {
  try {
    // Invalidate Redis caches yang relevan
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
      `[NEWS_PUBLISHED] ✅ Invalidated cache for berita id:${payload.id} slug:${payload.seo_slug}`,
    );
  } catch (error) {
    console.error(
      `[NEWS_PUBLISHED] ❌ Failed to invalidate cache for berita id:${payload.id}`,
      error,
    );
  }
}

/**
 * @deprecated Kafka telah dihapus. Fungsi ini adalah no-op.
 */
export async function startNewsPublishedConsumer(): Promise<void> {
  // no-op
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
  return { isRunning: false, topic: "n/a" };
}
