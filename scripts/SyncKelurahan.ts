/**
 * ============================================================
 * SYNC KELURAHAN / DESA — dari dataset CSV lokal (name-based matching)
 * ============================================================
 * Cara jalankan:
 *   npm run sync:kelurahan
 *
 * Strategi matching:
 * 1. Baca 4 file CSV (provinsi, kabupaten, kecamatan, desa)
 * 2. Build hierarchy dari CSV: desa → kecamatan → kab/kota → provinsi (by name)
 * 3. Match ke DB secara berjenjang berdasarkan NAMA (dinormalisasi):
 *      Provinsi DB  ←→  Provinsi CSV  (hapus "Prov.", "Provinsi", normalize)
 *      Kota DB      ←→  Kabupaten CSV (hapus "Kab.", "Kabupaten", "Kota")
 *      Kecamatan DB ←→  Kecamatan CSV (normalize)
 * 4. Generate kode_wilayah kelurahan (8 digit buatan):
 *      [2d provinsi][2d kota][2d kecamatan][2d increment per kecamatan]
 * 5. Anti-duplikat, laporan detail
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

// ─── Konfigurasi ──────────────────────────────────────────────────────────────

const DATASET_DIR = path.resolve("scripts/dataset");

// ─── Tipe data CSV ─────────────────────────────────────────────────────────────

interface CsvRow {
  code: string;
  parent_code: string;
  name: string;
}

// Hierarchy yang sudah di-resolve dari CSV
interface DesaHierarchy {
  desaName: string;
  kecamatanName: string;
  kotaName: string; // nama kabupaten/kota dari CSV
  provinsiName: string;
  kecamatanCode: string; // 7 digit dari CSV
}

// ─── Laporan ──────────────────────────────────────────────────────────────────

interface SyncReport {
  total_csv: number;
  hierarchy_tidak_lengkap: number;
  provinsi_tidak_ditemukan: number;
  kota_tidak_ditemukan: number;
  kecamatan_tidak_ditemukan: number;
  berhasil: number;
  duplikat: number;
  gagal: number;
  detail_gagal: { nama: string; path: string; alasan: string }[];
  kecamatan_miss: Set<string>;
  kota_miss: Set<string>;
  provinsi_miss: Set<string>;
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
  const sep = "═".repeat(68);
  console.log(`\n${sep}`);
  console.log("  📊  LAPORAN SINKRONISASI KELURAHAN / DESA");
  console.log(sep);
  console.log(
    `  Total baris CSV         : ${report.total_csv.toLocaleString()}`,
  );
  console.log(
    `  ✅ Berhasil disimpan    : ${report.berhasil.toLocaleString()}`,
  );
  console.log(
    `  ⚠️  Duplikat (skip)     : ${report.duplikat.toLocaleString()}`,
  );
  console.log(
    `  🔸 Hierarchy tdk lengkap: ${report.hierarchy_tidak_lengkap.toLocaleString()}`,
  );
  console.log(
    `  🔍 Provinsi tdk match   : ${report.provinsi_tidak_ditemukan.toLocaleString()}`,
  );
  console.log(
    `  🔍 Kota/Kab tdk match  : ${report.kota_tidak_ditemukan.toLocaleString()}`,
  );
  console.log(
    `  🔍 Kecamatan tdk match : ${report.kecamatan_tidak_ditemukan.toLocaleString()}`,
  );
  console.log(`  ❌ Gagal insert         : ${report.gagal.toLocaleString()}`);

  if (report.provinsi_miss.size > 0) {
    console.log(
      `\n  Nama provinsi dari CSV yang tidak match di DB (${report.provinsi_miss.size}):`,
    );
    [...report.provinsi_miss]
      .slice(0, 20)
      .forEach((n) => console.log(`    · "${n}"`));
  }
  if (report.kota_miss.size > 0) {
    console.log(
      `\n  Nama kab/kota dari CSV yang tidak match di DB (${report.kota_miss.size}):`,
    );
    [...report.kota_miss]
      .slice(0, 20)
      .forEach((n) => console.log(`    · "${n}"`));
  }
  if (report.kecamatan_miss.size > 0) {
    console.log(
      `\n  Nama kecamatan dari CSV yang tidak match di DB (${report.kecamatan_miss.size}):`,
    );
    [...report.kecamatan_miss]
      .slice(0, 30)
      .forEach((n) => console.log(`    · "${n}"`));
    if (report.kecamatan_miss.size > 30)
      console.log(`    ... dan ${report.kecamatan_miss.size - 30} lainnya.`);
  }
  if (report.detail_gagal.length > 0) {
    console.log(`\n  Gagal insert (${report.detail_gagal.length}):`);
    report.detail_gagal
      .slice(0, 20)
      .forEach((d) => console.log(`    · [${d.path}] ${d.nama} — ${d.alasan}`));
  }

  console.log(`${sep}\n`);
}

/**
 * Normalisasi nama wilayah:
 * - Uppercase
 * - Hapus prefix: "Prov.", "Provinsi", "Kab.", "Kabupaten", "Kota", "Ko.", "Kec."
 * - Trim & kolaps spasi ganda
 */
function normalisasi(nama: string): string {
  return nama
    .toUpperCase()
    .replace(
      /^(PROV\.|PROVINSI|KAB\.|KABUPATEN|KOTA|KO\.|KEC\.|KECAMATAN)\s+/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse CSV dengan readline (stream).
 */
async function parseCsv(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });
    let isHeader = true;
    rl.on("line", (line) => {
      if (isHeader) {
        isHeader = false;
        return;
      }
      const trimmed = line.trim();
      if (!trimmed) return;
      const idx = trimmed.indexOf(",");
      const idx2 = trimmed.indexOf(",", idx + 1);
      if (idx < 0 || idx2 < 0) return;
      rows.push({
        code: trimmed.substring(0, idx).trim(),
        parent_code: trimmed.substring(idx + 1, idx2).trim(),
        name: trimmed.substring(idx2 + 1).trim(),
      });
    });
    rl.on("close", () => resolve(rows));
    rl.on("error", reject);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const report: SyncReport = {
    total_csv: 0,
    hierarchy_tidak_lengkap: 0,
    provinsi_tidak_ditemukan: 0,
    kota_tidak_ditemukan: 0,
    kecamatan_tidak_ditemukan: 0,
    berhasil: 0,
    duplikat: 0,
    gagal: 0,
    detail_gagal: [],
    kecamatan_miss: new Set(),
    kota_miss: new Set(),
    provinsi_miss: new Set(),
  };

  try {
    log("INFO", "Memulai sinkronisasi Kelurahan/Desa (name-based matching)…");

    // ── 1. Baca 4 file CSV ────────────────────────────────────────────────────
    log("INFO", "Membaca file CSV…");
    const [provinsiCsv, kabupatenCsv, kecamatanCsv, desaCsv] =
      await Promise.all([
        parseCsv(path.join(DATASET_DIR, "provinsi.csv")),
        parseCsv(path.join(DATASET_DIR, "kabupaten.csv")),
        parseCsv(path.join(DATASET_DIR, "kecamatan.csv")),
        parseCsv(path.join(DATASET_DIR, "desa.csv")),
      ]);
    log(
      "INFO",
      `CSV: provinsi=${provinsiCsv.length} · kab=${kabupatenCsv.length} · kec=${kecamatanCsv.length} · desa=${desaCsv.length.toLocaleString()}`,
    );
    report.total_csv = desaCsv.length;

    // ── 2. Build lookup maps dari CSV ─────────────────────────────────────────
    // Map: kode → nama (dari masing-masing CSV)
    const provinsiCsvMap = new Map<string, string>(); // code → name
    provinsiCsv.forEach((r) => provinsiCsvMap.set(r.code, r.name));

    const kabupatenCsvMap = new Map<string, { name: string; parent: string }>();
    kabupatenCsv.forEach((r) =>
      kabupatenCsvMap.set(r.code, { name: r.name, parent: r.parent_code }),
    );

    const kecamatanCsvMap = new Map<string, { name: string; parent: string }>();
    kecamatanCsv.forEach((r) =>
      kecamatanCsvMap.set(r.code, { name: r.name, parent: r.parent_code }),
    );

    // ── 3. Load semua data DB ke memory ───────────────────────────────────────
    log("INFO", "Memuat data wilayah dari database…");

    const dbProvinsiList = await prisma.m_provinsi.findMany();
    const dbKotaList = await prisma.m_kota.findMany({
      include: { m_provinsi: true },
    });
    const dbKecamatanList = await prisma.m_kecamatan.findMany({
      include: { m_kota: { include: { m_provinsi: true } } },
    });

    log(
      "INFO",
      `DB: provinsi=${dbProvinsiList.length} · kota=${dbKotaList.length} · kecamatan=${dbKecamatanList.length}`,
    );

    // Map DB: normalisasi(nama) → id
    // Provinsi: normNama → { id }
    const dbProvinsiMap = new Map<string, bigint>();
    dbProvinsiList.forEach((p) => {
      dbProvinsiMap.set(normalisasi(p.nama), p.id);
    });

    // Kota: `provId_normNamaKota` → { id }
    const dbKotaMap = new Map<string, bigint>();
    dbKotaList.forEach((k) => {
      const provId = k.m_provinsi_id?.toString() ?? "0";
      dbKotaMap.set(`${provId}__${normalisasi(k.nama)}`, k.id);
    });

    // Kecamatan: `kotaId_normNamaKec` → { id, kode }
    const dbKecamatanMap = new Map<string, { id: bigint }>();
    dbKecamatanList.forEach((kec) => {
      const kotaId = kec.m_kota_id?.toString() ?? "0";
      dbKecamatanMap.set(`${kotaId}__${normalisasi(kec.nama)}`, { id: kec.id });
    });

    // ── 4. Inisialisasi counter kode dari kelurahan yang sudah ada ─────────────
    log("INFO", "Inisialisasi counter kode kelurahan yang sudah ada di DB…");
    const existingKelurahan = await prisma.m_kelurahan.findMany({
      select: { kode_wilayah: true, m_kecamatan_id: true },
    });
    // Map: kecamatan_id → max_urutan (2 digit terakhir)
    const counterPerKecamatan = new Map<string, number>();
    for (const kel of existingKelurahan) {
      const kode = kel.kode_wilayah;
      if (!kel.m_kecamatan_id) continue;
      const kecId = kel.m_kecamatan_id.toString();
      if (kode.length >= 2) {
        const urutan = parseInt(kode.slice(-2), 10);
        if (!isNaN(urutan)) {
          const current = counterPerKecamatan.get(kecId) ?? 0;
          if (urutan > current) counterPerKecamatan.set(kecId, urutan);
        }
      }
    }

    // Map kecamatan_id → kode prefix (untuk generate kode_wilayah)
    // Kita ambil dari kecamatan DB yang punya kota & provinsi
    // prefix = urutan-nya di dalam kota (2digit) + urutan kota dalam provinsi (2digit) + urutan provinsi (2digit)
    // Tapi untuk prefix 6 digit, kita gunakan urutan sederhana berbasis id DB
    // Karena kode wilayah Kemendikbud berbeda, kita pakai urutan autoincrement dari id DB

    // Helper: dapatkan prefix 6 digit dari kecamatan DB
    // Format: [2d urutan provinsi][2d urutan kota dalam provinsi][2d urutan kecamatan dalam kota]
    // Kita buat lookup: kecamatanId → prefix6
    const kecamatanPrefixMap = new Map<string, string>();
    // Urutkan provinsi berdasarkan id
    const sortedProvinsiDB = [...dbProvinsiList].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );
    const kotaByProvinsi = new Map<string, typeof dbKotaList>();
    dbKotaList.forEach((k) => {
      const pId = k.m_provinsi_id?.toString() ?? "0";
      if (!kotaByProvinsi.has(pId)) kotaByProvinsi.set(pId, []);
      kotaByProvinsi.get(pId)!.push(k);
    });
    const kecamatanByKota = new Map<string, typeof dbKecamatanList>();
    dbKecamatanList.forEach((kec) => {
      const kId = kec.m_kota_id?.toString() ?? "0";
      if (!kecamatanByKota.has(kId)) kecamatanByKota.set(kId, []);
      kecamatanByKota.get(kId)!.push(kec);
    });

    let provIdx = 0;
    for (const prov of sortedProvinsiDB) {
      provIdx++;
      const kotaList = (kotaByProvinsi.get(prov.id.toString()) ?? []).sort(
        (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
      );
      let kotaIdx = 0;
      for (const kota of kotaList) {
        kotaIdx++;
        const kecList = (kecamatanByKota.get(kota.id.toString()) ?? []).sort(
          (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
        );
        let kecIdx = 0;
        for (const kec of kecList) {
          kecIdx++;
          const prefix6 =
            String(provIdx).padStart(2, "0") +
            String(kotaIdx).padStart(2, "0") +
            String(kecIdx).padStart(2, "0");
          kecamatanPrefixMap.set(kec.id.toString(), prefix6);
        }
      }
    }

    log(
      "INFO",
      `Prefix kode dibangun untuk ${kecamatanPrefixMap.size} kecamatan.`,
    );

    // ── 5. Proses setiap desa ─────────────────────────────────────────────────
    log("INFO", "Mulai proses insert kelurahan berdasarkan nama…\n");

    let processed = 0;

    for (const desa of desaCsv) {
      processed++;
      if (processed % 2000 === 0) {
        log(
          "INFO",
          `Progress: ${processed.toLocaleString()}/${desaCsv.length.toLocaleString()} — ✅${report.berhasil} ⚠️${report.duplikat} ❌${report.gagal} 🔍${report.kecamatan_tidak_ditemukan}`,
        );
      }

      const desaNama = desa.name.trim();
      const kecCode = desa.parent_code.trim();

      // Resolusi hierarchy dari CSV
      const kecData = kecamatanCsvMap.get(kecCode);
      if (!kecData) {
        report.hierarchy_tidak_lengkap++;
        continue;
      }
      const kabData = kabupatenCsvMap.get(kecData.parent);
      if (!kabData) {
        report.hierarchy_tidak_lengkap++;
        continue;
      }
      const provNamaCsv = provinsiCsvMap.get(kabData.parent);
      if (!provNamaCsv) {
        report.hierarchy_tidak_lengkap++;
        continue;
      }

      const kecNamaCsv = kecData.name;
      const kotaNamaCsv = kabData.name;

      // Match ke DB — Provinsi
      const normProv = normalisasi(provNamaCsv);
      const dbProvId = dbProvinsiMap.get(normProv);
      if (!dbProvId) {
        report.provinsi_tidak_ditemukan++;
        report.provinsi_miss.add(`${provNamaCsv} (norm: ${normProv})`);
        continue;
      }

      // Match ke DB — Kota
      const normKota = normalisasi(kotaNamaCsv);
      const dbKotaId = dbKotaMap.get(`${dbProvId.toString()}__${normKota}`);
      if (!dbKotaId) {
        report.kota_tidak_ditemukan++;
        report.kota_miss.add(
          `${kotaNamaCsv} in ${provNamaCsv} (norm: ${normKota})`,
        );
        continue;
      }

      // Match ke DB — Kecamatan
      const normKec = normalisasi(kecNamaCsv);
      const dbKecData = dbKecamatanMap.get(
        `${dbKotaId.toString()}__${normKec}`,
      );
      if (!dbKecData) {
        report.kecamatan_tidak_ditemukan++;
        report.kecamatan_miss.add(
          `${kecNamaCsv} in ${kotaNamaCsv} (norm: ${normKec})`,
        );
        continue;
      }

      const dbKecId = dbKecData.id;
      const kecIdStr = dbKecId.toString();

      // Generate kode_wilayah kelurahan
      const prefix6 = kecamatanPrefixMap.get(kecIdStr) ?? "000000";
      const urutan = (counterPerKecamatan.get(kecIdStr) ?? 0) + 1;
      counterPerKecamatan.set(kecIdStr, urutan);
      const kodeKelurahan = `${prefix6}${String(urutan).padStart(2, "0")}`;

      const pathStr = `${provNamaCsv} / ${kotaNamaCsv} / ${kecNamaCsv}`;

      try {
        // Cek duplikat berdasarkan nama + kecamatan (lebih aman dari kode yang kita generate)
        const existingByNama = await prisma.m_kelurahan.findFirst({
          where: {
            m_kecamatan_id: dbKecId,
            nama: { equals: desaNama, mode: "insensitive" },
          },
        });
        if (existingByNama) {
          report.duplikat++;
          if (report.duplikat <= 5) {
            log(
              "WARN",
              `Duplikat — "${desaNama}" di kecamatan id=${dbKecId}, skip.`,
            );
          }
          // Rollback counter karena tidak jadi dipakai
          counterPerKecamatan.set(kecIdStr, urutan - 1);
          continue;
        }

        // Juga cek kode_wilayah tidak tabrakan
        const existingByKode = await prisma.m_kelurahan.findUnique({
          where: { kode_wilayah: kodeKelurahan },
        });
        if (existingByKode) {
          // Kode sudah ada (kemungkinan kecil), increment lagi
          const uratuanBaru = urutan + 1;
          counterPerKecamatan.set(kecIdStr, uratuanBaru);
          // Insert dengan kode baru
        }

        const created = await prisma.m_kelurahan.create({
          data: {
            kode_wilayah: kodeKelurahan,
            nama: desaNama,
            m_kecamatan_id: dbKecId,
          },
        });

        report.berhasil++;
        if (report.berhasil <= 5 || report.berhasil % 1000 === 0) {
          log("SUCCESS", `[${kodeKelurahan}] ${desaNama} → ${pathStr}`);
        }
      } catch (err) {
        const alasan = err instanceof Error ? err.message : String(err);
        // Rollback counter
        counterPerKecamatan.set(kecIdStr, urutan - 1);
        log("ERROR", `Gagal [${kodeKelurahan}] ${desaNama}: ${alasan}`);
        report.gagal++;
        report.detail_gagal.push({ nama: desaNama, path: pathStr, alasan });
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
