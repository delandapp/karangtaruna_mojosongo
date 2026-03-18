import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { eventSponsorSchema } from "@/lib/validations/sponsorship.schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const pipeline = await prisma.event_sponsor.findUnique({
      where: { id },
      include: {
        sponsor: { include: { m_perusahaan: true, kategori: true } },
        event: true,
        ditangani_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    if (!pipeline) return errorResponse(404, "Data pipeline tidak ditemukan", "NOT_FOUND");
    return successResponse(pipeline);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const json = await request.json();
    const validatedData = eventSponsorSchema.parse(json);

    const existingPipeline = await prisma.event_sponsor.findUnique({ where: { id } });
    if (!existingPipeline) return errorResponse(404, "Data pipeline tidak ditemukan", "NOT_FOUND");

    const sponsorId = validatedData.m_sponsor_id ?? existingPipeline.m_sponsor_id;

    if (
      validatedData.event_id !== existingPipeline.event_id ||
      sponsorId !== existingPipeline.m_sponsor_id
    ) {
      const duplicate = await prisma.event_sponsor.findUnique({
        where: {
          event_id_m_sponsor_id: {
            event_id: validatedData.event_id,
            m_sponsor_id: sponsorId,
          },
        },
      });
      if (duplicate) return errorResponse(400, "Sponsor ini sudah dimasukkan ke pipeline event tersebut.", "DUPLICATE_PIPELINE");
    }

    const updatedPipeline = await prisma.event_sponsor.update({
      where: { id },
      data: {
        event_id: validatedData.event_id,
        m_sponsor_id: sponsorId,
        ditangani_oleh_id: validatedData.ditangani_oleh_id ?? existingPipeline.ditangani_oleh_id,
        tier: validatedData.tier,
        jenis_kontribusi: validatedData.jenis_kontribusi,
        status_pipeline: validatedData.status_pipeline,
        jumlah_disepakati: validatedData.jumlah_disepakati,
        jumlah_diterima: validatedData.jumlah_diterima,
        deskripsi_inkind: validatedData.deskripsi_inkind,
        benefit_disepakati: validatedData.benefit_disepakati ?? undefined,
        benefit_terealisasi: validatedData.benefit_terealisasi ?? undefined,
        url_mou: validatedData.url_mou,
        dikonfirmasi_pada: validatedData.status_pipeline === 'dikonfirmasi' && existingPipeline.status_pipeline !== 'dikonfirmasi' ? new Date() : existingPipeline.dikonfirmasi_pada,
      },
      include: {
        sponsor: { include: { m_perusahaan: true } },
      },
    });

    return successResponse(updatedPipeline);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    await prisma.event_sponsor.delete({ where: { id } });
    return successResponse({ message: "Data pipeline berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
