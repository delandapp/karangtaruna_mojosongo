import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assumed prisma instance
// If their prisma is at `prisma/client` or another path, we will adjust if it crashes.
import { REDIS_KEYS } from '@/lib/constants';

// We could add Redis caching here, but for simplicity let's stick to DB query first.
export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const proposal = await prisma.m_eproposal.findFirst({
      where: { slug: params.slug, is_aktif: true },
      include: {
        pengaturan: true,
        daftar_isi: { orderBy: { urutan: 'asc' } },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: 'Proposal tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: proposal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
