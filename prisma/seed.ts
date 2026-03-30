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

import { elasticClient, deleteAllDocuments } from "../lib/elasticsearch";
import { produceCacheInvalidate } from "../lib/kafka";
import { ALL_ELASTIC_INDICES, REDIS_KEYS } from "../lib/constants/key";

// Gunakan DIRECT_URL (koneksi langsung ke PostgreSQL) untuk seeding,
// bukan DATABASE_URL yang mengarah ke PgBouncer.
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");
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
  console.log("Seeding completed!");

  // ── Post-seed: Clear all Elasticsearch documents ──────────────────
  console.log("\nClearing all Elasticsearch indices...");
  for (const index of ALL_ELASTIC_INDICES) {
    await deleteAllDocuments(index);
  }
  console.log("All Elasticsearch indices cleared. CDC will re-index from WAL.");

  // ── Post-seed: Invalidate all Redis cache via Kafka ───────────────
  console.log("\nPublishing cache revalidation via Kafka...");
  const allPrefixes = Object.values(REDIS_KEYS).flatMap((entity) => {
    const prefixes: string[] = [];
    if ("ALL_PREFIX" in entity && typeof entity.ALL_PREFIX === "string") {
      prefixes.push(entity.ALL_PREFIX);
    }
    if ("ALL" in entity && typeof entity.ALL === "string") {
      prefixes.push(`${entity.ALL}:*`);
    }
    if ("SINGLE" in entity && typeof entity.SINGLE === "function") {
      // Invalidate some common single keys (1-100 range covers most seeded data)
      // The prefix approach handles this via ALL_PREFIX
    }
    return prefixes;
  });

  for (const prefix of allPrefixes) {
    await produceCacheInvalidate(prefix);
  }
  console.log(
    `Cache revalidation published for ${allPrefixes.length} prefixes.`,
  );
  console.log(
    "\nNote: CDC consumer must be running to re-index data into Elasticsearch.",
  );
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
