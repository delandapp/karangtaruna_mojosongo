/**
 * View Counter Consumer
 *
 * Subscribe ke topic 'karangtaruna.news.viewed' dan mengumpulkan view events
 * dalam buffer di-memory, lalu flush ke PostgreSQL + Elasticsearch setiap 10 detik.
 *
 * Kenapa batching?
 *  - Artikel populer bisa menerima ratusan view/detik
 *  - Tanpa batching → ratusan UPDATE query/detik → DB overload
 *  - Dengan batching → max 1 UPDATE per artikel per 10 detik
 *
 * Pattern: Eventual Consistency
 *  Counter di DB mungkin lag ~10 detik dari realtime, tapi acceptable untuk portal berita.
 */
import type { Consumer, EachMessagePayload } from "kafkajs";
import { createConsumer, produceCacheInvalidate } from "@/lib/kafka";
import { prisma } from "@/lib/prisma";
import { elasticClient } from "@/lib/elasticsearch";
import { KAFKA_TOPICS, ELASTIC_INDICES, REDIS_KEYS } from "@/lib/constants";
import type { NewsViewedPayload } from "./news-kafka";

// ─── Config ───────────────────────────────────────────────────────────────────

const FLUSH_INTERVAL_MS = 10_000; // 10 detik
const GROUP_ID =
  process.env.KAFKA_VIEW_COUNTER_GROUP_ID ?? "karangtaruna-view-counter";

// ─── State ────────────────────────────────────────────────────────────────────

let consumer: Consumer | null = null;
let isRunning = false;
let flushTimer: ReturnType<typeof setInterval> | null = null;

/** In-memory buffer: beritaId → jumlah view yang belum di-flush */
const viewBuffer = new Map<number, number>();

// ─── Buffer Operations ────────────────────────────────────────────────────────

function bufferView(beritaId: number): void {
  viewBuffer.set(beritaId, (viewBuffer.get(beritaId) ?? 0) + 1);
}

/**
 * Snapshot buffer → clear → batch update DB + ES.
 * Snapshot dilakukan di awal agar view yang masuk saat flush tidak hilang.
 */
async function flushToDatabase(): Promise<void> {
  if (viewBuffer.size === 0) return;

  const updates = Array.from(viewBuffer.entries());
  viewBuffer.clear();

  console.log(`[VIEW_COUNTER] Flushing ${updates.length} berita view counts...`);

  // ── 1. Batch UPDATE ke PostgreSQL ──────────────────────────────────────
  for (const [beritaId, count] of updates) {
    try {
      await prisma.$executeRaw`
        UPDATE c_berita
        SET total_views      = total_views + ${count},
            "diperbarui_pada" = NOW()
        WHERE id              = ${beritaId}
          AND "dihapus_pada" IS NULL
      `;
    } catch (error) {
      console.error(
        `[VIEW_COUNTER] DB update failed for berita ${beritaId}:`,
        error,
      );
    }
  }

  // ── 2. Bulk UPDATE ke Elasticsearch (script update) ────────────────────
  try {
    const body = updates.flatMap(([id, count]) => [
      { update: { _index: ELASTIC_INDICES.BERITA, _id: String(id) } },
      {
        script: {
          source: "ctx._source.total_views += params.count",
          params: { count },
        },
      },
    ]);

    if (body.length > 0) {
      await elasticClient.bulk({ body, refresh: false });
    }
  } catch (error) {
    console.error("[VIEW_COUNTER] ES bulk update failed:", error);
  }

  // ── 3. Invalidate Redis cache untuk setiap berita yang diupdate ─────────
  for (const [beritaId] of updates) {
    await produceCacheInvalidate(REDIS_KEYS.BERITA.SINGLE(beritaId));
  }

  // Invalidate trending & top — score / ranking bisa berubah
  await produceCacheInvalidate(REDIS_KEYS.BERITA.TRENDING);
  await produceCacheInvalidate(REDIS_KEYS.BERITA.TOP);

  console.log("[VIEW_COUNTER] Flush complete.");
}

// ─── Consumer Lifecycle ───────────────────────────────────────────────────────

/**
 * Mulai view counter consumer.
 * Dipanggil dari scripts/StartNewsConsumer.ts
 */
export async function startViewCounterConsumer(): Promise<void> {
  if (isRunning) {
    console.log("[VIEW_COUNTER] Already running, skipping...");
    return;
  }

  try {
    consumer = createConsumer(GROUP_ID);
    await consumer.connect();
    console.log("[VIEW_COUNTER] Connected to Kafka");

    await consumer.subscribe({
      topics: [KAFKA_TOPICS.NEWS_VIEWED],
      fromBeginning: false,
    });

    // Mulai flush interval
    flushTimer = setInterval(flushToDatabase, FLUSH_INTERVAL_MS);

    await consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        if (!message.value) return;
        try {
          const data = JSON.parse(
            message.value.toString(),
          ) as NewsViewedPayload;
          bufferView(data.berita_id);
        } catch (error) {
          console.error("[VIEW_COUNTER] Parse error:", error);
        }
      },
    });

    isRunning = true;
    console.log("[VIEW_COUNTER] Running and buffering view events...");
  } catch (error) {
    console.error("[VIEW_COUNTER] Failed to start:", error);
    throw error;
  }
}

/**
 * Stop consumer — flush sisa buffer sebelum disconnect.
 */
export async function stopViewCounterConsumer(): Promise<void> {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  // Pastikan semua view ter-flush sebelum shutdown
  await flushToDatabase();

  if (consumer) {
    try {
      await consumer.disconnect();
      consumer = null;
      isRunning = false;
      console.log("[VIEW_COUNTER] Disconnected gracefully");
    } catch (error) {
      console.error("[VIEW_COUNTER] Disconnect error:", error);
    }
  }
}

export function getViewCounterStatus(): {
  isRunning: boolean;
  bufferSize: number;
} {
  return { isRunning, bufferSize: viewBuffer.size };
}
