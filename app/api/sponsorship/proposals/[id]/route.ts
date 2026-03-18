import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { proposalSponsorSchema } from "@/lib/validations/sponsorship.schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const proposal = await prisma.proposal_sponsor.findUnique({
      where: { id },
      include: {
        sponsor: { include: { m_perusahaan: true } },
        dikirim_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    if (!proposal) return errorResponse(404, "Proposal tidak ditemukan", "NOT_FOUND");
    return successResponse(proposal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const json = await request.json();
    const validatedData = proposalSponsorSchema.parse(json);

    const existingProposal = await prisma.proposal_sponsor.findUnique({ where: { id } });
    if (!existingProposal) return errorResponse(404, "Data proposal tidak ditemukan", "NOT_FOUND");

    const updatedProposal = await prisma.proposal_sponsor.update({
      where: { id },
      data: {
        event_id: validatedData.event_id,
        m_sponsor_id: validatedData.m_sponsor_id,
        dikirim_oleh_id: validatedData.dikirim_oleh_id,
        tier_diusulkan: validatedData.tier_diusulkan,
        respons: validatedData.respons || existingProposal.respons,
        url_file_proposal: validatedData.url_file_proposal,
        catatan: validatedData.catatan,
      },
    });

    return successResponse(updatedProposal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    await prisma.proposal_sponsor.delete({ where: { id } });
    return successResponse({ message: "Proposal berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
