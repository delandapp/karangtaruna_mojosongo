/**
 * ============================================================
 * SYNC PROVINSI — Sinkronisasi data Provinsi dari DAPO Kemendikbud
 * ============================================================
 * Cara jalankan:
 *   npx dotenv-cli -e .env.development -- npx tsx scripts/SyncProvinsi.ts
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

import fs from "fs";
import path from "path";

// ─── Tipe data ─────────────────────────────────────────────────────────────────

interface KemendikbudProvinsiItem {
  nama: string;
  kode_wilayah: string;
  id_level_wilayah: number;
  [key: string]: unknown;
}

// ─── Laporan ──────────────────────────────────────────────────────────────────

interface SyncReport {
  total: number;
  berhasil: number;
  duplikat: number;
  gagal: number;
  detail_gagal: { nama: string; kode: string; alasan: string }[];
  detail_duplikat: { nama: string; kode: string }[];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function log(level: "INFO" | "SUCCESS" | "WARN" | "ERROR", msg: string) {
  const warna = {
    INFO: "\x1b[36m",    // cyan
    SUCCESS: "\x1b[32m", // green
    WARN: "\x1b[33m",    // yellow
    ERROR: "\x1b[31m",   // red
  };
  const reset = "\x1b[0m";
  const ts = new Date().toISOString();
  console.log(`${warna[level]}[${level}]${reset} ${ts} — ${msg}`);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cetakLaporan(report: SyncReport) {
  const sep = "═".repeat(60);
  console.log(`\n${sep}`);
  console.log("  📊  LAPORAN SINKRONISASI PROVINSI");
  console.log(sep);
  console.log(`  Total data dari API  : ${report.total}`);
  console.log(`  ✅ Berhasil disimpan : ${report.berhasil}`);
  console.log(`  ⚠️  Duplikat (skip)  : ${report.duplikat}`);
  console.log(`  ❌ Gagal             : ${report.gagal}`);

  if (report.detail_duplikat.length > 0) {
    console.log(`\n  Duplikat (sudah ada di DB):`);
    report.detail_duplikat.forEach((d) =>
      console.log(`    · [${d.kode.trim()}] ${d.nama}`)
    );
  }

  if (report.detail_gagal.length > 0) {
    console.log(`\n  Gagal diproses:`);
    report.detail_gagal.forEach((d) =>
      console.log(`    · [${d.kode.trim()}] ${d.nama} — ${d.alasan}`)
    );
  }

  console.log(`${sep}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Prisma v7 wajib menggunakan driver adapter (@prisma/adapter-pg).
  // Pakai DIRECT_URL (koneksi langsung, bypass PgBouncer) untuk script CLI.
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const report: SyncReport = {
    total: 0,
    berhasil: 0,
    duplikat: 0,
    gagal: 0,
    detail_gagal: [],
    detail_duplikat: [],
  };

  try {
    log("INFO", "Memulai sinkronisasi data Provinsi dari dataset lokal…");

    // 1. Baca data dari CSV lokal
    const csvPath = path.join(process.cwd(), "scripts", "dataset", "provinsi.csv");
    log("INFO", `Membaca: ${csvPath}`);

    const csvData = fs.readFileSync(csvPath, "utf-8");
    const lines = csvData.split("\n").filter(line => line.trim() !== "");
    // Hapus header
    lines.shift();

    const data: KemendikbudProvinsiItem[] = lines.map(line => {
      const [code, parent_code, name] = line.split(",");
      return {
        kode_wilayah: code.trim() + "0000", // pad to match 6 digit format "050000" or similar, wait actually let's see how DB wants it. Our old fetch returned 6 chars padding spaces. Let's just use the code padding with 0s to 6 chars, or just the raw code 
        nama: name.trim().toUpperCase(),
        id_level_wilayah: 1,
      };
    });

    // Sesuaikan padding kode to format '110000'
    data.forEach(d => {
       d.kode_wilayah = d.kode_wilayah.padEnd(6, "0");
    });
    
    report.total = data.length;
    log("INFO", `Diterima ${report.total} data provinsi dari dataset.`);

    // 2. Proses setiap provinsi
    for (const item of data) {
      const kode = item.kode_wilayah?.trim() ?? "";
      const nama = item.nama?.trim() ?? "";

      if (!kode || !nama) {
        const alasan = `Data tidak valid: kode="${kode}" nama="${nama}"`;
        log("WARN", `Skip — ${alasan}`);
        report.gagal++;
        report.detail_gagal.push({ nama, kode, alasan });
        continue;
      }

      try {
        // Cek duplikat berdasarkan kode_wilayah (unique)
        const existing = await prisma.m_provinsi.findUnique({
          where: { kode_wilayah: kode },
        });

        if (existing) {
          log("WARN", `Duplikat — [${kode}] ${nama} sudah ada (id=${existing.id}), skip.`);
          report.duplikat++;
          report.detail_duplikat.push({ nama, kode });
          continue;
        }

        // Insert baru
        const created = await prisma.m_provinsi.create({
          data: { kode_wilayah: kode, nama },
        });
        log("SUCCESS", `Tersimpan  — [${kode}] ${nama} (id=${created.id})`);
        report.berhasil++;
      } catch (err) {
        const alasan = err instanceof Error ? err.message : String(err);
        log("ERROR", `Gagal simpan [${kode}] ${nama}: ${alasan}`);
        report.gagal++;
        report.detail_gagal.push({ nama, kode, alasan });
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
