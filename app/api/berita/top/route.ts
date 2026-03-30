import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getBeritaTop } from "@/lib/news/news-query.service";

/**
 * GET /api/berita/top
 * Berita paling banyak dilihat dalam 30 hari terakhir.
 * Sort: total_views DESC
 * Cache Redis: 1 jam
 *
 * Query Params:
 *  - limit: number (default: 10, max: 20)
 */
export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(
      20,
      Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "10")),
    );

    const data = await getBeritaTop(limit);

    return successResponse(data, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
