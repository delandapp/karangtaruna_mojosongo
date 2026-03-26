import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { redis } from "@/lib/redis";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key_123!";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("token");

        // 1. Ambil token dari header Authorization
        const authHeader = req.headers.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return errorResponse(
                401,
                "Token autentikasi diperlukan untuk logout",
                "UNAUTHORIZED",
            );
        }

        const token = authHeader.slice(7);

        // 2. Decode token tanpa throw error (hanya untuk ambil expiry)
        let expiresIn = 60 * 60 * 24 * 7; // Default: 7 hari (dalam detik)
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

            // Hitung sisa waktu token (TTL blacklist = sisa waktu token agar tidak menumpuk di Redis)
            if (decoded.exp) {
                const now = Math.floor(Date.now() / 1000);
                const remaining = decoded.exp - now;
                if (remaining > 0) {
                    expiresIn = remaining;
                } else {
                    // Token sudah expired, tidak perlu diblacklist
                    return successResponse(
                        { message: "Token sudah kadaluarsa, Anda sudah logout" },
                        200,
                    );
                }
            }
        } catch {
            // Token tidak valid — anggap sudah logout
            return successResponse(
                { message: "Token tidak valid, Anda sudah logout" },
                200,
            );
        }

        // 3. Masukkan token ke blacklist Redis dengan TTL sisa waktu token
        await redis.setex(`blacklist:${token}`, expiresIn, "1");

        return successResponse({ message: "Berhasil logout" }, 200);
    } catch (error) {
        return handleApiError(error);
    }
}
