/**
 * ============================================================
 * SYNC SEKOLAH — Sinkronisasi data Sekolah dari API Kemendikbud
 * ============================================================
 * Cara jalankan:
 *   npm run sync:sekolah
 *
 * Untuk sync kota tertentu (contoh Surakarta):
 *   npm run sync:sekolah -- "Kota Surakarta"
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

// ─── Konfigurasi ──────────────────────────────────────────────────────────────

const API_SEARCH =
  "https://sekolah.data.kemendikdasmen.go.id/v1/sekolah-service/sekolah/cari-sekolah";
const API_DETAIL =
  "https://sekolah.data.kemendikdasmen.go.id/v1/sekolah-service/sekolah/full-detail";

const DELAY_MS = 200;
const PAGE_SIZE = 50;

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

function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(
      /^(PROV\.|PROVINSI|KAB\.|KABUPATEN|KOTA|KO\.|KEC\.|KECAMATAN)\s+/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function capitalizeWords(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const args = process.argv.slice(2);
    const targetKotaName = args.length > 0 ? args[0] : null;

    log("INFO", "Memuat data referensi dari database...");

    // 1. Load Jenjang mapping
    const jenjangList = await prisma.m_jenjang.findMany({
      select: { id: true, nama: true },
    });
    const jenjangMap = new Map<string, bigint>();
    for (const j of jenjangList) {
      jenjangMap.set(j.nama.toUpperCase().trim(), j.id);
    }

    // 2. Load Kota & Kecamatan
    const kotaList = await prisma.m_kota.findMany({
      where: targetKotaName
        ? { nama: { contains: targetKotaName, mode: "insensitive" } }
        : undefined,
      include: { m_provinsi: true, m_kecamatan: true },
      orderBy: targetKotaName ? undefined : { kode_wilayah: "asc" },
    });

    if (kotaList.length === 0) {
      log("WARN", "Tidak ada kota yang ditemukan untuk di-sync.");
      return;
    }

    log("INFO", `Akan memproses ${kotaList.length} kota/kabupaten.`);

    for (const kota of kotaList) {
      const provinsi = kota.m_provinsi;
      if (!provinsi) {
        log("WARN", `Kota ${kota.nama} tidak memiliki provinsi, skip.`);
        continue;
      }

      // Buat lookup kecamatan berdasarkan nama normalisasi
      const kecamatanMap = new Map<string, (typeof kota.m_kecamatan)[0]>();
      for (const kec of kota.m_kecamatan) {
        kecamatanMap.set(normalizeName(kec.nama), kec);
      }

      log("INFO", `=====================================================`);
      log("INFO", `Mulai proses: [${kota.kode_wilayah}] ${kota.nama}`);

      let page = 0;
      let totalSekolah = 0;
      let sekolahProcessed = 0;
      let hasMore = true;

      while (hasMore) {
        log(
          "INFO",
          `  Fetching pencarian halaman ${page} untuk ${kota.nama}...`,
        );

        try {
          const fs = require("fs");
          const { execSync } = require("child_process");
          const path = require("path");

          const payloadObj = {
            page: page.toString(),
            size: PAGE_SIZE.toString(),
            keyword: "",
            kabupaten_kota: kota.nama,
            bentuk_pendidikan: "",
            status_sekolah: "",
          };

          const tempPayloadPath = path.join(process.cwd(), ".temp_payload.json");
          fs.writeFileSync(tempPayloadPath, JSON.stringify(payloadObj));
          
          const curlSearch = `curl -s -L -X POST -H "Content-Type: application/json" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" -H "Referer: https://sekolah.data.kemendikdasmen.go.id/" -d @"${tempPayloadPath}" "${API_SEARCH}"`;
          const resultSearch = execSync(curlSearch, { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024, timeout: 30000 });
          
          // Cleanup temp file
          try { fs.unlinkSync(tempPayloadPath); } catch (e) {}
          
          let searchData;
          try {
            searchData = JSON.parse(resultSearch);
            if (page === 0) {
              log("INFO", `[DEBUG] Raw response: ${resultSearch.substring(0, 200)}`);
            }
          } catch (e: any) {
            throw new Error(`Search API Invalid JSON: ${resultSearch.substring(0, 100)}...`);
          }

          if (searchData.status_code !== 200) {
            throw new Error(`Search API Error: ${searchData.message}`);
          }

          const items = searchData.data || [];
          if (page === 0) totalSekolah = searchData.total || 0;

          if (items.length === 0) {
            hasMore = false;
            break;
          }

          // Proses tiap sekolah dalam list pencarian
          for (const item of items) {
            const sekolahId = item.sekolah_id;
            const namaSekolah = item.nama;

            // Cek apakah sudah ada (anti-duplikat)
            const existing = await prisma.m_sekolah.findUnique({
              where: { kode_sekolah: sekolahId },
            });

            if (existing) {
              log(
                "WARN",
                `  Duplikat: ${namaSekolah} (${sekolahId}) sudah ada di DB.`,
              );
              sekolahProcessed++;
              continue;
            }

            // Ambil Detail dari endpoint kedua
            await delay(DELAY_MS);
            let detailData = null;
            try {
              const { execSync } = require("child_process");
              const curlDetail = `curl -s -L -H "Accept: application/json" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" -H "Referer: https://sekolah.data.kemendikdasmen.go.id/" "${API_DETAIL}/${sekolahId}"`;
              const resultDetail = execSync(curlDetail, { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024, timeout: 30000 });
              
              let detailJson;
              try {
                detailJson = JSON.parse(resultDetail);
              } catch (e: any) {
                throw new Error(`Detail API Invalid JSON: ${resultDetail.substring(0, 100)}...`);
              }
              detailData = detailJson?.data;
            } catch (err) {
              log(
                "ERROR",
                `  Gagal fetch detail ${namaSekolah}: ${(err as Error).message}`,
              );
              // Lanjut dengan detail kosong atau skip
            }

            // --- Mulai Mapping Field ---
            const dSekolah = detailData?.sekolah?.[0] || item; // Fallback ke item cari jika detail gagal

            // Resolve Relasi
            const normKec = normalizeName(
              item.kecamatan || dSekolah.kecamatan || "",
            );
            const matchedKec = kecamatanMap.get(normKec);

            const bentukPd = (
              item.bentuk_pendidikan ||
              dSekolah.bentuk_pendidikan ||
              ""
            )
              .toUpperCase()
              .trim();
            const matchedJenjangId = jenjangMap.get(bentukPd);

            const npsnVal = item.npsn || dSekolah.npsn;
            const kodePosVal = item.kode_pos || dSekolah.kode_pos;

            // Transaksi untuk insert parent & child terpisah agar aman
            try {
              const newSekolah = await prisma.m_sekolah.create({
                data: {
                  kode_wilayah_induk_provinsi: provinsi.kode_wilayah,
                  kode_wilayah_induk_kota: kota.kode_wilayah,
                  kode_wilayah_induk_kecamatan: matchedKec
                    ? matchedKec.kode_wilayah
                    : null,
                  kode_sekolah: sekolahId,
                  m_jenjang_id: matchedJenjangId,
                  jenis_sekolah: capitalizeWords(
                    item.status_sekolah || dSekolah.status_sekolah || "",
                  ),
                  nama: namaSekolah,
                  alamat: item.alamat_jalan || dSekolah.alamat_jalan,
                  npsn: npsnVal,
                  email: dSekolah.email,
                  website: dSekolah.website,
                  phone: dSekolah.nomor_telepon,
                  kode_pos: kodePosVal,
                  rt: item.rt?.toString() || dSekolah.rt?.toString() || null,
                  rw: item.rw?.toString() || dSekolah.rw?.toString() || null,
                  bujur:
                    item.bujur?.toString() ||
                    dSekolah.bujur?.toString() ||
                    null,
                  lintang:
                    item.lintang?.toString() ||
                    dSekolah.lintang?.toString() ||
                    null,
                  akreditasi: item.akreditasi || dSekolah.akreditasi,
                },
              });

              // Jika ada detail, kita insert
              if (detailData) {
                const ptk = detailData.ptk?.[0] || {};
                const rasio = detailData.rasio_siswa?.[0] || {};
                const guruPct = detailData.persentase_guru?.[0] || {};
                const ruangLayak =
                  detailData.persentase_ruang_kelas_layak?.[0] || {};
                const kepsek = detailData.kepala_sekolah?.[0]?.nama;
                const ops = detailData.operator_sekolah?.[0]?.nm_ops;

                // Siapkan data foto
                const fotos: Array<{ path_file: string; urutan: number }> = [];
                if (
                  detailData.foto_sekolah &&
                  Array.isArray(detailData.foto_sekolah)
                ) {
                  let urutan = 1;
                  for (const f of detailData.foto_sekolah) {
                    if (f.path_file) {
                      fotos.push({ path_file: f.path_file, urutan: urutan++ });
                    }
                  }
                }

                await prisma.m_sekolah_detail.create({
                  data: {
                    m_sekolah_id: newSekolah.id,
                    luas_tanah_milik: dSekolah.luas_tanah_milik
                      ? Number(dSekolah.luas_tanah_milik)
                      : 0,
                    luas_tanah_bukan_milik: dSekolah.luas_tanah_bukan_milik
                      ? Number(dSekolah.luas_tanah_bukan_milik)
                      : 0,
                    daya_listrik: dSekolah.daya_listrik
                      ? Number(dSekolah.daya_listrik)
                      : 0,
                    sumber_listrik: dSekolah.sumber_listrik,
                    akses_internet: dSekolah.akses_internet,
                    akses_internet_2: dSekolah.akses_internet_2,
                    nama_kepala_sekolah: kepsek,
                    nama_operator_sekolah: ops,
                    jumlah_guru_laki: ptk.ptk_guru_l
                      ? Number(ptk.ptk_guru_l)
                      : 0,
                    jumlah_guru_perempuan: ptk.ptk_guru_p
                      ? Number(ptk.ptk_guru_p)
                      : 0,
                    total_siswa: rasio.jml_pd ? Number(rasio.jml_pd) : 0,
                    total_siswa_laki: rasio.jml_pd_l
                      ? Number(rasio.jml_pd_l)
                      : 0,
                    total_siswa_perempuan: rasio.jml_pd_p
                      ? Number(rasio.jml_pd_p)
                      : 0,
                    persentase_guru_klasifikasi:
                      guruPct.persentase_guru_klasifikasi,
                    persentase_guru_sertifikasi:
                      guruPct.persentase_guru_sertifikasi,
                    persentase_guru_asn: guruPct.persentase_guru_ASN,
                    persentase_ruang_kelas_layak: ruangLayak.rasio,
                    m_sekolah_foto:
                      fotos.length > 0
                        ? {
                            create: fotos,
                          }
                        : undefined,
                  },
                });
              }

              log(
                "SUCCESS",
                `  Tersimpan: ${namaSekolah} (NPSN: ${npsnVal || "-"})`,
              );
            } catch (dbErr) {
              log(
                "ERROR",
                `  Gagal simpan ke DB ${namaSekolah}: ${(dbErr as Error).message}`,
              );
            }

            sekolahProcessed++;
            await delay(DELAY_MS);
          }

          if ((page + 1) * PAGE_SIZE >= totalSekolah) {
            hasMore = false; // Selesai untuk kota ini
          } else {
            page++;
          }
        } catch (err) {
          log(
            "ERROR",
            `Gagal memproses pagenation di ${kota.nama}: ${(err as Error).message}`,
          );
          hasMore = false; // Hindari endless loop jika API fail terus
        }
      }

      log(
        "INFO",
        `Selesai memproses Kota ${kota.nama}. Total sekolah dikerjakan: ${sekolahProcessed}`,
      );
      await delay(DELAY_MS * 3); // Jeda agak lama antara transisi kota
    }
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
