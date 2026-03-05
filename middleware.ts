/**
 * Next.js Middleware — Auth Guard
 *
 * - Jika user sudah login (ada JWT di cookie 'token') dan mengakses /login atau /register
 *   → redirect otomatis ke /dashboard
 * - Jika user belum login dan mengakses route yang diproteksi (/dashboard, dst.)
 *   → redirect ke /login (dapat dikembangkan sesuai kebutuhan)
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "super_secret_fallback_key_123!"
);

// Route yang hanya bisa diakses saat BELUM login
const AUTH_ROUTES = ["/login", "/register"];

// Route yang hanya bisa diakses saat SUDAH login
const PROTECTED_ROUTES = ["/dashboard"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("token")?.value;

    let isAuthenticated = false;

    // Verifikasi token jika ada
    if (token) {
        try {
            await jwtVerify(token, JWT_SECRET);
            isAuthenticated = true;
        } catch {
            // Token invalid / expired — anggap belum login
            isAuthenticated = false;
        }
    }

    // Sudah login → redirect dari halaman auth ke dashboard
    if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Belum login → redirect ke login dari route yang diproteksi
    if (!isAuthenticated && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    // Jalankan middleware pada semua route kecuali static files & API routes
    matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
