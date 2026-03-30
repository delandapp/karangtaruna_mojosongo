import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import {
  createViewCertificate,
  checkAndMarkView,
  VIEW_CERT_COOKIE_OPTIONS,
} from "@/lib/news/view-cert.service";
import { produceNewsViewed } from "@/lib/news/news-kafka";

/**
 * POST /api/berita/[id]/view
 *
 * Mencatat view berita dengan mekanisme anti-spam View Certificate.
 *
 * Flow:
 *  1. Cek cookie 'view_cert' — jika tidak ada, buat sertifikat baru (JWT HS256)
 *  2. Verifikasi JWT + cek Redis debounce via SET NX (TTL 4 jam per berita per cert)
 *  3. Jika view baru → produce event ke Kafka 'news.viewed' → counted: true
 *  4. Jika sudah dihitung dalam window → skip → counted: false
 *
 * Request Headers (opsional, digunakan saat membuat cert baru):
 *  - X-Device-Fingerprint: hash fingerprint dari client (userAgent + canvas + audio)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const beritaId = parseInt(id, 10);

    if (isNaN(beritaId) || beritaId <= 0) {
      return errorResponse(400, "ID berita tidak valid", "VALIDATION_ERROR");
    }

    // ── 1. Ambil atau buat View Certificate ──────────────────────────────
    let certJwt = req.cookies.get(VIEW_CERT_COOKIE_OPTIONS.name)?.value ?? null;
    let needSetCookie = false;

    if (!certJwt) {
      const fingerprint =
        req.headers.get("X-Device-Fingerprint") ?? "unknown";
      certJwt = await createViewCertificate(fingerprint);
      needSetCookie = true;
    }

    // ── 2. Cek debounce + tandai view (atomic Redis SET NX) ──────────────
    const isCounted = await checkAndMarkView(certJwt, beritaId);

    // ── 3. Produce ke Kafka jika ini view baru ───────────────────────────
    if (isCounted) {
      await produceNewsViewed(beritaId);
    }

    // ── 4. Build response + set cookie jika cert baru dibuat ─────────────
    const responseBody = successResponse({ counted: isCounted }, 200);
    const response = NextResponse.json(responseBody, { status: 200 });

    if (needSetCookie) {
      response.cookies.set({
        name:     VIEW_CERT_COOKIE_OPTIONS.name,
        value:    certJwt,
        httpOnly: VIEW_CERT_COOKIE_OPTIONS.httpOnly,
        secure:   VIEW_CERT_COOKIE_OPTIONS.secure,
        sameSite: VIEW_CERT_COOKIE_OPTIONS.sameSite,
        maxAge:   VIEW_CERT_COOKIE_OPTIONS.maxAge,
        path:     VIEW_CERT_COOKIE_OPTIONS.path,
      });
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
