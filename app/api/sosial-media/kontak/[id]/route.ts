import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteProps = { params: Promise<{ id: string }> };

// PUT /api/sosial-media/kontak/[id]
export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: RouteProps) => {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);

    if (isNaN(id)) {
      return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");
    }

    const body = await req.json();
    const { nama, nomor_telp, email, perusahaan, jabatan, grup, catatan } = body;

    const existing = await prisma.m_kontak_wa.findFirst({
      where: {
        id,
        dihapus_pada: null,
      },
    });

    if (!existing) {
      return errorResponse(404, "Kontak tidak ditemukan", "NOT_FOUND");
    }

    let cleanPhone = existing.nomor_telp;
    if (nomor_telp) {
      cleanPhone = nomor_telp.replace(/[^\d]/g, "");
      if (!cleanPhone) {
        return errorResponse(400, "Nomor telepon tidak valid", "VALIDATION_ERROR");
      }

      // Check if duplicate number exists for the same account
      const duplicate = await prisma.m_kontak_wa.findFirst({
        where: {
          akun_id: existing.akun_id,
          nomor_telp: cleanPhone,
          id: { not: id },
          dihapus_pada: null,
        },
      });

      if (duplicate) {
        return errorResponse(409, "Nomor WhatsApp ini sudah terdaftar di kontak lain", "CONFLICT");
      }
    }

    const updated = await prisma.m_kontak_wa.update({
      where: { id },
      data: {
        nama: nama ?? existing.nama,
        nomor_telp: cleanPhone,
        email: email !== undefined ? email : existing.email,
        perusahaan: perusahaan !== undefined ? perusahaan : existing.perusahaan,
        jabatan: jabatan !== undefined ? jabatan : existing.jabatan,
        grup: grup !== undefined ? grup : existing.grup,
        catatan: catatan !== undefined ? catatan : existing.catatan,
      },
    });

    if (nama) {
      await prisma.m_chat.updateMany({
        where: {
          akun_id: existing.akun_id,
          sender_id: { in: [`${cleanPhone}@c.us`, `${cleanPhone}@g.us`] },
        },
        data: {
          sender_nama: nama,
        },
      });
    }

    return successResponse(updated, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/sosial-media/kontak/[id]
export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: RouteProps) => {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);

    if (isNaN(id)) {
      return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");
    }

    const existing = await prisma.m_kontak_wa.findFirst({
      where: {
        id,
        dihapus_pada: null,
      },
    });

    if (!existing) {
      return errorResponse(404, "Kontak tidak ditemukan", "NOT_FOUND");
    }

    await prisma.m_kontak_wa.update({
      where: { id },
      data: {
        dihapus_pada: new Date(),
      },
    });

    return successResponse({ message: "Kontak berhasil dihapus" }, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
