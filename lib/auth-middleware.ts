import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma"; // Require prisma for RBAC check
import { redis } from "@/lib/redis";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key_123!";

export interface AuthenticatedUser {
  userId: number;
  username: string;
  level: string;
  m_level_id?: number | null;
  m_jabatan_id?: number | null;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

type RouteHandler<T extends unknown[] = []> = (
  req: AuthenticatedRequest,
  ...args: T
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware wrapper untuk memproteksi route handler dengan JWT.
 *
 * Cara pakai:
 * export const GET = withAuth(async (req) => { ... });
 * export const POST = withAuth(async (req) => { ... });
 *
 * Token dibaca dari header: Authorization: Bearer <token>
 */
export function withAuth<T extends unknown[]>(
  handler: RouteHandler<T>,
): (req: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // 1. Ambil token dari header Authorization ATAU dari cookies
      const authHeader = req.headers.get("Authorization");
      let token = "";

      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7); // Hapus prefix "Bearer "
      } else {
        const cookieToken = req.cookies.get("token")?.value;
        if (cookieToken) {
          token = cookieToken;
        }
      }

      if (!token) {
        return errorResponse(
          401,
          "Token autentikasi diperlukan",
          "UNAUTHORIZED",
        ) as NextResponse;
      }

      // 2. Cek apakah token ada di blacklist Redis (sudah logout)
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return errorResponse(
          401,
          "Token sudah tidak berlaku, silakan login kembali",
          "TOKEN_REVOKED",
        ) as NextResponse;
      }

      // 3. Verifikasi JWT
      let decoded: AuthenticatedUser;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      } catch {
        return errorResponse(
          401,
          "Token tidak valid atau sudah kadaluarsa",
          "UNAUTHORIZED",
        ) as NextResponse;
      }

      // 4. Optional RBAC Check via DB (if hak_akses exists for this endpoint)
      try {
        const { pathname } = new URL(req.url);
        const method = req.method;

        // Try getting cached RBAC rules eventually, or query directly
        const hakAkses = await prisma.m_hak_akses.findFirst({
          where: { endpoint: pathname, method },
          include: { levels: true, jabatans: true },
        });

        if (hakAkses) {
          const levelAllowed = hakAkses.is_all_level ||
            (decoded.m_level_id && hakAkses.levels.some(l => l.m_level_id === decoded.m_level_id));
          const jabatanAllowed = hakAkses.is_all_jabatan ||
            (decoded.m_jabatan_id && hakAkses.jabatans.some(j => j.m_jabatan_id === decoded.m_jabatan_id));

          if (!levelAllowed && !jabatanAllowed) {
            return errorResponse(403, "Akses ditolak (RBAC): Anda tidak memiliki izin untuk fitur ini", "FORBIDDEN") as NextResponse;
          }
        }
      } catch (rbacError) {
        console.error("RBAC Check Error:", rbacError);
      }

      // 5. Inject user ke request dan lanjutkan ke handler
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = decoded;

      return await handler(authenticatedReq, ...args);
    } catch {
      return errorResponse(
        500,
        "Terjadi kesalahan pada autentikasi",
        "INTERNAL_SERVER_ERROR",
      ) as NextResponse;
    }
  };
}
