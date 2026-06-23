import { prisma } from "@/lib/prisma";
import { successResponse, paginatedResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaCreateQrCode } from "@/lib/validations/qrcode.schema";

// ──────────────────────────────────────────────────────────
// GET /api/qr-code — List QR Codes (paginated)
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 12)));
    const search = searchParams.get("search") || "";
    const tipe_konten = searchParams.get("tipe_konten") || "";

    const skip = (page - 1) * limit;

    const where: any = {
      dihapus_pada: null,
      dibuat_oleh_id: req.user.userId,
    };

    if (tipe_konten) {
      where.tipe_konten = tipe_konten;
    }

    if (search) {
      where.OR = [
        { judul: { contains: search, mode: "insensitive" } },
        { konten: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.m_qr_code.findMany({
        where,
        orderBy: { dibuat_pada: "desc" },
        skip,
        take: limit,
      }),
      prisma.m_qr_code.count({ where }),
    ]);

    return paginatedResponse(data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/qr-code — Create QR Code
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();

    const parsed = schemaCreateQrCode.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const qrData = parsed.data;

    const qrcode = await prisma.m_qr_code.create({
      data: {
        judul: qrData.judul,
        konten: qrData.konten,
        tipe_konten: qrData.tipe_konten,
        warna_depan: qrData.warna_depan,
        warna_belakang: qrData.warna_belakang,
        gaya_titik: qrData.gaya_titik,
        gaya_sudut_luar: qrData.gaya_sudut_luar,
        gaya_sudut_dalam: qrData.gaya_sudut_dalam,
        warna_sudut_luar: qrData.warna_sudut_luar || null,
        warna_sudut_dalam: qrData.warna_sudut_dalam || null,
        logo_url: qrData.logo_url || null,
        logo_ukuran: qrData.logo_ukuran,
        logo_margin: qrData.logo_margin,
        logo_hapus_bg: qrData.logo_hapus_bg,
        ukuran: qrData.ukuran,
        margin: qrData.margin,
        level_koreksi: qrData.level_koreksi,
        dibuat_oleh_id: req.user.userId,
      },
    });

    return successResponse(qrcode, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
