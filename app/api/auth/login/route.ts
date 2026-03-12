import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key_123!";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Validation
    const { username, password } = loginSchema.parse(body);

    // 2. Cek apakah user ada di DB
    const user = await prisma.m_user.findUnique({
      where: { username },
      include: {
        level: { select: { nama_level: true } },
        jabatan: { select: { nama_jabatan: true } },
      },
    });

    if (!user) {
      return errorResponse(401, "Username atau password salah", "UNAUTHORIZED");
    }

    // 3. Verifikasi Password Hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(401, "Username atau password salah", "UNAUTHORIZED");
    }

    // 4. Buat JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        level: user.level?.nama_level,
        m_level_id: user.m_level_id,
        m_jabatan_id: user.m_jabatan_id,
      },
      JWT_SECRET,
      { expiresIn: "7d" }, // Token berlaku 7 hari
    );

    // 5. Setup data yang di-return
    const { password: _, ...userWithoutPassword } = user;

    // 6. Set HTTPOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
      path: "/",
    });

    // 7. Return response sukses (tanpa menyertakan token di JSON body for better security)
    return successResponse({
      user: userWithoutPassword,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
