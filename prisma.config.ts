// Prisma config menggunakan DIRECT_URL untuk koneksi langsung ke PostgreSQL.
// DATABASE_URL (PgBouncer) digunakan oleh aplikasi (runtime via adapter),
// DIRECT_URL digunakan oleh Prisma CLI (migrate, studio, generate) karena
// PgBouncer tidak mendukung prepared statements yang dibutuhkan CLI Prisma.
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Muat .env.development secara eksplisit karena Prisma CLI tidak menggunakan
// dotenv default yang hanya membaca file `.env` biasa.
dotenv.config({ path: ".env.development" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Gunakan DIRECT_URL agar prisma migrate dev berjalan via koneksi langsung
    // (melewati PgBouncer yang tidak kompatibel dengan perintah CLI Prisma).
    url: process.env.DIRECT_URL,
  },
});
