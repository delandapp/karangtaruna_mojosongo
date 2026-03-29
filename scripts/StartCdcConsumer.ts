/**
 * CDC Consumer Startup Script
 *
 * Jalankan script ini sebagai background process terpisah dari Next.js server.
 *
 * Usage:
 *   npx dotenv-cli -e .env.development -- npx tsx scripts/StartCdcConsumer.ts
 *
 * Script ini akan:
 * 1. Connect ke Kafka broker
 * 2. Subscribe ke semua Debezium CDC topics
 * 3. Sync perubahan ke Elasticsearch + Redis via Kafka
 * 4. Start cache consumer untuk menerima cache operations dari Kafka
 */

import { startCdcConsumer, stopCdcConsumer } from "../lib/cdc-consumer";
import { startCacheConsumer, stopCacheConsumer } from "../lib/cache-consumer";

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  CDC Consumer — Karang Taruna Mojosongo");
  console.log("  Debezium → Kafka → Elasticsearch + Redis (via Kafka)");
  console.log("═══════════════════════════════════════════════════════");
  console.log();

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`\n[CDC] Received ${signal}, shutting down gracefully...`);
    await stopCdcConsumer();
    await stopCacheConsumer();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    // Start CDC Consumer (Debezium → Kafka → ES + Kafka cache messages)
    await startCdcConsumer();
    console.log("[CDC] CDC Consumer is running.");

    // Start Cache Consumer (Kafka cache messages → Redis)
    await startCacheConsumer();
    console.log("[CDC] Cache Consumer is running.");

    console.log("\n[CDC] All consumers running. Press Ctrl+C to stop.\n");
  } catch (error) {
    console.error("[CDC] Fatal error starting consumers:", error);
    process.exit(1);
  }
}

main();
