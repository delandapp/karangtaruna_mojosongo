import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { sponsorSchema } from "@/lib/validations/sponsorship.schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const sponsor = await prisma.m_sponsor.findUnique({
      where: { id },
      include: {
        m_perusahaan: true,
        kategori: true,
        event_sponsor: {
          include: { event: true },
          orderBy: { diperbarui_pada: 'desc' },
        },
      },
    });

    if (!sponsor) return errorResponse(404, "Sponsor tidak ditemukan", "NOT_FOUND");
    return successResponse(sponsor);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const json = await request.json();
    const validatedData = sponsorSchema.parse(json);

    const existingSponsor = await prisma.m_sponsor.findUnique({ where: { id } });
    if (!existingSponsor) return errorResponse(404, "Sponsor tidak ditemukan", "NOT_FOUND");

    if (validatedData.m_perusahaan_id && validatedData.m_perusahaan_id !== existingSponsor.m_perusahaan_id) {
       const duplicate = await prisma.m_sponsor.findUnique({
         where: { m_perusahaan_id: validatedData.m_perusahaan_id }
       });
       if (duplicate) return errorResponse(400, "Perusahaan ini sudah terdaftar", "DUPLICATE_SPONSOR");
    }

    if (validatedData.m_brand_id && validatedData.m_brand_id !== existingSponsor.m_brand_id) {
       const duplicate = await prisma.m_sponsor.findUnique({
         where: { m_brand_id: validatedData.m_brand_id }
       });
       if (duplicate) return errorResponse(400, "Brand ini sudah terdaftar sebagai sponsor", "DUPLICATE_SPONSOR");
    }

    const updatedSponsor = await prisma.m_sponsor.update({
      where: { id },
      data: {
        m_perusahaan_id: validatedData.m_perusahaan_id || undefined,
        m_brand_id: validatedData.m_brand_id || undefined,
        m_kategori_sponsor_id: validatedData.m_kategori_sponsor_id || null,
        total_disponsori: validatedData.total_disponsori ?? existingSponsor.total_disponsori,
      },
      include: {
        m_perusahaan: true,
        m_brand: true,
        kategori: true,
      },
    });

    return successResponse(updatedSponsor);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    await prisma.m_sponsor.delete({ where: { id } });
    return successResponse({ message: "Sponsor berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
