/**
 * ============================================================
 * REINDEX WILAYAH — Sinkronisasi ulang data Wilayah dari DB ke ES
 * ============================================================
 * Jalankan jika data di DB sudah ada tapi ES masih kosong/stale.
 *
 * Usage:
 *   npx dotenv-cli -e .env.development -- npx tsx scripts/ReindexWilayah.ts
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

import { bulkIndex, ensureIndex, deleteAllDocuments } from "../lib/elasticsearch";
import { ELASTIC_INDICES } from "../lib/constants/key";

function log(level: "INFO" | "SUCCESS" | "WARN" | "ERROR", msg: string) {
  const colors = { INFO: "\x1b[36m", SUCCESS: "\x1b[32m", WARN: "\x1b[33m", ERROR: "\x1b[31m" };
  const reset = "\x1b[0m";
  console.log(`${colors[level]}[${level}]${reset} ${new Date().toISOString()} — ${msg}`);
}

async function reindexTable<T extends Record<string, unknown>>(
  label: string,
  indexName: string,
  fetchFn: () => Promise<T[]>,
) {
  log("INFO", `[${label}] Memulai reindex ke "${indexName}"…`);

  const records = await fetchFn();
  log("INFO", `[${label}] Ditemukan ${records.length} record di DB`);

  if (records.length === 0) {
    log("WARN", `[${label}] Tidak ada data, lewati.`);
    return;
  }

  await ensureIndex(indexName);
  await deleteAllDocuments(indexName);
  log("INFO", `[${label}] Index dikosongkan`);

  const docs = records.map((r) => ({
    id: String((r as any).id),
    doc: r,
  }));

  await bulkIndex(indexName, docs);
  log("SUCCESS", `[${label}] ✅ ${records.length} dokumen berhasil di-index ke ES`);
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("\n══════════════════════════════════════════════");
  console.log("  REINDEX WILAYAH → Elasticsearch");
  console.log("══════════════════════════════════════════════\n");

  try {
    await reindexTable(
      "Provinsi",
      ELASTIC_INDICES.PROVINSI,
      () => prisma.m_provinsi.findMany({ orderBy: { nama: "asc" } }) as any,
    );

    await reindexTable(
      "Kota",
      ELASTIC_INDICES.KOTA,
      () => prisma.m_kota.findMany({ orderBy: { nama: "asc" } }) as any,
    );

    await reindexTable(
      "Kecamatan",
      ELASTIC_INDICES.KECAMATAN,
      () => prisma.m_kecamatan.findMany({ orderBy: { nama: "asc" } }) as any,
    );

    await reindexTable(
      "Kelurahan",
      ELASTIC_INDICES.KELURAHAN,
      () => prisma.m_kelurahan.findMany({ orderBy: { nama: "asc" } }) as any,
    );

    console.log("\n══════════════════════════════════════════════");
    log("SUCCESS", "Reindex selesai!");
    console.log("══════════════════════════════════════════════\n");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", `Fatal error: ${msg}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
