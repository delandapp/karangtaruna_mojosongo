import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getBeritaTrending } from "@/lib/news/news-query.service";

/**
 * GET /api/berita/trending
 *
 * Berita trending 7 hari terakhir, sort by trending_score DESC.
 * Cache Redis: 15 menit (diupdate otomatis oleh trending-worker setiap 15 menit).
 *
 * Query params:
 *  - limit: number (default 10, max 20)
 */
export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(
      20,
      Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "10")),
    );

    const data = await getBeritaTrending(limit);

    return successResponse(data, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
