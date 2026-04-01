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

import fs from "fs";
import path from "path";

// ─── Konfigurasi ──────────────────────────────────────────────────────────────

// id_level_wilayah: 2 = Kabupaten/Kota → menghasilkan data kecamatan di kota tsb

// ─── Tipe data ─────────────────────────────────────────────────────────────────

interface KemendikbudKecamatanItem {
  nama: string;
  kode_wilayah: string;
  mst_kode_wilayah: string;
  [key: string]: unknown;
}

// ─── Laporan ──────────────────────────────────────────────────────────────────

interface DetailKota {
  nama_kota: string;
  id_kota: string;
  total: number;
  baru: number;
  update: number;
  gagal: number;
}

interface SyncReport {
  total_kota_db: number;
  kota_sukses: number;
  kota_gagal: number;
  total_kec: number;
  kec_baru: number;
  kec_update: number;
  kec_gagal: number;
  per_kota: DetailKota[];
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

// Sync report function
function cetakLaporan(report: SyncReport) {
  const sep = "═".repeat(65);
  console.log(`\n${sep}`);
  console.log("  📊  LAPORAN SINKRONISASI KECAMATAN");
  console.log(sep);
  console.log(`  Kota di DB           : ${report.total_kota_db}`);
  console.log(`  Kota sukses proses   : ${report.kota_sukses}`);
  console.log(`  Kota gagal proses    : ${report.kota_gagal}`);
  console.log(`  ─────────────────────────────────────────────`);
  console.log(`  Total Kecamatan CSV  : ${report.total_kec}`);
  console.log(`  ✅ Baru disimpan     : ${report.kec_baru}`);
  console.log(`  🔄 Diperbarui        : ${report.kec_update}`);
  console.log(`  ❌ Gagal             : ${report.kec_gagal}`);

  // Ringkasan per kota (hanya tampilkan kota yang ada error/duplikat atau > 0 kecamatan)
  const kotaBermasalah = report.per_kota.filter(
    (k) => k.gagal > 0 || k.update > 0,
  );
  if (kotaBermasalah.length > 0) {
    console.log(`\n  Detail kota bermasalah:`);
    for (const kota of kotaBermasalah) {
      const status = kota.gagal > 0 ? "❌" : "🔄";
      console.log(
        `    ${status} [${kota.id_kota}] ${kota.nama_kota}: ` +
          `total=${kota.total} baru=${kota.baru} update=${kota.update} gagal=${kota.gagal}`,
      );
    }
  }

  // Ringkasan semua kota (compact)
  console.log(`\n  Ringkasan semua Kota:`);
  for (const kota of report.per_kota) {
    const status = kota.gagal > 0 ? "❌" : kota.update > 0 ? "🔄" : "✅";
    console.log(
      `    ${status} [${kota.id_kota}] ${kota.nama_kota}: ` +
        `baru=${kota.baru} update=${kota.update} gagal=${kota.gagal}`,
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
    total_kota_db: 0,
    kota_sukses: 0,
    kota_gagal: 0,
    total_kec: 0,
    kec_baru: 0,
    kec_update: 0,
    kec_gagal: 0,
    per_kota: [],
  };

  try {
    log("INFO", "Memulai sinkronisasi data Kecamatan dari CSV lokal…");

    // 1. Ambil semua kota dari DB lokal (include provinsi untuk info log)
    const kotaList = await prisma.m_kota.findMany({
      include: { m_provinsi: true },
      orderBy: { kode_wilayah: "asc" },
    });
    report.total_kota_db = kotaList.length;

    if (kotaList.length === 0) {
      log(
        "WARN",
        "Tidak ada data Kota di database. Jalankan SyncKota.ts terlebih dahulu!",
      );
      return;
    }

    log(
      "INFO",
      `Ditemukan ${kotaList.length} kota di DB. Mulai proses kecamatan per kota…`,
    );

    // 2. Iterasi per kota
    for (const kota of kotaList) {
      const kodeKota = kota.kode_wilayah?.trim() ?? "";
      if (!kodeKota) {
        log("WARN", `Kota ${kota.nama} tidak memiliki kode_wilayah. Lewati.`);
        continue;
      }

      log("INFO", `\nLanjut Memproses Kota: ${kota.nama} (${kota.id})`);

      const detail: DetailKota = {
        nama_kota: kota.nama,
        id_kota: kota.id.toString(),
        total: 0,
        baru: 0,
        update: 0,
        gagal: 0,
      };

      try {
        // Ambil data kecamatan dari CSV lokal
        const csvPath = path.join(
          process.cwd(),
          "scripts",
          "dataset",
          "kecamatan.csv",
        );
        const csvData = fs.readFileSync(csvPath, "utf-8");
        const lines = csvData.split("\n").filter((line) => line.trim() !== "");
        if (lines[0].startsWith("code")) lines.shift();

        // Kode kota "110100", ambil 4 digit pertama "1101"
        const paramKode = kodeKota.substring(0, 4);

        const dataKecamatan: KemendikbudKecamatanItem[] = lines
          .map((line) => {
            const [code, parent_code, name] = line.split(",");
            return {
              kode_wilayah: code.trim(), // kecamatan code is usually 6 digits or 7, e.g. "1101010", tapi we keep as is, or we can just keep code.trim()
              nama: name.trim().toUpperCase(),
              mst_kode_wilayah: parent_code.trim(),
            };
          })
          .filter((item) => item.mst_kode_wilayah === paramKode);

        if (!dataKecamatan || dataKecamatan.length === 0) {
          log("WARN", `Data Kecamatan kosong untuk kota ${kota.nama}. Skip.`);
          continue;
        }

        detail.total = dataKecamatan.length;
        report.total_kec += dataKecamatan.length;
        log("INFO", `  → ${dataKecamatan.length} kecamatan ditemukan.`);
        report.kota_sukses++;

        // 3. Proses setiap kecamatan dalam kota ini
        for (const item of dataKecamatan) {
          const kode = item.kode_wilayah?.trim() ?? "";
          const nama = item.nama?.trim() ?? "";

          if (!kode || !nama) {
            const alasan = `Data tidak valid: kode="${kode}" nama="${nama}"`;
            log("WARN", `  Skip — ${alasan}`);
            detail.gagal++;
            report.kec_gagal++;
            continue;
          }

          try {
            const upserted = await prisma.m_kecamatan.upsert({
              where: { kode_wilayah: kode },
              update: {
                nama: nama,
                m_kota_id: kota.id,
              },
              create: {
                kode_wilayah: kode,
                nama: nama,
                m_kota_id: kota.id,
              },
            });

            if (upserted) {
              // Check if it was an update or create
              const isNew =
                upserted.dibuat_pada.getTime() ===
                upserted.diperbarui_pada.getTime();
              if (isNew) {
                log(
                  "SUCCESS",
                  `  Baru — [${kode}] ${nama} (id=${upserted.id})`,
                );
                detail.baru++;
                report.kec_baru++;
              } else {
                log("INFO", `  Update — [${kode}] ${nama} (id=${upserted.id})`);
                detail.update++;
                report.kec_update++;
              }
            }
          } catch (err: any) {
            const alasan = err instanceof Error ? err.message : String(err);
            log("ERROR", `  Gagal simpan [${kode}] ${nama}: ${alasan}`);
            detail.gagal++;
            report.kec_gagal++;
          }
        }
      } catch (err: any) {
        log(
          "ERROR",
          `Gagal memproses kecamatan untuk kota ${kota.nama}: ${err.message}`,
        );
        report.kota_gagal++;
      }

      report.per_kota.push(detail);
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
