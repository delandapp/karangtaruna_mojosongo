import { NextRequest } from "next/server";
import { paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getBeritaTerbaru } from "@/lib/news/news-query.service";

/**
 * GET /api/berita/terbaru?page=1&limit=20
 *
 * Berita terbaru sort by published_at DESC, dengan pagination.
 * Cache Redis: halaman 1 = 2 menit, halaman 2+ = 5 menit.
 *
 * Query Params:
 *  - page  : nomor halaman (default: 1)
 *  - limit : jumlah item per halaman (default: 20, max: 50)
 */
export async function GET(req: NextRequest) {
  try {
    const page  = Math.max(1, Number(req.nextUrl.searchParams.get("page")  ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "20")));

    const { hits, total } = await getBeritaTerbaru(page, limit);

    const totalPages = Math.ceil(total / limit);
    return paginatedResponse(hits, { page, limit, total, totalPages }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
