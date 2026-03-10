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
  await seedHakAkses(prisma);
  await seedKategoriSponsor(prisma);
  await seedSkalaPerusahaan(prisma);
  await seedSektorIndustri(prisma);
  await seedBidangBrand(prisma);
  await seedKategoriBrand(prisma);
  console.log("Seeding completed!");
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
