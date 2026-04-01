/**
 * ============================================================
 * View Counter — In-Memory Buffer + Direct DB/ES Flush
 * ============================================================
 * Kafka telah dihapus. View counting sekarang menggunakan:
 *  1. In-memory buffer (Map<beritaId, count>)
 *  2. Interval flush setiap 10 detik → langsung UPDATE ke DB + ES
 *  3. bufferView() dipanggil langsung dari API route view
 *
 * Pattern: Eventual Consistency
 *  Counter di DB mungkin lag ~10 detik dari realtime, tapi acceptable
 *  untuk portal berita.
 * ============================================================
 */

import { prisma } from "@/lib/prisma";
import { elasticClient } from "@/lib/elasticsearch";
import { invalidateCachePrefix } from "@/lib/redis";
import { ELASTIC_INDICES, REDIS_KEYS } from "@/lib/constants";

// ─── Config ───────────────────────────────────────────────────────────────────

const FLUSH_INTERVAL_MS = 10_000; // 10 detik

// ─── State ────────────────────────────────────────────────────────────────────

let isRunning = false;
let flushTimer: ReturnType<typeof setInterval> | null = null;

/** In-memory buffer: beritaId → jumlah view yang belum di-flush */
const viewBuffer = new Map<number, number>();

// ─── Buffer Operations ────────────────────────────────────────────────────────

/**
 * Tambahkan 1 view ke buffer untuk berita tertentu.
 * Dipanggil langsung dari POST /api/berita/[id]/view saat isCounted = true.
 */
export function bufferView(beritaId: number): void {
  viewBuffer.set(beritaId, (viewBuffer.get(beritaId) ?? 0) + 1);
}

/**
 * Snapshot buffer → clear → batch update DB + ES.
 * Snapshot dilakukan di awal agar view yang masuk saat flush tidak hilang.
 */
export async function flushToDatabase(): Promise<void> {
  if (viewBuffer.size === 0) return;

  const updates = Array.from(viewBuffer.entries());
  viewBuffer.clear();

  console.log(
    `[VIEW_COUNTER] Flushing ${updates.length} berita view counts...`,
  );

  // ── 1. Batch UPDATE ke PostgreSQL ─────────────────────────────────────────
  for (const [beritaId, count] of updates) {
    try {
      await prisma.$executeRaw`
        UPDATE c_berita
        SET total_views       = total_views + ${count},
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

  // ── 2. Bulk UPDATE ke Elasticsearch (script update) ───────────────────────
  try {
    const body = updates.flatMap(([id, count]) => [
      { update: { _index: ELASTIC_INDICES.BERITA, _id: String(id) } },
      {
        script: {
          source: "ctx._source.total_views += params.count",
          params: { count },
        },
        upsert: { total_views: count },
      },
    ]);

    if (body.length > 0) {
      await elasticClient.bulk({ body, refresh: false });
    }
  } catch (error) {
    console.error("[VIEW_COUNTER] ES bulk update failed:", error);
  }

  // ── 3. Invalidasi Redis cache untuk setiap berita yang diupdate ───────────
  for (const [beritaId] of updates) {
    try {
      await invalidateCachePrefix(REDIS_KEYS.BERITA.SINGLE(beritaId));
    } catch (error) {
      console.error(
        `[VIEW_COUNTER] Redis invalidate failed for berita ${beritaId}:`,
        error,
      );
    }
  }

  // Invalidate trending & top — ranking bisa berubah
  try {
    await invalidateCachePrefix(REDIS_KEYS.BERITA.TRENDING);
    await invalidateCachePrefix(REDIS_KEYS.BERITA.TOP);
  } catch (error) {
    console.error(
      "[VIEW_COUNTER] Redis invalidate trending/top failed:",
      error,
    );
  }

  console.log("[VIEW_COUNTER] Flush complete.");
}

// ─── Worker Lifecycle ─────────────────────────────────────────────────────────

/**
 * Mulai view counter worker (interval flush).
 * Dipanggil dari scripts/StartNewsConsumer.ts
 */
export function startViewCounterWorker(): void {
  if (isRunning) {
    console.log("[VIEW_COUNTER] Already running, skipping...");
    return;
  }

  flushTimer = setInterval(() => {
    flushToDatabase().catch((err) =>
      console.error("[VIEW_COUNTER] Flush error:", err),
    );
  }, FLUSH_INTERVAL_MS);

  isRunning = true;
  console.log(
    `[VIEW_COUNTER] Started. Flushing every ${FLUSH_INTERVAL_MS / 1000}s.`,
  );
}

/**
 * Stop worker — flush sisa buffer sebelum berhenti.
 */
export async function stopViewCounterWorker(): Promise<void> {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  // Pastikan semua view ter-flush sebelum shutdown
  await flushToDatabase();

  isRunning = false;
  console.log("[VIEW_COUNTER] Stopped gracefully.");
}

export function getViewCounterStatus(): {
  isRunning: boolean;
  bufferSize: number;
} {
  return { isRunning, bufferSize: viewBuffer.size };
}

// ─── Legacy aliases (backward compat dengan StartNewsConsumer.ts) ─────────────

/** @deprecated Gunakan startViewCounterWorker() */
export const startViewCounterConsumer = startViewCounterWorker;

/** @deprecated Gunakan stopViewCounterWorker() */
export const stopViewCounterConsumer = stopViewCounterWorker;
