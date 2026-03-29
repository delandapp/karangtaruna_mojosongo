import { Consumer, EachMessagePayload } from "kafkajs";
import {
  createConsumer,
  parseDebeziumMessage,
  isUpsertOperation,
  isDeleteOperation,
  DebeziumPayload,
  produceCacheSet,
  produceCacheInvalidate,
} from "@/lib/kafka";
import {
  indexDocument,
  deleteDocument,
  ensureIndex,
} from "@/lib/elasticsearch";
import { KAFKA_TOPICS, ELASTIC_INDICES, REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";

// ============================================================================
// CDC Handler Type
// ============================================================================

interface CdcHandlerConfig {
  /** Kafka topic (Debezium CDC) */
  topic: string;
  /** Elasticsearch index name */
  esIndex: string;
  /** Redis key generator for single item cache */
  redisSingleKey?: (id: number) => string;
  /** Redis prefix pattern for list cache invalidation */
  redisListPrefix?: string;
  /** Optional: transform document sebelum index ke ES */
  transformForEs?: (doc: Record<string, unknown>) => Record<string, unknown>;
}

// ============================================================================
// Topic → Handler Mapping
// Daftarkan semua CDC handler disini
// ============================================================================

const CDC_HANDLERS: CdcHandlerConfig[] = [
  // ── User & Access Management ──────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.USERS_CDC,
    esIndex: ELASTIC_INDICES.USERS,
    redisSingleKey: REDIS_KEYS.USERS.SINGLE,
    redisListPrefix: REDIS_KEYS.USERS.ALL_PREFIX,
  },
  {
    topic: KAFKA_TOPICS.LEVELS_CDC,
    esIndex: ELASTIC_INDICES.LEVELS,
    redisSingleKey: REDIS_KEYS.LEVELS.SINGLE,
    redisListPrefix: REDIS_KEYS.LEVELS.ALL_PREFIX,
  },
  {
    topic: KAFKA_TOPICS.JABATANS_CDC,
    esIndex: ELASTIC_INDICES.JABATANS,
    redisSingleKey: REDIS_KEYS.JABATANS.SINGLE,
    redisListPrefix: REDIS_KEYS.JABATANS.ALL_PREFIX,
  },
  {
    topic: KAFKA_TOPICS.HAK_AKSES_CDC,
    esIndex: ELASTIC_INDICES.HAK_AKSES,
    redisSingleKey: REDIS_KEYS.HAK_AKSES.SINGLE,
    redisListPrefix: REDIS_KEYS.HAK_AKSES.ALL_PREFIX,
  },

  // ── Organisasi ────────────────────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.ORGANISASI_CDC,
    esIndex: ELASTIC_INDICES.ORGANISASI,
    redisSingleKey: REDIS_KEYS.ORGANISASI.SINGLE,
    redisListPrefix: REDIS_KEYS.ORGANISASI.ALL_PREFIX,
  },

  // ── Event Management ─────────────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.EVENTS_CDC,
    esIndex: ELASTIC_INDICES.EVENTS,
    redisSingleKey: REDIS_KEYS.EVENTS.SINGLE,
    redisListPrefix: REDIS_KEYS.EVENTS.ALL_PREFIX,
  },

  // ── Keuangan ──────────────────────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.ANGGARAN_CDC,
    esIndex: ELASTIC_INDICES.ANGGARAN,
  },
  {
    topic: KAFKA_TOPICS.TRANSAKSI_KEUANGAN_CDC,
    esIndex: ELASTIC_INDICES.TRANSAKSI_KEUANGAN,
  },

  // ── Wilayah ───────────────────────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.PROVINSI_CDC,
    esIndex: ELASTIC_INDICES.PROVINSI,
    redisSingleKey: REDIS_KEYS.PROVINSI.SINGLE,
    redisListPrefix: REDIS_KEYS.PROVINSI.ALL_PREFIX,
  },
  {
    topic: KAFKA_TOPICS.KOTA_CDC,
    esIndex: ELASTIC_INDICES.KOTA,
    redisSingleKey: REDIS_KEYS.KOTA.SINGLE,
    redisListPrefix: REDIS_KEYS.KOTA.ALL_PREFIX,
  },
  {
    topic: KAFKA_TOPICS.KECAMATAN_CDC,
    esIndex: ELASTIC_INDICES.KECAMATAN,
    redisSingleKey: REDIS_KEYS.KECAMATAN.SINGLE,
    redisListPrefix: REDIS_KEYS.KECAMATAN.ALL_PREFIX,
  },
  {
    topic: KAFKA_TOPICS.KELURAHAN_CDC,
    esIndex: ELASTIC_INDICES.KELURAHAN,
    redisSingleKey: REDIS_KEYS.KELURAHAN.SINGLE,
    redisListPrefix: REDIS_KEYS.KELURAHAN.ALL_PREFIX,
  },

  // ── Sponsorship & Perusahaan ──────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.SEKTOR_INDUSTRI_CDC,
    esIndex: ELASTIC_INDICES.SEKTOR_INDUSTRI,
    redisSingleKey: REDIS_KEYS.SEKTOR_INDUSTRI.SINGLE,
    redisListPrefix: REDIS_KEYS.SEKTOR_INDUSTRI.ALL_PREFIX,
  },
  {
    topic: KAFKA_TOPICS.SKALA_PERUSAHAAN_CDC,
    esIndex: ELASTIC_INDICES.SKALA_PERUSAHAAN,
    redisSingleKey: REDIS_KEYS.SKALA_PERUSAHAAN.SINGLE,
    redisListPrefix: REDIS_KEYS.SKALA_PERUSAHAAN.ALL_PREFIX,
  },
  {
    topic: KAFKA_TOPICS.PERUSAHAAN_CDC,
    esIndex: ELASTIC_INDICES.PERUSAHAAN,
    redisSingleKey: REDIS_KEYS.PERUSAHAAN.SINGLE,
    redisListPrefix: REDIS_KEYS.PERUSAHAAN.ALL_PREFIX,
  },

  // ── Rapat ─────────────────────────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.RAPAT_CDC,
    esIndex: ELASTIC_INDICES.RAPAT,
    redisSingleKey: REDIS_KEYS.RAPAT.SINGLE,
    redisListPrefix: REDIS_KEYS.RAPAT.ALL_PREFIX,
  },

  // ── Dokumen & Surat ───────────────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.SURAT_CDC,
    esIndex: ELASTIC_INDICES.SURAT,
  },
  {
    topic: KAFKA_TOPICS.DOKUMEN_CDC,
    esIndex: ELASTIC_INDICES.DOKUMEN,
  },
  {
    topic: KAFKA_TOPICS.LAPORAN_CDC,
    esIndex: ELASTIC_INDICES.LAPORAN,
  },

  // ── Promosi ───────────────────────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.BERITA_CDC,
    esIndex: ELASTIC_INDICES.BERITA,
  },
  {
    topic: KAFKA_TOPICS.KALENDER_KONTEN_CDC,
    esIndex: ELASTIC_INDICES.KALENDER_KONTEN,
  },

  // ── Feedback ──────────────────────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.SURVEI_KEPUASAN_CDC,
    esIndex: ELASTIC_INDICES.SURVEI_KEPUASAN,
  },

  // ── Tiket ─────────────────────────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.TIKET_ORDER_CDC,
    esIndex: ELASTIC_INDICES.TIKET_ORDER,
  },

  // ── E-Proposal ────────────────────────────────────────────────────────
  {
    topic: KAFKA_TOPICS.EPROPOSAL_CDC,
    esIndex: ELASTIC_INDICES.EPROPOSAL,
  },
];

// ============================================================================
// CDC Consumer Service
// ============================================================================

let consumer: Consumer | null = null;
let isRunning = false;

/**
 * Process satu CDC message: sync ke Elasticsearch + invalidate/update Redis
 */
async function processCdcMessage(
  handler: CdcHandlerConfig,
  payload: EachMessagePayload,
): Promise<void> {
  const cdcPayload = parseDebeziumMessage(payload);
  if (!cdcPayload) return;

  const { op, before, after } = cdcPayload;

  if (isUpsertOperation(op) && after) {
    const doc = handler.transformForEs
      ? handler.transformForEs(after as Record<string, unknown>)
      : (after as Record<string, unknown>);

    const id = (after as any).id;
    if (!id) {
      console.warn(
        `[CDC_CONSUMER] Document tanpa 'id' field dari topic: ${handler.topic}`,
      );
      return;
    }

    // 1. Sync ke Elasticsearch
    await indexDocument(handler.esIndex, id, doc);

    // 2. Update Redis single-item cache via Kafka
    if (handler.redisSingleKey) {
      await produceCacheSet(handler.redisSingleKey(id), doc, DEFAULT_CACHE_TTL);
    }

    // 3. Invalidate Redis list cache via Kafka (karena data berubah)
    if (handler.redisListPrefix) {
      await produceCacheInvalidate(handler.redisListPrefix);
    }

    console.log(
      `[CDC_CONSUMER] ${op === "c" ? "CREATED" : op === "u" ? "UPDATED" : "SNAPSHOT"} → ES:${handler.esIndex} id:${id}`,
    );
  } else if (isDeleteOperation(op) && before) {
    const id = (before as any).id;
    if (!id) return;

    // 1. Delete dari Elasticsearch
    await deleteDocument(handler.esIndex, id);

    // 2. Delete Redis single-item cache via Kafka
    if (handler.redisSingleKey) {
      await produceCacheSet(handler.redisSingleKey(id), null, 1); // Set to null with 1s TTL = effectively delete
    }

    // 3. Invalidate Redis list cache via Kafka
    if (handler.redisListPrefix) {
      await produceCacheInvalidate(handler.redisListPrefix);
    }

    console.log(
      `[CDC_CONSUMER] DELETED → ES:${handler.esIndex} id:${id}`,
    );
  }
}

/**
 * Start CDC Consumer
 * Subscribe ke semua registered Kafka topics dan process messages
 */
export async function startCdcConsumer(): Promise<void> {
  if (isRunning) {
    console.log("[CDC_CONSUMER] Already running, skipping...");
    return;
  }

  try {
    consumer = createConsumer(
      process.env.KAFKA_GROUP_ID || "karangtaruna-cdc-consumer",
    );

    await consumer.connect();
    console.log("[CDC_CONSUMER] Connected to Kafka");

    // Build topic → handler lookup map
    const handlerMap = new Map<string, CdcHandlerConfig>();
    const topics: string[] = [];

    for (const handler of CDC_HANDLERS) {
      handlerMap.set(handler.topic, handler);
      topics.push(handler.topic);

      // Ensure Elasticsearch index exists
      await ensureIndex(handler.esIndex);
    }

    // Subscribe to all CDC topics
    await consumer.subscribe({
      topics,
      fromBeginning: false,
    });

    console.log(
      `[CDC_CONSUMER] Subscribed to ${topics.length} CDC topics`,
    );

    // Process messages
    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const handler = handlerMap.get(payload.topic);
        if (!handler) {
          console.warn(
            `[CDC_CONSUMER] No handler found for topic: ${payload.topic}`,
          );
          return;
        }

        await processCdcMessage(handler, payload);
      },
    });

    isRunning = true;
    console.log("[CDC_CONSUMER] Running and processing CDC events...");
  } catch (error) {
    console.error("[CDC_CONSUMER] Failed to start:", error);
    throw error;
  }
}

/**
 * Stop CDC Consumer gracefully
 */
export async function stopCdcConsumer(): Promise<void> {
  if (consumer) {
    try {
      await consumer.disconnect();
      consumer = null;
      isRunning = false;
      console.log("[CDC_CONSUMER] Disconnected gracefully");
    } catch (error) {
      console.error("[CDC_CONSUMER] Error during disconnect:", error);
    }
  }
}

/**
 * Get current consumer status
 */
export function getCdcConsumerStatus(): {
  isRunning: boolean;
  topicCount: number;
  topics: string[];
} {
  return {
    isRunning,
    topicCount: CDC_HANDLERS.length,
    topics: CDC_HANDLERS.map((h) => h.topic),
  };
}
