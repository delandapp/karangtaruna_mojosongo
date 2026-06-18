import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaFilterAnalitik } from "@/lib/validations/sosial-media.schema";
import { subDays, startOfDay } from "date-fns";

// ──────────────────────────────────────────────────────────
// POST /api/sosial-media/analitik/export — Export Analytics to CSV
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();

    // Validate parameters
    const parsed = schemaFilterAnalitik.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        400,
        parsed.error.issues[0].message,
        "VALIDATION_ERROR"
      );
    }

    const { akun_id, platform_id, periode, tanggal_mulai, tanggal_selesai } =
      parsed.data;

    // Determine date range
    const today = new Date();
    let startDate = subDays(today, 30);
    let endDate = today;

    if (periode === "7d") {
      startDate = subDays(today, 7);
    } else if (periode === "custom" && tanggal_mulai && tanggal_selesai) {
      startDate = new Date(tanggal_mulai);
      endDate = new Date(tanggal_selesai);
    }

    // Query analytics records
    const accounts = await prisma.m_akun_sosmed.findMany({
      where: {
        dihapus_pada: null,
        ...(akun_id ? { id: akun_id } : {}),
        ...(platform_id ? { platform_id } : {}),
      },
    });

    const analytics = await prisma.m_analitik.findMany({
      where: {
        dihapus_pada: null,
        tanggal: {
          gte: startOfDay(startDate),
          lte: startOfDay(endDate),
        },
        akun_id: {
          in: accounts.map((a) => a.id),
        },
      },
      include: {
        akun: {
          include: {
            platform: true,
          },
        },
      },
      orderBy: {
        tanggal: "asc",
      },
    });

    // Generate CSV contents
    const csvRows = [
      [
        "Tanggal",
        "Platform",
        "Nama Akun",
        "Username",
        "Followers",
        "Reach",
        "Impressions",
        "Likes",
        "Komentar",
        "Share",
        "Total Engagement",
      ],
    ];

    for (const record of analytics) {
      csvRows.push([
        record.tanggal.toISOString().split("T")[0],
        record.akun?.platform?.nama || "",
        record.akun?.nama_akun || "",
        `@${record.akun?.username || ""}`,
        String(record.followers),
        String(record.reach),
        String(record.impressions),
        String(record.likes),
        String(record.komentar),
        String(record.share),
        String(record.engagement),
      ]);
    }

    // Join rows to CSV string
    const csvContent = csvRows
      .map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return successResponse(csvContent, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
