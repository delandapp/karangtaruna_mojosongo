/**
 * ============================================================
 * SYNC JENJANG — Sinkronisasi data Bentuk Pendidikan (Jenjang)
 *                dari API Sekolah Kemendikbud
 * ============================================================
 * Cara jalankan:
 *   npm run sync:jenjang
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

// ─── Konfigurasi ──────────────────────────────────────────────────────────────

const API_URL =
  "https://sekolah.data.kemendikdasmen.go.id/v1/sekolah-service/referensi/bentuk-pendidikan";

// ─── Tipe data ─────────────────────────────────────────────────────────────────

interface BentukPendidikanItem {
  bentuk_pendidikan_id: number;
  nama: string;
}

interface ApiResponse {
  status_code: number;
  message: string;
  data: BentukPendidikanItem[];
}

// ─── Laporan ──────────────────────────────────────────────────────────────────

interface SyncReport {
  total: number;
  berhasil: number;
  duplikat: number;
  gagal: number;
  detail_duplikat: { id: number; nama: string }[];
  detail_gagal: { id: number; nama: string; alasan: string }[];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function log(level: "INFO" | "SUCCESS" | "WARN" | "ERROR", msg: string) {
  const warna = {
    INFO: "\x1b[36m",
    SUCCESS: "\x1b[32m",
    WARN: "\x1b[33m",
    ERROR: "\x1b[31m",
  };
  const reset = "\x1b[0m";
  const ts = new Date().toISOString();
  console.log(`${warna[level]}[${level}]${reset} ${ts} — ${msg}`);
}

function cetakLaporan(report: SyncReport) {
  const sep = "═".repeat(60);
  console.log(`\n${sep}`);
  console.log("  📊  LAPORAN SINKRONISASI JENJANG / BENTUK PENDIDIKAN");
  console.log(sep);
  console.log(`  Total dari API       : ${report.total}`);
  console.log(`  ✅ Berhasil disimpan : ${report.berhasil}`);
  console.log(`  ⚠️  Duplikat (skip)  : ${report.duplikat}`);
  console.log(`  ❌ Gagal             : ${report.gagal}`);

  if (report.detail_duplikat.length > 0) {
    console.log(`\n  Duplikat (sudah ada di DB):`);
    report.detail_duplikat.forEach((d) =>
      console.log(`    · [id=${d.id}] ${d.nama}`),
    );
  }

  if (report.detail_gagal.length > 0) {
    console.log(`\n  Gagal:`);
    report.detail_gagal.forEach((d) =>
      console.log(`    · [id=${d.id}] ${d.nama} — ${d.alasan}`),
    );
  }

  console.log(`${sep}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const report: SyncReport = {
    total: 0,
    berhasil: 0,
    duplikat: 0,
    gagal: 0,
    detail_duplikat: [],
    detail_gagal: [],
  };

  try {
    log(
      "INFO",
      "Memulai sinkronisasi Jenjang / Bentuk Pendidikan dari Kemendikbud…",
    );
    log("INFO", `Fetching: ${API_URL}`);

    // 1. Fetch dari API dengan curl (bypass TLS fingerprint WAF)
    const { execSync } = require("child_process");
    const curlCmd = `curl -s -L -H "Accept: application/json" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" -H "Referer: https://sekolah.data.kemendikdasmen.go.id/" "${API_URL}"`;
    const result = execSync(curlCmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, timeout: 30000 });
    
    let json: ApiResponse;
    try {
      json = JSON.parse(result);
    } catch (e: any) {
      throw new Error(`Invalid JSON response: ${result.substring(0, 100).replace(/\n/g, "")}...`);
    }

    if (json.status_code !== 200) {
      throw new Error(`API error: ${json.message}`);
    }

    const data = json.data ?? [];
    report.total = data.length;
    log("INFO", `Diterima ${report.total} jenjang dari API.`);

    // 2. Proses setiap item
    for (const item of data) {
      const nama = item.nama?.trim() ?? "";
      const deskripsi = `Kode bentuk pendidikan: ${item.bentuk_pendidikan_id}`;

      if (!nama) {
        const alasan = "Nama kosong";
        log("WARN", `Skip id=${item.bentuk_pendidikan_id} — ${alasan}`);
        report.gagal++;
        report.detail_gagal.push({
          id: item.bentuk_pendidikan_id,
          nama: "(kosong)",
          alasan,
        });
        continue;
      }

      try {
        // Cek duplikat berdasarkan nama (unique)
        const existing = await prisma.m_jenjang.findUnique({
          where: { nama },
        });

        if (existing) {
          log(
            "WARN",
            `Duplikat — "${nama}" sudah ada (id=${existing.id}), skip.`,
          );
          report.duplikat++;
          report.detail_duplikat.push({ id: item.bentuk_pendidikan_id, nama });
          continue;
        }

        // Insert
        const created = await prisma.m_jenjang.create({
          data: { nama, deskripsi },
        });

        log(
          "SUCCESS",
          `Tersimpan — [id_api=${item.bentuk_pendidikan_id}] "${nama}" (db_id=${created.id})`,
        );
        report.berhasil++;
      } catch (err) {
        const alasan = err instanceof Error ? err.message : String(err);
        log("ERROR", `Gagal simpan "${nama}": ${alasan}`);
        report.gagal++;
        report.detail_gagal.push({
          id: item.bentuk_pendidikan_id,
          nama,
          alasan,
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", `Fatal error: ${msg}`);
    process.exitCode = 1;
  } finally {
    cetakLaporan(report);
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
