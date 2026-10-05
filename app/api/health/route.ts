import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

/**
 * GET /api/health
 *
 * Health check endpoint untuk memonitor status service:
 * - Database (PostgreSQL)
 * - Redis
 */
export async function GET() {
  const checks: Record<string, { status: string; detail?: string }> = {};

  // 1. Database (PostgreSQL) health check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "healthy" };
  } catch (error: any) {
    checks.database = { status: "unhealthy", detail: error.message };
  }

  // 2. Redis health check
  try {
    const pong = await redis.ping();
    checks.redis = { status: pong === "PONG" ? "healthy" : "unhealthy" };
  } catch (error: any) {
    checks.redis = { status: "unhealthy", detail: error.message };
  }

  // Overall status
  const allHealthy = Object.values(checks).every((c) => c.status === "healthy");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: checks,
    },
    { status: allHealthy ? 200 : 503 },
  );
}
