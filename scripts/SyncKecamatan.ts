/**
 * ============================================================
 * SYNC KECAMATAN — Sinkronisasi data Kecamatan dari DAPO Kemendikbud
 * ============================================================
 * Cara jalankan:
 *   npx dotenv-cli -e .env.development -- npx tsx scripts/SyncKecamatan.ts
 *
 * Script ini akan:
 * 1. Ambil semua Kota dari DB lokal (beserta relasi Provinsi)
 * 2. Untuk setiap Kota, fetch data Kecamatan dari API Kemendikbud
 *    menggunakan kode_wilayah kota tersebut
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

// id_level_wilayah: 2 = Kabupaten/Kota → menghasilkan data kecamatan di kota tsb
const ID_LEVEL_KECAMATAN = "2";
// Delay antar request (ms) agar tidak kena rate-limit
const DELAY_MS = 300;

// ─── Tipe data ─────────────────────────────────────────────────────────────────

interface KemendikbudKecamatanItem {
  nama: string;
  kode_wilayah: string;
  id_level_wilayah: number;
  [key: string]: unknown;
}

// ─── Laporan ──────────────────────────────────────────────────────────────────

interface DetailKota {
  nama_kota: string;
  kode_kota: string;
  nama_provinsi: string;
  total: number;
  berhasil: number;
  duplikat: number;
  gagal: number;
  gagal_detail: { nama: string; kode: string; alasan: string }[];
}

interface SyncReport {
  total_kota: number;
  kota_sukses_fetch: number;
  kota_gagal_fetch: number;
  total_kecamatan: number;
  kecamatan_berhasil: number;
  kecamatan_duplikat: number;
  kecamatan_gagal: number;
  per_kota: DetailKota[];
  kota_gagal_fetch_list: { nama: string; kode: string; alasan: string }[];
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

function cetakLaporan(report: SyncReport) {
  const sep = "═".repeat(65);
  console.log(`\n${sep}`);
  console.log("  📊  LAPORAN SINKRONISASI KECAMATAN");
  console.log(sep);
  console.log(`  Kota diproses        : ${report.total_kota}`);
  console.log(`  Kota sukses fetch    : ${report.kota_sukses_fetch}`);
  console.log(`  Kota gagal fetch     : ${report.kota_gagal_fetch}`);
  console.log(`  ─────────────────────────────────────────────`);
  console.log(`  Total Kecamatan API  : ${report.total_kecamatan}`);
  console.log(`  ✅ Berhasil disimpan : ${report.kecamatan_berhasil}`);
  console.log(`  ⚠️  Duplikat (skip)  : ${report.kecamatan_duplikat}`);
  console.log(`  ❌ Gagal             : ${report.kecamatan_gagal}`);

  if (report.kota_gagal_fetch_list.length > 0) {
    console.log(`\n  Kota gagal fetch API:`);
    report.kota_gagal_fetch_list.forEach((k) =>
      console.log(`    · [${k.kode.trim()}] ${k.nama} — ${k.alasan}`),
    );
  }

  // Ringkasan per kota (hanya tampilkan kota yang ada error/duplikat atau > 0 kecamatan)
  const kotaBermasalah = report.per_kota.filter(
    (k) => k.gagal > 0 || k.duplikat > 0,
  );
  if (kotaBermasalah.length > 0) {
    console.log(`\n  Detail kota bermasalah:`);
    for (const kota of kotaBermasalah) {
      const status = kota.gagal > 0 ? "❌" : "⚠️ ";
      console.log(
        `    ${status} [${kota.kode_kota.trim()}] ${kota.nama_kota} (${kota.nama_provinsi}): ` +
          `total=${kota.total} berhasil=${kota.berhasil} duplikat=${kota.duplikat} gagal=${kota.gagal}`,
      );
      kota.gagal_detail.forEach((d) =>
        console.log(`        · [${d.kode.trim()}] ${d.nama} — ${d.alasan}`),
      );
    }
  }

  // Ringkasan semua kota (compact)
  console.log(`\n  Ringkasan semua Kota:`);
  for (const kota of report.per_kota) {
    const status = kota.gagal > 0 ? "❌" : kota.duplikat > 0 ? "⚠️ " : "✅";
    console.log(
      `    ${status} [${kota.kode_kota.trim()}] ${kota.nama_kota}: ` +
        `berhasil=${kota.berhasil} duplikat=${kota.duplikat} gagal=${kota.gagal}`,
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
    total_kota: 0,
    kota_sukses_fetch: 0,
    kota_gagal_fetch: 0,
    total_kecamatan: 0,
    kecamatan_berhasil: 0,
    kecamatan_duplikat: 0,
    kecamatan_gagal: 0,
    per_kota: [],
    kota_gagal_fetch_list: [],
  };

  try {
    log("INFO", "Memulai sinkronisasi data Kecamatan dari Kemendikbud DAPO…");

    // 1. Ambil semua kota dari DB lokal (include provinsi untuk info log)
    const kotaList = await prisma.m_kota.findMany({
      include: { m_provinsi: true },
      orderBy: { kode_wilayah: "asc" },
    });
    report.total_kota = kotaList.length;

    if (kotaList.length === 0) {
      log(
        "WARN",
        "Tidak ada data Kota di database. Jalankan SyncKota.ts terlebih dahulu!",
      );
      return;
    }

    log(
      "INFO",
      `Ditemukan ${kotaList.length} kota di DB. Mulai fetch kecamatan per kota…`,
    );

    // 2. Iterasi per kota
    for (const kota of kotaList) {
      const kodeKota = kota.kode_wilayah?.trim() ?? "";
      const namaProvinsi = kota.m_provinsi?.nama ?? "—";

      if (!kodeKota) {
        log("WARN", `Kota id=${kota.id} tidak punya kode_wilayah, skip.`);
        continue;
      }

      log(
        "INFO",
        `\nFetch kecamatan untuk kota [${kodeKota}] ${kota.nama} (${namaProvinsi})…`,
      );

      const detail: DetailKota = {
        nama_kota: kota.nama,
        kode_kota: kodeKota,
        nama_provinsi: namaProvinsi,
        total: 0,
        berhasil: 0,
        duplikat: 0,
        gagal: 0,
        gagal_detail: [],
      };

      try {
        const params = new URLSearchParams({
          semester_id: SEMESTER_ID,
          id_level_wilayah: ID_LEVEL_KECAMATAN,
          kode_wilayah: kodeKota,
        });
        const url = `${BASE_URL}?${params.toString()}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: KemendikbudKecamatanItem[] = await response.json();
        detail.total = data.length;
        report.total_kecamatan += data.length;
        log("INFO", `  → ${data.length} kecamatan diterima.`);
        report.kota_sukses_fetch++;

        // 3. Proses setiap kecamatan
        for (const item of data) {
          const kode = item.kode_wilayah?.trim() ?? "";
          const nama = item.nama?.trim() ?? "";

          if (!kode || !nama) {
            const alasan = `Data tidak valid: kode="${kode}" nama="${nama}"`;
            log("WARN", `  Skip — ${alasan}`);
            detail.gagal++;
            report.kecamatan_gagal++;
            detail.gagal_detail.push({ nama, kode, alasan });
            continue;
          }

          try {
            // Cek duplikat
            const existing = await prisma.m_kecamatan.findUnique({
              where: { kode_wilayah: kode },
            });

            if (existing) {
              log(
                "WARN",
                `  Duplikat — [${kode}] ${nama} (id=${existing.id}), skip.`,
              );
              detail.duplikat++;
              report.kecamatan_duplikat++;
              continue;
            }

            // Insert
            const created = await prisma.m_kecamatan.create({
              data: {
                kode_wilayah: kode,
                nama,
                m_kota_id: kota.id,
              },
            });
            log(
              "SUCCESS",
              `  Tersimpan — [${kode}] ${nama} (id=${created.id})`,
            );
            detail.berhasil++;
            report.kecamatan_berhasil++;
          } catch (err) {
            const alasan = err instanceof Error ? err.message : String(err);
            log("ERROR", `  Gagal simpan [${kode}] ${nama}: ${alasan}`);
            detail.gagal++;
            report.kecamatan_gagal++;
            detail.gagal_detail.push({ nama, kode, alasan });
          }
        }
      } catch (err) {
        const alasan = err instanceof Error ? err.message : String(err);
        log(
          "ERROR",
          `Gagal fetch kecamatan untuk [${kodeKota}] ${kota.nama}: ${alasan}`,
        );
        report.kota_gagal_fetch++;
        report.kota_gagal_fetch_list.push({
          nama: kota.nama,
          kode: kodeKota,
          alasan,
        });
      }

      report.per_kota.push(detail);

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
