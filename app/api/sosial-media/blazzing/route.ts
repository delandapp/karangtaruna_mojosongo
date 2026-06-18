import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

// GET /api/sosial-media/blazzing?akun_id=...
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const akunIdParam = searchParams.get("akun_id");

    if (!akunIdParam) {
      return errorResponse(400, "akun_id wajib diisi", "VALIDATION_ERROR");
    }

    const akunId = Number(akunIdParam);
    if (isNaN(akunId)) {
      return errorResponse(400, "akun_id tidak valid", "VALIDATION_ERROR");
    }

    const campaigns = await prisma.m_blazzing_wa.findMany({
      where: {
        akun_id: akunId,
        dihapus_pada: null,
      },
      include: {
        penerima: {
          where: { dihapus_pada: null },
          select: {
            id: true,
            nama: true,
            nomor_telp: true,
            status: true,
            dikirim_pada: true,
            pesan_error: true,
          },
        },
        _count: {
          select: {
            penerima: { where: { dihapus_pada: null } },
          },
        },
      },
      orderBy: { dibuat_pada: "desc" },
    });

    // Enrich with stats
    const enriched = campaigns.map((c) => {
      const total = c.penerima.length;
      const sent = c.penerima.filter((p) => p.status === "sent").length;
      const failed = c.penerima.filter((p) => p.status === "failed").length;
      const pending = c.penerima.filter((p) => p.status === "pending").length;
      return {
        ...c,
        stats: { total, sent, failed, pending },
      };
    });

    return successResponse(enriched, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/sosial-media/blazzing
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const {
      akun_id,
      nama_kempen,
      pesan,
      tipe,
      dijadwalkan_pada,
      penerima, // Array of { nama, nomor_telp, kontak_id? }
    } = body;

    if (!akun_id || !nama_kempen || !pesan || !Array.isArray(penerima) || penerima.length === 0) {
      return errorResponse(
        400,
        "akun_id, nama_kempen, pesan, dan penerima (array) wajib diisi",
        "VALIDATION_ERROR"
      );
    }

    const akunId = Number(akun_id);
    if (isNaN(akunId)) {
      return errorResponse(400, "akun_id tidak valid", "VALIDATION_ERROR");
    }

    const campaignType = tipe === "scheduled" ? "scheduled" : "instant";

    if (campaignType === "scheduled" && !dijadwalkan_pada) {
      return errorResponse(
        400,
        "Tanggal jadwal wajib diisi untuk tipe terjadwal",
        "VALIDATION_ERROR"
      );
    }

    // Validate all recipients have phone numbers
    const validRecipients = penerima.filter(
      (p: any) => p.nama && p.nomor_telp
    );

    if (validRecipients.length === 0) {
      return errorResponse(
        400,
        "Minimal satu penerima dengan nama dan nomor telepon harus diisi",
        "VALIDATION_ERROR"
      );
    }

    const campaign = await prisma.m_blazzing_wa.create({
      data: {
        akun_id: akunId,
        nama_kempen,
        pesan,
        tipe: campaignType,
        status: "pending",
        dijadwalkan_pada: dijadwalkan_pada
          ? new Date(dijadwalkan_pada)
          : null,
        penerima: {
          create: validRecipients.map((p: any) => ({
            nama: p.nama,
            nomor_telp: String(p.nomor_telp).replace(/[^\d]/g, ""),
            kontak_id: p.kontak_id ? Number(p.kontak_id) : null,
            status: "pending",
          })),
        },
      },
      include: {
        penerima: {
          where: { dihapus_pada: null },
        },
      },
    });

    return successResponse(campaign, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
