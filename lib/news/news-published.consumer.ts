/**
 * News Published Consumer
 *
 * Subscribe ke topic 'karangtaruna.news.published' dan mengindex
 * dokumen berita kaya ke Elasticsearch.
 *
 * Bedanya dengan CDC consumer (cdc-consumer.ts):
 *  - CDC: sync raw table row (tanpa join) → hanya data dari 1 tabel
 *  - News Published: payload sudah include join (kategori nama, tag names, cover URL)
 *    → dokumen kaya yang dioptimasi untuk search portal publik
 *
 * Dijalankan via: scripts/StartNewsConsumer.ts
 */
import type { Consumer, EachMessagePayload } from "kafkajs";
import { createConsumer, produceCacheInvalidate } from "@/lib/kafka";
import { indexNewsDocument, ensureNewsIndex } from "./news-es";
import { KAFKA_TOPICS, REDIS_KEYS } from "@/lib/constants";
import type { NewsPublishedPayload } from "./news-kafka";

// ─── Config ───────────────────────────────────────────────────────────────────

const GROUP_ID =
  process.env.KAFKA_NEWS_PUBLISHED_GROUP_ID ??
  "karangtaruna-news-published-indexer";

// ─── State ────────────────────────────────────────────────────────────────────

let consumer: Consumer | null = null;
let isRunning = false;

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Proses satu event NEWS_PUBLISHED:
 *  1. Index dokumen kaya ke Elasticsearch
 *  2. Invalidate semua Redis cache yang relevan
 */
async function handleNewsPublished(payload: NewsPublishedPayload): Promise<void> {
  // 1. Index ke Elasticsearch dengan dokumen lengkap (hasil join)
  await indexNewsDocument({
    id:              payload.id,
    judul:           payload.judul,
    konten:          payload.konten_plaintext,
    seo_description: payload.seo_description,
    keywords:        payload.seo_keywords,
    kategori:        payload.kategori,
    kategori_slug:   payload.kategori_slug,
    tags:            payload.tags,
    published_at:    payload.published_at
      ? new Date(payload.published_at).toISOString()
      : null,
    total_views:     payload.total_views,
    total_likes:     payload.total_likes,
    trending_score:  payload.trending_score,
    cover_url:       payload.cover_url,
    is_featured:     false,
    is_breaking_news: false,
    seo_slug:        payload.seo_slug,
  });

  // 2. Invalidate Redis caches yang relevan
  await produceCacheInvalidate(REDIS_KEYS.BERITA.SINGLE(payload.id));
  await produceCacheInvalidate(REDIS_KEYS.BERITA.SINGLE_BY_SLUG(payload.seo_slug));
  await produceCacheInvalidate(REDIS_KEYS.BERITA.ALL_PREFIX);
  await produceCacheInvalidate(REDIS_KEYS.BERITA.TRENDING);
  await produceCacheInvalidate(REDIS_KEYS.BERITA.TOP);
  await produceCacheInvalidate(
    REDIS_KEYS.BERITA.BY_KATEGORI(payload.kategori_slug, 1),
  );

  console.log(
    `[NEWS_PUBLISHED] Indexed berita id:${payload.id} slug:${payload.seo_slug}`,
  );
}

// ─── Consumer Lifecycle ───────────────────────────────────────────────────────

/**
 * Mulai news published consumer.
 * Dipanggil dari scripts/StartNewsConsumer.ts
 */
export async function startNewsPublishedConsumer(): Promise<void> {
  if (isRunning) {
    console.log("[NEWS_PUBLISHED] Already running, skipping...");
    return;
  }

  try {
    // Pastikan ES index ada dengan mapping yang benar sebelum mulai consume
    await ensureNewsIndex();

    consumer = createConsumer(GROUP_ID);
    await consumer.connect();
    console.log("[NEWS_PUBLISHED] Connected to Kafka");

    await consumer.subscribe({
      topics: [KAFKA_TOPICS.NEWS_PUBLISHED],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        if (!message.value) return;

        try {
          const msg = JSON.parse(message.value.toString());
          // message format: { event, timestamp, payload }
          const data = msg.payload as NewsPublishedPayload;
          await handleNewsPublished(data);
        } catch (error) {
          console.error("[NEWS_PUBLISHED] Process error:", error);
        }
      },
    });

    isRunning = true;
    console.log("[NEWS_PUBLISHED] Running and indexing news events...");
  } catch (error) {
    console.error("[NEWS_PUBLISHED] Failed to start:", error);
    throw error;
  }
}

/**
 * Stop news published consumer gracefully.
 */
export async function stopNewsPublishedConsumer(): Promise<void> {
  if (consumer) {
    try {
      await consumer.disconnect();
      consumer = null;
      isRunning = false;
      console.log("[NEWS_PUBLISHED] Disconnected gracefully");
    } catch (error) {
      console.error("[NEWS_PUBLISHED] Disconnect error:", error);
    }
  }
}

export function getNewsPublishedConsumerStatus(): {
  isRunning: boolean;
  topic: string;
} {
  return { isRunning, topic: KAFKA_TOPICS.NEWS_PUBLISHED };
}
