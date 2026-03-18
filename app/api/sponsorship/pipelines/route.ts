import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { eventSponsorSchema } from "@/lib/validations/sponsorship.schema";

/**
 * GET: Ambil pipeline sponsor untuk event tertentu
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event_idStr = searchParams.get("event_id");

    if (!event_idStr) {
      return errorResponse(400, "Event ID wajib disertakan", "BAD_REQUEST");
    }

    const event_id = parseInt(event_idStr);

    const data = await prisma.event_sponsor.findMany({
      where: { event_id },
      include: {
        sponsor: {
          include: { m_perusahaan: true, kategori: true },
        },
        ditangani_oleh: {
          select: { id: true, nama_lengkap: true },
        },
      },
      orderBy: { diperbarui_pada: "desc" },
    });

    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST: Tambah sponsor ke event (Pipeline Prospect)
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validatedData = eventSponsorSchema.parse(json);

    let sponsorId = validatedData.m_sponsor_id;

    if (!sponsorId) {
      if (!validatedData.m_perusahaan_id && !validatedData.m_brand_id) {
        return errorResponse(400, "Harus menyertakan m_perusahaan_id atau m_brand_id jika m_sponsor_id kosong", "BAD_REQUEST");
      }

      // Check if sponsor already exists for this brand or perusahaan
      const whereCondition: any = validatedData.m_brand_id 
        ? { m_brand_id: validatedData.m_brand_id as number } 
        : { m_perusahaan_id: validatedData.m_perusahaan_id as number };

      let sponsor = await prisma.m_sponsor.findFirst({
        where: whereCondition
      });

      if (!sponsor) {
        sponsor = await prisma.m_sponsor.create({
          data: {
            m_brand_id: validatedData.m_brand_id || undefined,
            m_perusahaan_id: validatedData.m_perusahaan_id || undefined,
            total_disponsori: 0
          }
        });
      }
      sponsorId = sponsor.id;
    }

    // Cek duplikasi di event ini
    const existingPipeline = await prisma.event_sponsor.findUnique({
      where: {
        event_id_m_sponsor_id: {
          event_id: validatedData.event_id,
          m_sponsor_id: sponsorId,
        },
      },
    });

    if (existingPipeline) {
      return errorResponse(400, "Sponsor ini sudah dimasukkan ke pipeline event tersebut.", "DUPLICATE_PIPELINE");
    }

    const newPipeline = await prisma.event_sponsor.create({
      data: {
        event_id: validatedData.event_id,
        m_sponsor_id: sponsorId,
        ditangani_oleh_id: validatedData.ditangani_oleh_id || null,
        tier: validatedData.tier,
        jenis_kontribusi: validatedData.jenis_kontribusi,
        status_pipeline: validatedData.status_pipeline,
        jumlah_disepakati: validatedData.jumlah_disepakati,
        jumlah_diterima: validatedData.jumlah_diterima,
        deskripsi_inkind: validatedData.deskripsi_inkind,
        benefit_disepakati: validatedData.benefit_disepakati ?? undefined,
        benefit_terealisasi: validatedData.benefit_terealisasi ?? undefined,
        url_mou: validatedData.url_mou,
      },
      include: {
        sponsor: { include: { m_perusahaan: true } },
      },
    });

    return successResponse(newPipeline, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
