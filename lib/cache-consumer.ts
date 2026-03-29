import { Consumer, EachMessagePayload } from "kafkajs";
import { createConsumer } from "@/lib/kafka";
import { redis } from "@/lib/redis";
import { KAFKA_TOPICS } from "@/lib/constants";

// ============================================================================
// Cache Consumer
// Semua operasi Redis (set / invalidate) diterima dari Kafka,
// bukan dipanggil langsung oleh CDC consumer atau API routes.
// ============================================================================

let consumer: Consumer | null = null;
let isRunning = false;

/**
 * Process satu cache message dari Kafka
 */
async function processCacheMessage(payload: EachMessagePayload): Promise<void> {
  if (!payload.message.value) return;

  try {
    const message = JSON.parse(payload.message.value.toString());
    const topic = payload.topic;

    if (topic === KAFKA_TOPICS.CACHE_SET) {
      const { key, value, ttl } = message;
      if (!key || value === undefined) {
        console.warn("[CACHE_CONSUMER] Invalid cache set message:", message);
        return;
      }

      const bigIntReplacer = (_k: string, v: unknown) =>
        typeof v === "bigint" ? Number(v) : v;
      const serialized = JSON.stringify(value, bigIntReplacer);

      if (ttl) {
        await redis.set(key, serialized, "EX", ttl);
      } else {
        await redis.set(key, serialized);
      }
    } else if (topic === KAFKA_TOPICS.CACHE_INVALIDATE) {
      const { prefix } = message;
      if (!prefix) {
        console.warn("[CACHE_CONSUMER] Invalid cache invalidate message:", message);
        return;
      }

      const pattern = prefix.endsWith("*") ? prefix : `${prefix}*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (error) {
    console.error(
      `[CACHE_CONSUMER_ERROR] topic: ${payload.topic}, partition: ${payload.partition}`,
      error,
    );
  }
}

/**
 * Start Cache Consumer
 * Subscribe ke cache Kafka topics dan process messages
 */
export async function startCacheConsumer(): Promise<void> {
  if (isRunning) {
    console.log("[CACHE_CONSUMER] Already running, skipping...");
    return;
  }

  try {
    consumer = createConsumer(
      process.env.KAFKA_CACHE_GROUP_ID || "karangtaruna-cache-consumer",
    );

    await consumer.connect();
    console.log("[CACHE_CONSUMER] Connected to Kafka");

    await consumer.subscribe({
      topics: [KAFKA_TOPICS.CACHE_SET, KAFKA_TOPICS.CACHE_INVALIDATE],
      fromBeginning: false,
    });

    console.log("[CACHE_CONSUMER] Subscribed to cache topics");

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await processCacheMessage(payload);
      },
    });

    isRunning = true;
    console.log("[CACHE_CONSUMER] Running and processing cache events...");
  } catch (error) {
    console.error("[CACHE_CONSUMER] Failed to start:", error);
    throw error;
  }
}

/**
 * Stop Cache Consumer gracefully
 */
export async function stopCacheConsumer(): Promise<void> {
  if (consumer) {
    try {
      await consumer.disconnect();
      consumer = null;
      isRunning = false;
      console.log("[CACHE_CONSUMER] Disconnected gracefully");
    } catch (error) {
      console.error("[CACHE_CONSUMER] Error during disconnect:", error);
    }
  }
}

/**
 * Get current cache consumer status
 */
export function getCacheConsumerStatus(): {
  isRunning: boolean;
  topics: string[];
} {
  return {
    isRunning,
    topics: [KAFKA_TOPICS.CACHE_SET, KAFKA_TOPICS.CACHE_INVALIDATE],
  };
}
