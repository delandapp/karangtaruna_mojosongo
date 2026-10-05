import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Gunakan DIRECT_URL di local development untuk menghindari error "PgBouncer timeout" di port 6432
const connectionString = process.env.NODE_ENV !== "production" && process.env.DIRECT_URL 
  ? process.env.DIRECT_URL 
  : process.env.DATABASE_URL;

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

pool.on("error", (err) => {
  console.error("[PG_POOL_ERROR] Unexpected error on idle client", err);
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
