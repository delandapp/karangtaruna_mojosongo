/**
 * ============================================================
 * News Worker Startup Script
 * (Kafka telah dihapus — hanya menjalankan background workers)
 * ============================================================
 * Jalankan sebagai process terpisah dari Next.js server:
 *   npx dotenv-cli -e .env.development -- npx tsx scripts/StartNewsConsumer.ts
 *
 * Workers yang dijalankan:
 *  1. View Counter Worker  → flush in-memory view buffer ke DB + ES setiap 10 detik
 *  2. Trending Worker      → recalculate trending_score setiap 15 menit
 * ============================================================
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

import {
  startViewCounterWorker,
  stopViewCounterWorker,
} from "../lib/news/view-counter.consumer";
import {
  startTrendingWorker,
  stopTrendingWorker,
} from "../lib/news/trending-worker";

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  News Workers — Karang Taruna Mojosongo");
  console.log("  View Counter Buffer + Trending Score Recalculator");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── Graceful Shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n[NEWS] Received ${signal}, shutting down gracefully...`);

    try {
      stopTrendingWorker();
      await stopViewCounterWorker();
      console.log("[NEWS] All workers stopped. Bye!\n");
    } catch (error) {
      console.error("[NEWS] Error during shutdown:", error);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // ── Start Workers ────────────────────────────────────────────────────────
  try {
    // 1. View Counter Worker — flush in-memory view buffer ke DB + ES setiap 10 detik
    startViewCounterWorker();
    console.log("[NEWS] ✓ View Counter Worker running (flush every 10s).");

    // 2. Trending Worker — recalculate score setiap 15 menit
    startTrendingWorker();
    console.log("[NEWS] ✓ Trending Worker running (every 15 min).");

    console.log("\n[NEWS] All workers running. Press Ctrl+C to stop.\n");
  } catch (error) {
    console.error("[NEWS] Fatal error starting workers:", error);
    process.exit(1);
  }
}

main();
