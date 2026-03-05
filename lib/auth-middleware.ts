import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { errorResponse } from "@/lib/api-response";
import { redis } from "@/lib/redis";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key_123!";

export interface AuthenticatedUser {
    userId: number;
    username: string;
    level: string;
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
            // 1. Ambil token dari header Authorization
            const authHeader = req.headers.get("Authorization");

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return errorResponse(
                    401,
                    "Token autentikasi diperlukan",
                    "UNAUTHORIZED",
                ) as NextResponse;
            }

            const token = authHeader.slice(7); // Hapus prefix "Bearer "

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

            // 4. Inject user ke request dan lanjutkan ke handler
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
