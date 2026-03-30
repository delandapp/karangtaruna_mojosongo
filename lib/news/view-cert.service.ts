/**
 * ViewCertService
 *
 * "View Certificate" = signed JWT anonim untuk anti-spam view counting.
 *
 * Flow:
 *  1. Client belum punya cookie → API buat JWT → set HttpOnly cookie
 *  2. Client kirim view request → verifikasi JWT + Redis debounce (SET NX)
 *  3. View baru (NX sukses) → produce ke Kafka → counted: true
 *  4. Sudah dihitung dalam window 4 jam → skip → counted: false
 */
import * as jose from "jose";
import { redis } from "@/lib/redis";
import { REDIS_KEYS } from "@/lib/constants";

const VIEW_CERT_SECRET =
  process.env.VIEW_CERT_SECRET ?? "fallback_view_cert_secret_dev_only";
const CERT_EXPIRE    = "30d"; // TTL cookie
const DEBOUNCE_HOURS = 4;     // Window debounce per berita per sertifikat

const secret = new TextEncoder().encode(VIEW_CERT_SECRET);

export interface ViewCertPayload extends jose.JWTPayload {
  fingerprint: string;
  type: "view_cert";
}

/**
 * Buat View Certificate baru.
 * Dipanggil hanya jika client belum punya cookie 'view_cert'.
 *
 * @param deviceFingerprint - hash dari userAgent + canvas + audio fingerprint client
 * @returns signed JWT string yang akan disimpan sebagai HttpOnly cookie
 */
export async function createViewCertificate(
  deviceFingerprint: string,
): Promise<string> {
  const jti = crypto.randomUUID();

  return new jose.SignJWT({
    fingerprint: deviceFingerprint,
    type: "view_cert",
    jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(CERT_EXPIRE)
    .sign(secret);
}

/**
 * Verifikasi sertifikat + atomic debounce via Redis SET NX.
 *
 * - Key belum ada → SET NX berhasil → view baru → return true
 * - Key sudah ada → SET NX gagal  → sudah dihitung → return false
 *
 * @param certJwt  - JWT string dari cookie 'view_cert'
 * @param beritaId - ID berita yang sedang dilihat
 * @returns true = view baru (harus dihitung), false = sudah ada / JWT invalid
 */
export async function checkAndMarkView(
  certJwt: string,
  beritaId: number,
): Promise<boolean> {
  try {
    const { payload } = await jose.jwtVerify<ViewCertPayload>(certJwt, secret);

    const jti = payload.jti;
    if (!jti) return false;

    const redisKey = REDIS_KEYS.BERITA.VIEW_CERT(jti, beritaId);

    // SET NX = hanya berhasil jika key belum ada (atomic, anti race-condition)
    const result = await redis.set(
      redisKey,
      "1",
      "EX",
      DEBOUNCE_HOURS * 3600,
      "NX",
    );

    return result === "OK";
  } catch {
    // JWT expired / invalid → jangan hitung
    return false;
  }
}

/**
 * Cookie options untuk Next.js Response.cookies.set().
 * Digunakan di view route handler.
 */
export const VIEW_CERT_COOKIE_OPTIONS = {
  name: "view_cert",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60, // 30 hari dalam detik
  path: "/",
} as const;
