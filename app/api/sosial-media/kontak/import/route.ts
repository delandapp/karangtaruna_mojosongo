import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// POST /api/sosial-media/kontak/import
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { akun_id, contacts } = body;

    if (!akun_id || !Array.isArray(contacts)) {
      return errorResponse(400, "akun_id dan contacts (array) wajib diisi", "VALIDATION_ERROR");
    }

    const akunId = Number(akun_id);
    if (isNaN(akunId)) {
      return errorResponse(400, "akun_id tidak valid", "VALIDATION_ERROR");
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const c of contacts) {
      const { nama, nomor_telp, email, perusahaan, jabatan, grup, catatan } = c;
      if (!nama || !nomor_telp) {
        skippedCount++;
        continue;
      }

      const cleanPhone = String(nomor_telp).replace(/[^\d]/g, "");
      if (!cleanPhone) {
        skippedCount++;
        continue;
      }

      // Check if duplicate contact exists for same phone number
      const existing = await prisma.m_kontak_wa.findFirst({
        where: {
          akun_id: akunId,
          nomor_telp: cleanPhone,
          dihapus_pada: null,
        },
      });

      if (existing) {
        // Update contact details
        await prisma.m_kontak_wa.update({
          where: { id: existing.id },
          data: {
            nama,
            email: email || existing.email,
            perusahaan: perusahaan || existing.perusahaan,
            jabatan: jabatan || existing.jabatan,
            grup: grup || existing.grup,
            catatan: catatan || existing.catatan,
          },
        });
      } else {
        // Create new contact
        await prisma.m_kontak_wa.create({
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
      }
      importedCount++;
    }

    return successResponse({
      message: `Impor kontak selesai`,
      imported: importedCount,
      skipped: skippedCount,
    }, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
