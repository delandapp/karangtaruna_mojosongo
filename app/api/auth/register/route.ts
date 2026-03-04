import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validasi Input via Zod
    const validatedData = registerSchema.parse(body);

    // 2. Cek apakah Username atau No HP sudah terdaftar
    const existingUser = await prisma.m_user.findFirst({
      where: {
        OR: [
          { username: validatedData.username },
          { no_handphone: validatedData.no_handphone },
        ],
      },
    });

    if (existingUser) {
      const field =
        existingUser.username === validatedData.username
          ? "Username"
          : "Nomor handphone";
      return errorResponse(409, `${field} sudah terdaftar`, "CONFLICT");
    }

    // 3. Hash Password dengan bcrypt (Salt Rounds = 10)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      validatedData.password,
      saltRounds,
    );

    // 4. Simpan ke Database
    const newUser = await prisma.m_user.create({
      data: {
        nama_lengkap: validatedData.nama_lengkap,
        username: validatedData.username,
        password: hashedPassword,
        no_handphone: validatedData.no_handphone,
        rt: validatedData.rt,
        rw: validatedData.rw,
        alamat: validatedData.alamat,
        jenis_kelamin: validatedData.jenis_kelamin,
        m_jabatan_id: validatedData.m_jabatan_id,
        m_level_id: validatedData.m_level_id,
      },
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        no_handphone: true,
        createdAt: true,
        level: { select: { nama_level: true } },
        jabatan: { select: { nama_jabatan: true } },
      },
    });

    // 5. Return success standard (tanpa password)
    return successResponse(newUser, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
