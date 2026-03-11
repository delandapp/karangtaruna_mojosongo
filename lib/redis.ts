import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

// Pastikan REDIS_URL tersedia di environment
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis =
  globalForRedis.redis ??
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
  });

// Handle global Error event untuk mencegah server crash akibat connection failure
redis.on("error", (error) => {
  console.error("[REDIS_ERROR]", error);
  // Optional: kita bisa ignore, server bisa berjalan fallback fetching DB kalau implementasi get() ada fallback manual
});

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

/**
 * Helper to safely get from Redis and parse JSON
 * Return null if redis fail / key not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`[REDIS_GET_ERROR] key: ${key}`, error);
    return null; // Fallback to DB
  }
}

/**
 * Helper to safely set stringified JSON to Redis with TTL
 */
export async function setCache(
  key: string,
  value: any,
  ttlInSeconds?: number,
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlInSeconds) {
      await redis.set(key, serialized, "EX", ttlInSeconds);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    console.error(`[REDIS_SET_ERROR] key: ${key}`, error);
  }
}

/**
 * Helper to safely delete cache keys handling wildcard invalidation
 */
export async function invalidateCachePrefix(prefix: string): Promise<void> {
  try {
    // Use wildcard pattern so all keys that START WITH prefix are matched
    const pattern = prefix.endsWith("*") ? prefix : `${prefix}*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`[REDIS_INVALIDATE_ERROR] prefix: ${prefix}`, error);
  }
}
