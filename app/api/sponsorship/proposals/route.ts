import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { proposalSponsorSchema } from "@/lib/validations/sponsorship.schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event_idStr = searchParams.get("event_id");

    const where: any = {};
    if (event_idStr) {
      where.event_id = parseInt(event_idStr);
    }

    const data = await prisma.proposal_sponsor.findMany({
      where,
      include: {
        sponsor: { include: { m_perusahaan: true } },
        dikirim_oleh: { select: { id: true, nama_lengkap: true } },
      },
      orderBy: { dibuat_pada: "desc" },
    });

    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validatedData = proposalSponsorSchema.parse(json);

    const newProposal = await prisma.proposal_sponsor.create({
      data: {
        event_id: validatedData.event_id,
        m_sponsor_id: validatedData.m_sponsor_id,
        dikirim_oleh_id: validatedData.dikirim_oleh_id,
        tier_diusulkan: validatedData.tier_diusulkan,
        respons: validatedData.respons || "menunggu",
        url_file_proposal: validatedData.url_file_proposal,
        catatan: validatedData.catatan,
        dikirim_pada: new Date(),
      },
    });

    return successResponse(newProposal, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
