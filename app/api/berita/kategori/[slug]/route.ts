import { NextRequest } from "next/server";
import { paginatedResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getBeritaByKategori } from "@/lib/news/news-query.service";

/**
 * GET /api/berita/kategori/[slug]?page=1&limit=20
 *
 * Berita berdasarkan slug kategori, sort by published_at DESC, paginated.
 * Cache Redis: 5 menit.
 *
 * Query Params:
 *  - page  : nomor halaman (default: 1)
 *  - limit : jumlah item per halaman (default: 20, max: 50)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const page  = Math.max(1, Number(req.nextUrl.searchParams.get("page")  ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "20")));

    const { hits, total } = await getBeritaByKategori(slug, page, limit);

    const totalPages = Math.ceil(total / limit);
    return paginatedResponse(hits, { page, limit, total, totalPages }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
