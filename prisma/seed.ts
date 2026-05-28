import "./env";

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
import { seedRapatNotulen } from "./seeds/13-rapat-notulen";

import { invalidateCachePrefix } from "../lib/redis";

import {
  REDIS_KEYS,
} from "../lib/constants/key";

// ─── Prisma Setup ─────────────────────────────────────────────────────────────

// Gunakan DIRECT_URL (koneksi langsung ke PostgreSQL) untuk seeding,
// bukan DATABASE_URL yang mengarah ke PgBouncer.
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });



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
    REDIS_KEYS.RAPAT.ALL_PREFIX,
    REDIS_KEYS.NOTULEN.ALL_PREFIX,
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
  await seedRapatNotulen(prisma);

  console.log("\n✅ Seeding database selesai!");

  // ── Post-seed: Invalidasi semua Redis cache ───────────────────────
  await invalidateRedisCache();

  console.log("═".repeat(60));
  console.log("  ✅  SEED + CACHE INVALIDATION SELESAI");
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
