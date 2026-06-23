import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

type RouteContext = { params: Promise<{ id: string }> };

// ──────────────────────────────────────────────────────────
// GET /api/shortlink/[id]/stats — Get Click Statistics
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (isNaN(id) || id <= 0) {
      return errorResponse(400, "ID tidak valid", "INVALID_ID");
    }

    // Check if shortlink exists
    const shortlink = await prisma.m_shortlink.findFirst({
      where: { id, dihapus_pada: null },
      select: { id: true, total_klik: true },
    });

    if (!shortlink) {
      return errorResponse(404, "Shortlink tidak ditemukan", "NOT_FOUND");
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get click counts
    const [klikHariIni, klik7Hari, klik30Hari] = await Promise.all([
      prisma.c_shortlink_click.count({
        where: { shortlink_id: id, dibuat_pada: { gte: today } },
      }),
      prisma.c_shortlink_click.count({
        where: { shortlink_id: id, dibuat_pada: { gte: sevenDaysAgo } },
      }),
      prisma.c_shortlink_click.count({
        where: { shortlink_id: id, dibuat_pada: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Get daily clicks for the last 30 days using raw query
    const dailyClicks = await prisma.$queryRaw<
      { tanggal: Date; total: bigint }[]
    >`
      SELECT DATE("dibuat_pada") as tanggal, COUNT(*)::bigint as total
      FROM "c_shortlink_click"
      WHERE "shortlink_id" = ${id}
        AND "dibuat_pada" >= ${thirtyDaysAgo}
      GROUP BY DATE("dibuat_pada")
      ORDER BY tanggal ASC
    `;

    const klikPerHari = dailyClicks.map((row) => ({
      tanggal: row.tanggal.toISOString().split("T")[0],
      total: Number(row.total),
    }));

    return successResponse({
      total_klik: shortlink.total_klik,
      klik_hari_ini: klikHariIni,
      klik_7_hari: klik7Hari,
      klik_30_hari: klik30Hari,
      klik_per_hari: klikPerHari,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
