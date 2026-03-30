/**
 * Trending Score Recalculation Worker
 *
 * Dijadwalkan setiap 15 menit via setInterval.
 * Menghitung ulang trending_score untuk semua berita PUBLISHED 7 hari terakhir.
 *
 * Formula:
 *   score = ((views * 0.3) + (likes * 0.5) + (share * 0.2)) / (age_hours + 2) * decay
 *   decay = e^(-0.05 * age_hours)  → half-life ~14 jam
 *   +2    = konstanta agar konten baru tidak langsung bernilai 0
 *
 * Dijalankan dari scripts/StartNewsConsumer.ts sebagai background process.
 */
import { prisma } from "@/lib/prisma";
import { indexDocument } from "@/lib/elasticsearch";
import { invalidateCachePrefix } from "@/lib/redis";
import { ELASTIC_INDICES, REDIS_KEYS } from "@/lib/constants";
import { differenceInHours, subDays } from "date-fns";

// ─── Config ───────────────────────────────────────────────────────────────────

const INTERVAL_MS      = 15 * 60 * 1000; // 15 menit
const LOOKBACK_DAYS    = 7;              // Hanya hitung berita 7 hari terakhir
const DECAY_LAMBDA     = 0.05;           // Koefisien decay (half-life ~14 jam)
const WEIGHT_VIEWS     = 0.3;
const WEIGHT_LIKES     = 0.5;
const WEIGHT_SHARE     = 0.2;

// ─── State ────────────────────────────────────────────────────────────────────

let timer: ReturnType<typeof setInterval> | null = null;

// ─── Core Logic ───────────────────────────────────────────────────────────────

/**
 * Hitung ulang trending_score untuk semua berita PUBLISHED 7 hari terakhir.
 * Bisa dipanggil manual (misal: via seeder atau test) atau oleh worker interval.
 */
export async function recalculateTrendingScores(): Promise<void> {
  console.log("[TRENDING_WORKER] Recalculating trending scores...");

  try {
    const beritaList = await prisma.c_berita.findMany({
      where: {
        status: "PUBLISHED",
        published_at: { gte: subDays(new Date(), LOOKBACK_DAYS) },
        dihapus_pada: null,
      },
      select: {
        id: true,
        published_at: true,
        total_views: true,
        total_likes: true,
        total_share: true,
      },
    });

    if (beritaList.length === 0) {
      console.log("[TRENDING_WORKER] No published berita found, skipping.");
      return;
    }

    let updated = 0;

    for (const berita of beritaList) {
      if (!berita.published_at) continue;

      const ageHours = Math.max(0, differenceInHours(new Date(), berita.published_at));
      const decay    = Math.exp(-DECAY_LAMBDA * ageHours);

      const score =
        ((Number(berita.total_views) * WEIGHT_VIEWS +
          berita.total_likes        * WEIGHT_LIKES +
          berita.total_share        * WEIGHT_SHARE) /
          (ageHours + 2)) *
        decay;

      // ── 1. Update PostgreSQL ──────────────────────────────────────────
      await prisma.c_berita.update({
        where: { id: berita.id },
        data: {
          trending_score:      score,
          trending_updated_at: new Date(),
        },
      });

      // ── 2. Partial update Elasticsearch (hanya field yang berubah) ────
      await indexDocument(
        ELASTIC_INDICES.BERITA,
        berita.id,
        { trending_score: score } as Record<string, unknown>,
      );

      updated++;
    }

    // ── 3. Invalidate Redis trending cache ────────────────────────────────
    await invalidateCachePrefix(REDIS_KEYS.BERITA.TRENDING);

    console.log(
      `[TRENDING_WORKER] Done. Updated ${updated}/${beritaList.length} berita.`,
    );
  } catch (error) {
    console.error("[TRENDING_WORKER] Error during recalculation:", error);
  }
}

// ─── Worker Lifecycle ─────────────────────────────────────────────────────────

/**
 * Mulai recurring trending score worker.
 * - Jalankan satu kali langsung saat startup
 * - Kemudian setiap 15 menit secara otomatis
 */
export function startTrendingWorker(): void {
  if (timer) {
    console.log("[TRENDING_WORKER] Already running, skipping...");
    return;
  }

  // Jalankan langsung saat startup agar data tidak stale
  recalculateTrendingScores();

  timer = setInterval(recalculateTrendingScores, INTERVAL_MS);
  console.log("[TRENDING_WORKER] Started (interval: 15 minutes)");
}

/**
 * Stop trending worker (panggil saat graceful shutdown).
 */
export function stopTrendingWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log("[TRENDING_WORKER] Stopped");
  }
}

/**
 * Status worker untuk monitoring / health check.
 */
export function getTrendingWorkerStatus(): { isRunning: boolean } {
  return { isRunning: timer !== null };
}
