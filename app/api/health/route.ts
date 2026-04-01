import { NextResponse } from "next/server";
import { checkElasticHealth } from "@/lib/elasticsearch";
import { redis } from "@/lib/redis";

/**
 * GET /api/health
 *
 * Health check endpoint untuk memonitor status semua service:
 * - Redis
 * - Elasticsearch
 */
export async function GET() {
  const checks: Record<string, { status: string; detail?: string }> = {};

  // 1. Redis health check
  try {
    const pong = await redis.ping();
    checks.redis = { status: pong === "PONG" ? "healthy" : "unhealthy" };
  } catch (error: any) {
    checks.redis = { status: "unhealthy", detail: error.message };
  }

  // 2. Elasticsearch health check
  try {
    const esHealthy = await checkElasticHealth();
    checks.elasticsearch = {
      status: esHealthy ? "healthy" : "unhealthy",
    };
  } catch (error: any) {
    checks.elasticsearch = { status: "unhealthy", detail: error.message };
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
