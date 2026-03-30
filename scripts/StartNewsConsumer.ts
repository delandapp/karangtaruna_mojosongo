/**
 * News Consumer Startup Script
 *
 * Jalankan sebagai process terpisah dari Next.js server:
 *   npx dotenv-cli -e .env.development -- npx tsx scripts/StartNewsConsumer.ts
 *
 * Services yang dijalankan:
 *  1. News Published Consumer  → terima event NEWS_PUBLISHED → index dokumen kaya ke ES
 *  2. View Counter Consumer    → terima event NEWS_VIEWED → batch flush ke DB + ES setiap 10 detik
 *  3. Trending Worker          → recalculate trending_score setiap 15 menit
 */

import { startNewsPublishedConsumer, stopNewsPublishedConsumer } from "../lib/news/news-published.consumer";
import { startViewCounterConsumer, stopViewCounterConsumer } from "../lib/news/view-counter.consumer";
import { startTrendingWorker, stopTrendingWorker } from "../lib/news/trending-worker";

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  News Consumer — Karang Taruna Mojosongo");
  console.log("  Kafka → Elasticsearch + PostgreSQL (view counter + trending)");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── Graceful Shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n[NEWS] Received ${signal}, shutting down gracefully...`);

    try {
      stopTrendingWorker();
      await stopViewCounterConsumer();
      await stopNewsPublishedConsumer();
      console.log("[NEWS] All services stopped. Bye!\n");
    } catch (error) {
      console.error("[NEWS] Error during shutdown:", error);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // ── Start Services ───────────────────────────────────────────────────────
  try {
    // 1. News Published Consumer — index rich ES document
    await startNewsPublishedConsumer();
    console.log("[NEWS] ✓ News Published Consumer running.");

    // 2. View Counter Consumer — batching view events ke DB + ES
    await startViewCounterConsumer();
    console.log("[NEWS] ✓ View Counter Consumer running.");

    // 3. Trending Worker — recalculate score setiap 15 menit
    startTrendingWorker();
    console.log("[NEWS] ✓ Trending Worker running (every 15 min).");

    console.log("\n[NEWS] All services running. Press Ctrl+C to stop.\n");
  } catch (error) {
    console.error("[NEWS] Fatal error starting services:", error);
    process.exit(1);
  }
}

main();
