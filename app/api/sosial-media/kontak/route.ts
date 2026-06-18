import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// GET /api/sosial-media/kontak?akun_id=...&search=...
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const akunIdParam = searchParams.get("akun_id");
    const search = searchParams.get("search") || "";

    if (!akunIdParam) {
      return errorResponse(400, "akun_id wajib diisi", "VALIDATION_ERROR");
    }

    const akunId = Number(akunIdParam);
    if (isNaN(akunId)) {
      return errorResponse(400, "akun_id tidak valid", "VALIDATION_ERROR");
    }

    const contacts = await prisma.m_kontak_wa.findMany({
      where: {
        akun_id: akunId,
        dihapus_pada: null,
        OR: search
          ? [
              { nama: { contains: search, mode: "insensitive" } },
              { nomor_telp: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { perusahaan: { contains: search, mode: "insensitive" } },
              { grup: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: {
        nama: "asc",
      },
    });

    return successResponse(contacts, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/sosial-media/kontak
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { akun_id, nama, nomor_telp, email, perusahaan, jabatan, grup, catatan } = body;

    if (!akun_id || !nama || !nomor_telp) {
      return errorResponse(400, "akun_id, nama, dan nomor_telp wajib diisi", "VALIDATION_ERROR");
    }

    const akunId = Number(akun_id);
    if (isNaN(akunId)) {
      return errorResponse(400, "akun_id tidak valid", "VALIDATION_ERROR");
    }

    // Clean phone number (leave digits only)
    const cleanPhone = nomor_telp.replace(/[^\d]/g, "");
    if (!cleanPhone) {
      return errorResponse(400, "Nomor telepon tidak valid", "VALIDATION_ERROR");
    }

    // Check if duplicate number exists for the same account
    const existing = await prisma.m_kontak_wa.findFirst({
      where: {
        akun_id: akunId,
        nomor_telp: cleanPhone,
        dihapus_pada: null,
      },
    });

    if (existing) {
      return errorResponse(409, "Nomor WhatsApp ini sudah terdaftar di kontak", "CONFLICT");
    }

    const contact = await prisma.m_kontak_wa.create({
      data: {
        akun_id: akunId,
        nama,
        nomor_telp: cleanPhone,
        email: email || null,
        perusahaan: perusahaan || null,
        jabatan: jabatan || null,
        grup: grup || null,
        catatan: catatan || null,
      },
    });

    // Sync contact name to existing chat sessions
    await prisma.m_chat.updateMany({
      where: {
        akun_id: akunId,
        sender_id: { in: [`${cleanPhone}@c.us`, `${cleanPhone}@g.us`] },
      },
      data: {
        sender_nama: nama,
      },
    });

    return successResponse(contact, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
