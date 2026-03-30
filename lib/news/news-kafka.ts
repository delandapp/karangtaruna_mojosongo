/**
 * News Domain Kafka Producers
 *
 * Domain events diproduce manual dari API (bukan CDC otomatis Debezium).
 *
 * Topics:
 *  - karangtaruna.news.published → trigger ES indexing dengan payload kaya (join)
 *  - karangtaruna.news.viewed    → dikonsumsi view-counter consumer (batching)
 */
import { createProducer } from "@/lib/kafka";
import { KAFKA_TOPICS } from "@/lib/constants";
import type { Producer } from "kafkajs";

// ─── Singleton producer untuk news domain ────────────────────────────────────

let newsProducer: Producer | null = null;
let isConnecting = false;

async function getNewsProducer(): Promise<Producer> {
  if (newsProducer) return newsProducer;

  if (isConnecting) {
    while (isConnecting) await new Promise((r) => setTimeout(r, 100));
    if (newsProducer) return newsProducer;
  }

  isConnecting = true;
  try {
    const producer = createProducer();
    await producer.connect();
    newsProducer = producer;
    console.log("[NEWS_KAFKA] Producer connected");
    return producer;
  } finally {
    isConnecting = false;
  }
}

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface NewsPublishedPayload {
  id: number;
  judul: string;
  konten_plaintext: string;
  seo_slug: string;
  seo_description: string | null;
  seo_keywords: string[];
  kategori: string;
  kategori_slug: string;
  tags: string[];
  published_at: Date | null;
  total_views: number;
  total_likes: number;
  trending_score: number;
  cover_url: string | null;
}

export interface NewsViewedPayload {
  berita_id: number;
  timestamp: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const bigIntReplacer = (_k: string, v: unknown) =>
  typeof v === "bigint" ? Number(v) : v;

// ─── Producers ────────────────────────────────────────────────────────────────

/**
 * Produce event saat berita dipublish atau diupdate.
 * Consumer (news-published.consumer.ts) akan mengindex dokumen kaya ke Elasticsearch.
 */
export async function produceNewsPublished(
  payload: NewsPublishedPayload,
): Promise<void> {
  try {
    const producer = await getNewsProducer();
    await producer.send({
      topic: KAFKA_TOPICS.NEWS_PUBLISHED,
      messages: [
        {
          key: String(payload.id),
          value: JSON.stringify(
            {
              event: "NEWS_PUBLISHED",
              timestamp: new Date().toISOString(),
              payload,
            },
            bigIntReplacer,
          ),
        },
      ],
    });
  } catch (error) {
    console.error("[NEWS_KAFKA] produceNewsPublished error:", error);
  }
}

/**
 * Produce event saat user melihat berita.
 * Dikonsumsi oleh view-counter.consumer.ts dengan batching setiap 10 detik.
 */
export async function produceNewsViewed(beritaId: number): Promise<void> {
  try {
    const producer = await getNewsProducer();
    await producer.send({
      topic: KAFKA_TOPICS.NEWS_VIEWED,
      messages: [
        {
          key: String(beritaId),
          value: JSON.stringify({
            berita_id: beritaId,
            timestamp: Date.now(),
          } satisfies NewsViewedPayload),
        },
      ],
    });
  } catch (error) {
    console.error("[NEWS_KAFKA] produceNewsViewed error:", error);
  }
}

/**
 * Disconnect news producer gracefully (panggil saat shutdown).
 */
export async function disconnectNewsProducer(): Promise<void> {
  if (newsProducer) {
    try {
      await newsProducer.disconnect();
      newsProducer = null;
      console.log("[NEWS_KAFKA] Producer disconnected");
    } catch (error) {
      console.error("[NEWS_KAFKA] Disconnect error:", error);
    }
  }
}
