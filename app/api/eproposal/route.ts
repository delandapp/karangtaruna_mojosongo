import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { errorResponse } from "@/lib/api-response";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId, userId } = req.user;

    const hasAccess = await checkUserAccess(
      userLevelId,
      userJabatanId,
      "/api/eproposal",
      "POST"
    );
    if (!hasAccess) {
      return errorResponse(
        403,
        "Akses ditolak. Anda tidak memiliki izin membuat e-proposal.",
        "FORBIDDEN"
      );
    }

    const body = await req.json();
    let {
      event_id,
      judul,
      slug,
      deskripsi,
      file_pdf_url,
      cover_url,
      pengaturan,
      daftar_isi,
    } = body;

    // Safety check just in case the client sends an object (e.g. { status: "duplicate", "file": ... })
    if (typeof file_pdf_url === 'object' && file_pdf_url !== null) {
      file_pdf_url = file_pdf_url.file?.urlPublik || file_pdf_url.url || '';
    }
    if (typeof cover_url === 'object' && cover_url !== null) {
      cover_url = cover_url.file?.urlPublik || cover_url.url || '';
    }

    // Safety check for bg_music_url
    let bg_music_url = pengaturan?.bg_music_url || '';
    if (typeof bg_music_url === 'object' && bg_music_url !== null) {
      bg_music_url = (bg_music_url as any).file?.urlPublik || (bg_music_url as any).url || '';
    }

    // Validate cover_url format: only JPEG/PNG allowed
    if (cover_url && typeof cover_url === 'string') {
      const coverExt = cover_url.split('?')[0].split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png'].includes(coverExt || '')) {
        return NextResponse.json(
          { success: false, message: 'Format cover tidak valid. Hanya file JPEG dan PNG yang diizinkan.' },
          { status: 400 }
        );
      }
    }

    // Validate bg_music_url format: only MP3 allowed
    if (bg_music_url && typeof bg_music_url === 'string') {
      const musicExt = bg_music_url.split('?')[0].split('.').pop()?.toLowerCase();
      if (musicExt !== 'mp3') {
        return NextResponse.json(
          { success: false, message: 'Format musik tidak valid. Hanya file MP3 yang diizinkan.' },
          { status: 400 }
        );
      }
    }

    // Update bg_music_url in pengaturan
    if (pengaturan) {
      pengaturan.bg_music_url = bg_music_url || null;
    }

    // Use actual authenticated user id
    const dibuat_oleh_id = userId;

    const newProposal = await prisma.m_eproposal.create({
      data: {
        event_id,
        dibuat_oleh_id,
        judul,
        slug,
        deskripsi,
        file_pdf_url,
        cover_url,
        pengaturan: pengaturan
          ? {
              create: {
                auto_flip: pengaturan.auto_flip,
                sound_effect: pengaturan.sound_effect,
                bg_music_url: pengaturan.bg_music_url,
                theme_color: pengaturan.theme_color,
                animasi_transisi: pengaturan.animasi_transisi,
              },
            }
          : undefined,
        daftar_isi: Array.isArray(daftar_isi) && daftar_isi.length > 0
          ? { createMany: { data: daftar_isi.map((d: any, i: number) => ({ judul: d.judul, halaman: d.halaman, urutan: d.urutan ?? i + 1 })) } }
          : undefined,
      },
      include: {
        pengaturan: true,
        daftar_isi: { orderBy: { urutan: 'asc' } },
      },
    });

    return NextResponse.json({ success: true, data: newProposal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
