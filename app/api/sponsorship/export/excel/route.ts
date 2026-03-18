import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";
import { handleApiError } from "@/lib/error-handler";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event_idStr = searchParams.get("event_id");

    const where: any = {};
    if (event_idStr) {
      where.event_id = parseInt(event_idStr);
    }

    const pipelines = await prisma.event_sponsor.findMany({
      where,
      include: {
        sponsor: {
          include: { m_perusahaan: true, m_brand: true, kategori: true },
        },
        event: true,
      },
      orderBy: { diperbarui_pada: "desc" },
    });

    const dataToExport = pipelines.map((item) => ({
      "Nama Perusahaan / Brand": item.sponsor.m_perusahaan?.nama || item.sponsor.m_brand?.nama_brand || "-",
      "Kategori": item.sponsor.kategori?.nama_kategori || "-",
      "Status Pipeline": item.status_pipeline.toUpperCase(),
      "Tier Sponsorship": item.tier.toUpperCase(),
      "Jenis Kontribusi": item.jenis_kontribusi.toUpperCase(),
      "Jumlah Disepakati (Rp)": item.jumlah_disepakati ? Number(item.jumlah_disepakati) : 0,
      "Jumlah Diterima (Rp)": item.jumlah_diterima ? Number(item.jumlah_diterima) : 0,
      "Dibuat Pada": format(new Date(item.dibuat_pada), "dd-MM-yyyy HH:mm"),
    }));

    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data Sponsor");

    const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new Response(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Laporan_Sponsorship_${format(new Date(), "yyyyMMdd")}.xlsx"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
