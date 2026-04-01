import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { seedLevels } from "./seeds/01-level";
import { seedJabatans } from "./seeds/02-jabatan";
import { seedUsers } from "./seeds/03-user";
import { seedHakAkses } from "./seeds/04-hak-akses";
import { seedKategoriSponsor } from "./seeds/05-kategori-sponsor";
import { seedSkalaPerusahaan } from "./seeds/06-skala-perusahaan";
import { seedSektorIndustri } from "./seeds/07-sektor-industri";
import { seedBidangBrand } from "./seeds/08-bidang-brand";
import { seedKategoriBrand } from "./seeds/09-kategori-brand";
import { seedPerusahaan } from "./seeds/10-perusahaan";
import { seedOrganisasi } from "./seeds/11-organisasi";
import { seedNews } from "./seeds/12-news";

import {
  deleteAllDocuments,
  bulkIndex,
  ensureIndex,
} from "../lib/elasticsearch";
import { invalidateCachePrefix } from "../lib/redis";

import {
  ALL_ELASTIC_INDICES,
  ELASTIC_INDICES,
  REDIS_KEYS,
} from "../lib/constants/key";

// ─── Prisma Setup ─────────────────────────────────────────────────────────────

// Gunakan DIRECT_URL (koneksi langsung ke PostgreSQL) untuk seeding,
// bukan DATABASE_URL yang mengarah ke PgBouncer.
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Post-seed: Bulk Reindex ke Elasticsearch ─────────────────────────────────

async function reindexAll() {
  console.log(
    "\n── Post-seed: Reindex semua data ke Elasticsearch ───────────────",
  );

  const reindex = async (
    label: string,
    indexName: string,
    records: Record<string, unknown>[],
  ) => {
    if (records.length === 0) {
      console.log(`  ⚠️  ${label}: tidak ada data, lewati.`);
      return;
    }
    await ensureIndex(indexName);
    const docs = records.map((r) => ({
      id: String((r as any).id),
      doc: r,
    }));
    await bulkIndex(indexName, docs);
    console.log(`  ✅ ${label}: ${records.length} dokumen → "${indexName}"`);
  };

  await reindex(
    "Levels",
    ELASTIC_INDICES.LEVELS,
    (await prisma.m_level.findMany()) as any[],
  );
  await reindex(
    "Jabatans",
    ELASTIC_INDICES.JABATANS,
    (await prisma.m_jabatan.findMany()) as any[],
  );
  await reindex(
    "Users",
    ELASTIC_INDICES.USERS,
    (await prisma.m_user.findMany()) as any[],
  );
  await reindex(
    "Hak Akses",
    ELASTIC_INDICES.HAK_AKSES,
    (await prisma.m_hak_akses.findMany()) as any[],
  );
  await reindex(
    "Hak Akses Rules",
    ELASTIC_INDICES.HAK_AKSES_RULE,
    (await prisma.m_hak_akses_rule.findMany()) as any[],
  );
  await reindex(
    "Kategori Sponsor",
    ELASTIC_INDICES.KATEGORI_SPONSOR,
    (await prisma.m_kategori_sponsor.findMany()) as any[],
  );
  await reindex(
    "Skala Perusahaan",
    ELASTIC_INDICES.SKALA_PERUSAHAAN,
    (await prisma.m_skala_perusahaan.findMany()) as any[],
  );
  await reindex(
    "Sektor Industri",
    ELASTIC_INDICES.SEKTOR_INDUSTRI,
    (await prisma.m_sektor_industri.findMany()) as any[],
  );
  await reindex(
    "Bidang Brand",
    ELASTIC_INDICES.BIDANG_BRAND,
    (await prisma.m_bidang_brand.findMany()) as any[],
  );
  await reindex(
    "Kategori Brand",
    ELASTIC_INDICES.KATEGORI_BRAND,
    (await prisma.m_kategori_brand.findMany()) as any[],
  );
  await reindex(
    "Perusahaan",
    ELASTIC_INDICES.PERUSAHAAN,
    (await prisma.m_perusahaan.findMany()) as any[],
  );
  await reindex(
    "Organisasi",
    ELASTIC_INDICES.ORGANISASI,
    (await prisma.m_organisasi.findMany()) as any[],
  );
  await reindex(
    "Kategori Berita",
    ELASTIC_INDICES.KATEGORI_BERITA,
    (await prisma.m_kategori_berita.findMany()) as any[],
  );
  await reindex(
    "Berita",
    ELASTIC_INDICES.BERITA,
    (await prisma.c_berita.findMany()) as any[],
  );

  console.log(
    "── Reindex selesai ───────────────────────────────────────────\n",
  );
}

// ─── Post-seed: Invalidasi Redis Cache ───────────────────────────────────────

async function invalidateRedisCache() {
  console.log(
    "\n── Post-seed: Invalidasi Redis Cache ────────────────────────────",
  );

  // Kumpulkan semua prefix ALL_PREFIX dari setiap entity
  const prefixes: string[] = [
    REDIS_KEYS.LEVELS.ALL_PREFIX,
    REDIS_KEYS.JABATANS.ALL_PREFIX,
    REDIS_KEYS.USERS.ALL_PREFIX,
    REDIS_KEYS.HAK_AKSES.ALL_PREFIX,
    REDIS_KEYS.ORGANISASI.ALL_PREFIX,
    REDIS_KEYS.SEKTOR_INDUSTRI.ALL_PREFIX,
    REDIS_KEYS.SKALA_PERUSAHAAN.ALL_PREFIX,
    REDIS_KEYS.PERUSAHAAN.ALL_PREFIX,
    REDIS_KEYS.PROVINSI.ALL_PREFIX,
    REDIS_KEYS.KOTA.ALL_PREFIX,
    REDIS_KEYS.KECAMATAN.ALL_PREFIX,
    REDIS_KEYS.KELURAHAN.ALL_PREFIX,
    REDIS_KEYS.BERITA.ALL_PREFIX,
    REDIS_KEYS.KATEGORI_BERITA.ALL_PREFIX,
  ];

  for (const prefix of prefixes) {
    await invalidateCachePrefix(prefix);
    console.log(`  ✅ Invalidasi: ${prefix}`);
  }

  console.log(
    `── Cache invalidation selesai (${prefixes.length} prefix) ────────\n`,
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═".repeat(60));
  console.log("  🌱  SEEDING DATABASE");
  console.log("═".repeat(60));

  // ── Pre-seed: Kosongkan semua Elasticsearch indices ──────────────
  console.log("\nMembersihkan semua Elasticsearch indices...");
  for (const index of ALL_ELASTIC_INDICES) {
    await deleteAllDocuments(index);
  }
  console.log("✅ Semua Elasticsearch indices telah dikosongkan.\n");

  // ── Seed data ke database ─────────────────────────────────────────
  await seedLevels(prisma);
  await seedJabatans(prisma);
  await seedUsers(prisma);
  await seedNews(prisma);
  await seedHakAkses(prisma);
  await seedKategoriSponsor(prisma);
  await seedSkalaPerusahaan(prisma);
  await seedSektorIndustri(prisma);
  await seedBidangBrand(prisma);
  await seedKategoriBrand(prisma);
  await seedPerusahaan(prisma);
  await seedOrganisasi(prisma);

  console.log("\n✅ Seeding database selesai!");

  // ── Post-seed: Bulk reindex semua data ke Elasticsearch ──────────
  await reindexAll();

  // ── Post-seed: Invalidasi semua Redis cache ───────────────────────
  await invalidateRedisCache();

  console.log("═".repeat(60));
  console.log("  ✅  SEED + REINDEX + CACHE INVALIDATION SELESAI");
  console.log("═".repeat(60) + "\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
