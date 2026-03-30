import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getBeritaBySlug } from "@/lib/news/news-query.service";

/**
 * GET /api/berita/slug/[slug]
 *
 * Ambil detail berita berdasarkan SEO slug untuk halaman artikel publik.
 * Data diambil dari Elasticsearch (cache Redis 10 menit).
 *
 * Digunakan oleh: halaman detail artikel, Open Graph metadata, SSR/SSG.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug || slug.trim() === "") {
      return errorResponse(400, "Slug tidak boleh kosong", "VALIDATION_ERROR");
    }

    const berita = await getBeritaBySlug(slug);

    if (!berita) {
      return errorResponse(404, "Berita tidak ditemukan", "NOT_FOUND");
    }

    return successResponse(berita, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
