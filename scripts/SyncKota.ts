/**
 * ============================================================
 * SYNC KOTA — Sinkronisasi data Kota/Kabupaten dari DAPO Kemendikbud
 * ============================================================
 * Cara jalankan:
 *   npx dotenv-cli -e .env.development -- npx tsx scripts/SyncKota.ts
 *
 * Script ini akan:
 * 1. Ambil semua Provinsi dari DB lokal
 * 2. Untuk setiap Provinsi, fetch data Kota dari API Kemendikbud
 *    menggunakan kode_wilayah provinsi tersebut
 * 3. Simpan ke DB, skip jika duplikat
 * 4. Cetak laporan lengkap di akhir
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

// ─── Konfigurasi ──────────────────────────────────────────────────────────────

const BASE_URL = "https://dapo.kemendikdasmen.go.id/rekap/dataSekolah";
const SEMESTER_ID = "20252";

// id_level_wilayah: 1 = Provinsi → menghasilkan data kota dalam provinsi tsb
const ID_LEVEL_KOTA = "1";
// Delay antar request ke API agar tidak kena rate-limit (ms)
const DELAY_MS = 300;

// ─── Tipe data ─────────────────────────────────────────────────────────────────

interface KemendikbudKotaItem {
  nama: string;
  kode_wilayah: string;
  id_level_wilayah: number;
  [key: string]: unknown;
}

// ─── Laporan ──────────────────────────────────────────────────────────────────

interface DetailProvinsi {
  nama_provinsi: string;
  kode_provinsi: string;
  total: number;
  berhasil: number;
  duplikat: number;
  gagal: number;
  gagal_detail: { nama: string; kode: string; alasan: string }[];
}

interface SyncReport {
  total_provinsi: number;
  provinsi_sukses: number;
  provinsi_gagal_fetch: number;
  total_kota: number;
  kota_berhasil: number;
  kota_duplikat: number;
  kota_gagal: number;
  per_provinsi: DetailProvinsi[];
  provinsi_gagal_fetch_list: { nama: string; kode: string; alasan: string }[];
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 3, delayMs = 3000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e: any) {
        throw new Error(`Invalid JSON response: ${text.substring(0, 100).replace(/\n/g, "")}...`);
      }
    } catch (err: any) {
      if (i === retries - 1) throw err;
      log("WARN", `Fetch gagal (percobaan ${i + 1}/${retries}): ${err.message}. Retrying in ${delayMs / 1000}s...`);
      await delay(delayMs);
    }
  }
}

function cetakLaporan(report: SyncReport) {
  const sep = "═".repeat(65);
  console.log(`\n${sep}`);
  console.log("  📊  LAPORAN SINKRONISASI KOTA / KABUPATEN");
  console.log(sep);
  console.log(`  Provinsi diproses    : ${report.total_provinsi}`);
  console.log(`  Provinsi sukses fetch: ${report.provinsi_sukses}`);
  console.log(`  Provinsi gagal fetch : ${report.provinsi_gagal_fetch}`);
  console.log(`  ─────────────────────────────────────────────`);
  console.log(`  Total Kota dari API  : ${report.total_kota}`);
  console.log(`  ✅ Kota berhasil     : ${report.kota_berhasil}`);
  console.log(`  ⚠️  Kota duplikat    : ${report.kota_duplikat}`);
  console.log(`  ❌ Kota gagal        : ${report.kota_gagal}`);

  if (report.provinsi_gagal_fetch_list.length > 0) {
    console.log(`\n  Provinsi gagal fetch API:`);
    report.provinsi_gagal_fetch_list.forEach((p) =>
      console.log(`    · [${p.kode.trim()}] ${p.nama} — ${p.alasan}`)
    );
  }

  console.log(`\n  Detail per Provinsi:`);
  for (const prov of report.per_provinsi) {
    const status =
      prov.gagal > 0 ? "❌" : prov.duplikat > 0 ? "⚠️ " : "✅";
    console.log(
      `    ${status} [${prov.kode_provinsi.trim()}] ${prov.nama_provinsi}: ` +
        `total=${prov.total} berhasil=${prov.berhasil} duplikat=${prov.duplikat} gagal=${prov.gagal}`
    );
    if (prov.gagal_detail.length > 0) {
      prov.gagal_detail.forEach((d) =>
        console.log(`        · [${d.kode.trim()}] ${d.nama} — ${d.alasan}`)
      );
    }
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
    total_provinsi: 0,
    provinsi_sukses: 0,
    provinsi_gagal_fetch: 0,
    total_kota: 0,
    kota_berhasil: 0,
    kota_duplikat: 0,
    kota_gagal: 0,
    per_provinsi: [],
    provinsi_gagal_fetch_list: [],
  };

  try {
    log("INFO", "Memulai sinkronisasi data Kota/Kabupaten dari Kemendikbud DAPO…");

    // 1. Ambil semua provinsi dari DB lokal
    const provinsiList = await prisma.m_provinsi.findMany({
      orderBy: { kode_wilayah: "asc" },
    });
    report.total_provinsi = provinsiList.length;

    if (provinsiList.length === 0) {
      log("WARN", "Tidak ada data Provinsi di database. Jalankan SyncProvinsi.ts terlebih dahulu!");
      return;
    }

    log("INFO", `Ditemukan ${provinsiList.length} provinsi di DB. Mulai fetch kota per provinsi…`);

    // 2. Iterasi per provinsi
    for (const prov of provinsiList) {
      const kodeProvinsi = prov.kode_wilayah?.trim() ?? "";
      if (!kodeProvinsi) {
        log("WARN", `Provinsi id=${prov.id} tidak punya kode_wilayah, skip.`);
        continue;
      }

      log("INFO", `\nFetch kota untuk provinsi [${kodeProvinsi}] ${prov.nama}…`);

      const detail: DetailProvinsi = {
        nama_provinsi: prov.nama,
        kode_provinsi: kodeProvinsi,
        total: 0,
        berhasil: 0,
        duplikat: 0,
        gagal: 0,
        gagal_detail: [],
      };

      try {
        const params = new URLSearchParams({
          semester_id: SEMESTER_ID,
          id_level_wilayah: ID_LEVEL_KOTA,
          kode_wilayah: kodeProvinsi,
        });
        const url = `${BASE_URL}?${params.toString()}`;

        const data: KemendikbudKotaItem[] = await fetchWithRetry(url);
        detail.total = data.length;
        report.total_kota += data.length;
        log("INFO", `  → ${data.length} kota diterima.`);
        report.provinsi_sukses++;

        // 3. Proses setiap kota dalam provinsi ini
        for (const item of data) {
          const kode = item.kode_wilayah?.trim() ?? "";
          const nama = item.nama?.trim() ?? "";

          if (!kode || !nama) {
            const alasan = `Data tidak valid: kode="${kode}" nama="${nama}"`;
            log("WARN", `  Skip — ${alasan}`);
            detail.gagal++;
            report.kota_gagal++;
            detail.gagal_detail.push({ nama, kode, alasan });
            continue;
          }

          try {
            // Cek duplikat
            const existing = await prisma.m_kota.findUnique({
              where: { kode_wilayah: kode },
            });

            if (existing) {
              log("WARN", `  Duplikat — [${kode}] ${nama} (id=${existing.id}), skip.`);
              detail.duplikat++;
              report.kota_duplikat++;
              continue;
            }

            // Insert
            const created = await prisma.m_kota.create({
              data: {
                kode_wilayah: kode,
                nama,
                m_provinsi_id: prov.id,
              },
            });
            log("SUCCESS", `  Tersimpan — [${kode}] ${nama} (id=${created.id})`);
            detail.berhasil++;
            report.kota_berhasil++;
          } catch (err) {
            const alasan = err instanceof Error ? err.message : String(err);
            log("ERROR", `  Gagal simpan [${kode}] ${nama}: ${alasan}`);
            detail.gagal++;
            report.kota_gagal++;
            detail.gagal_detail.push({ nama, kode, alasan });
          }
        }
      } catch (err) {
        const alasan = err instanceof Error ? err.message : String(err);
        log("ERROR", `Gagal fetch kota untuk [${kodeProvinsi}] ${prov.nama}: ${alasan}`);
        report.provinsi_gagal_fetch++;
        report.provinsi_gagal_fetch_list.push({
          nama: prov.nama,
          kode: kodeProvinsi,
          alasan,
        });
      }

      report.per_provinsi.push(detail);

      // Delay agar tidak membanjiri API
      await delay(DELAY_MS);
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
