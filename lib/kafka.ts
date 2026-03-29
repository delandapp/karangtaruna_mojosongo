import { Kafka, Consumer, Producer, logLevel, EachMessagePayload } from "kafkajs";

// ============================================================================
// Kafka Client Singleton
// ============================================================================

const globalForKafka = globalThis as unknown as {
  kafkaClient: Kafka | undefined;
};

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

export const kafka =
  globalForKafka.kafkaClient ??
  new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || "karangtaruna-app",
    brokers,
    logLevel: logLevel.ERROR,
    retry: {
      initialRetryTime: 300,
      retries: 10,
    },
  });

if (process.env.NODE_ENV !== "production") globalForKafka.kafkaClient = kafka;

// ============================================================================
// Debezium CDC Message Types
// ============================================================================

/** Debezium operation types */
export type DebeziumOperation = "c" | "u" | "d" | "r"; // create, update, delete, read (snapshot)

/** Structure of a Debezium CDC message payload */
export interface DebeziumPayload<T = Record<string, unknown>> {
  before: T | null;
  after: T | null;
  source: {
    version: string;
    connector: string;
    name: string;
    ts_ms: number;
    snapshot: string;
    db: string;
    schema: string;
    table: string;
  };
  op: DebeziumOperation;
  ts_ms: number;
}

// ============================================================================
// Consumer Factory
// ============================================================================

/**
 * Create a Kafka consumer dengan groupId tertentu
 */
export function createConsumer(groupId: string): Consumer {
  return kafka.consumer({
    groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 10000,
  });
}

/**
 * Create a Kafka producer
 */
export function createProducer(): Producer {
  return kafka.producer({
    allowAutoTopicCreation: false,
    transactionTimeout: 30000,
  });
}

// ============================================================================
// CDC Message Parser
// ============================================================================

/**
 * Parse Debezium CDC message dari Kafka
 * Returns null jika message tidak valid
 */
export function parseDebeziumMessage<T = Record<string, unknown>>(
  payload: EachMessagePayload,
): DebeziumPayload<T> | null {
  try {
    if (!payload.message.value) {
      return null;
    }

    const value = JSON.parse(payload.message.value.toString());

    // Debezium message bisa berupa envelope (with schema) atau plain payload
    // Handle kedua format
    const cdcPayload: DebeziumPayload<T> = value.payload || value;

    if (!cdcPayload.op) {
      console.warn(
        `[KAFKA_CDC] Message tanpa operation field dari topic: ${payload.topic}`,
      );
      return null;
    }

    return cdcPayload;
  } catch (error) {
    console.error(
      `[KAFKA_CDC_PARSE_ERROR] topic: ${payload.topic}, partition: ${payload.partition}`,
      error,
    );
    return null;
  }
}

/**
 * Helper: Cek apakah operasi CDC adalah create atau update (perlu sync ke ES/Redis)
 */
export function isUpsertOperation(op: DebeziumOperation): boolean {
  return op === "c" || op === "u" || op === "r";
}

/**
 * Helper: Cek apakah operasi CDC adalah delete
 */
export function isDeleteOperation(op: DebeziumOperation): boolean {
  return op === "d";
}

// ============================================================================
// Cache Producer Helpers
// Semua operasi cache (set / invalidate) harus melalui Kafka
// ============================================================================

let cacheProducer: Producer | null = null;
let cacheProducerConnecting = false;

/**
 * Get or create a singleton Kafka producer untuk cache operations.
 * Designed for serverless — reuses global instance in development,
 * creates fresh in production.
 */
async function getCacheProducer(): Promise<Producer> {
  if (cacheProducer) return cacheProducer;

  if (cacheProducerConnecting) {
    // Wait for existing connection attempt
    while (cacheProducerConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (cacheProducer) return cacheProducer;
  }

  cacheProducerConnecting = true;
  try {
    const producer = createProducer();
    await producer.connect();
    cacheProducer = producer;
    console.log("[KAFKA_PRODUCER] Cache producer connected");
    return producer;
  } finally {
    cacheProducerConnecting = false;
  }
}

/**
 * Publish a "set cache" message to Kafka.
 * The cache consumer will pick it up and set Redis.
 *
 * @param key - Redis cache key
 * @param value - Data to cache (will be JSON serialized)
 * @param ttlInSeconds - Optional TTL in seconds
 */
export async function produceCacheSet(
  key: string,
  value: any,
  ttlInSeconds?: number,
): Promise<void> {
  try {
    const producer = await getCacheProducer();
    const bigIntReplacer = (_k: string, v: unknown) =>
      typeof v === "bigint" ? Number(v) : v;

    await producer.send({
      topic: "karangtaruna.cache.set",
      messages: [
        {
          key: key,
          value: JSON.stringify({ key, value, ttl: ttlInSeconds }, bigIntReplacer),
        },
      ],
    });
  } catch (error) {
    console.error(`[KAFKA_CACHE_SET_ERROR] key: ${key}`, error);
  }
}

/**
 * Publish a "cache invalidate" message to Kafka.
 * The cache consumer will pick it up and delete matching Redis keys.
 *
 * @param prefix - Key prefix pattern to invalidate (e.g., "karangtaruna_master:levels:all:*")
 */
export async function produceCacheInvalidate(prefix: string): Promise<void> {
  try {
    const producer = await getCacheProducer();

    await producer.send({
      topic: "karangtaruna.cache.invalidate",
      messages: [
        {
          key: prefix,
          value: JSON.stringify({ prefix }),
        },
      ],
    });
  } catch (error) {
    console.error(`[KAFKA_CACHE_INVALIDATE_ERROR] prefix: ${prefix}`, error);
  }
}

/**
 * Disconnect cache producer gracefully
 */
export async function disconnectCacheProducer(): Promise<void> {
  if (cacheProducer) {
    try {
      await cacheProducer.disconnect();
      cacheProducer = null;
      console.log("[KAFKA_PRODUCER] Cache producer disconnected");
    } catch (error) {
      console.error("[KAFKA_PRODUCER] Error disconnecting:", error);
    }
  }
}
