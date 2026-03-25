import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // will adjust if path is different

export async function GET(
  req: Request,
  props: { params: Promise<{ event_id: string }> }
) {
  try {
    const params = await props.params;
    const eventId = Number(params.event_id);

    if (isNaN(eventId)) {
      return NextResponse.json({ success: false, message: 'Invalid Event ID' }, { status: 400 });
    }

    const proposal = await prisma.m_eproposal.findUnique({
      where: { event_id: eventId },
      include: {
        pengaturan: true,
        daftar_isi: { orderBy: { urutan: 'asc' } },
      },
    });

    return NextResponse.json({
      success: true,
      data: proposal, // Can be null if not created yet
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
