import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";
import { errorResponse } from "@/lib/api-response";

export const PUT = withAuth(async (
  req: AuthenticatedRequest,
  props: { params: Promise<{ id: string }> }
) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(
      userLevelId,
      userJabatanId,
      "/api/eproposal",
      "PUT"
    );
    if (!hasAccess) {
      return errorResponse(
        403,
        "Akses ditolak. Anda tidak memiliki izin mengubah e-proposal.",
        "FORBIDDEN"
      );
    }

    const params = await props.params;
    const id = Number(params.id);
    const body = await req.json();

    const { pengaturan, daftar_isi, ...proposalData } = body;

    const dataToUpdate: any = { ...proposalData };

    // Safety check just in case the client sends an object
    if (typeof dataToUpdate.file_pdf_url === 'object' && dataToUpdate.file_pdf_url !== null) {
      dataToUpdate.file_pdf_url = dataToUpdate.file_pdf_url.file?.urlPublik || dataToUpdate.file_pdf_url.url || '';
    }
    if (typeof dataToUpdate.cover_url === 'object' && dataToUpdate.cover_url !== null) {
      dataToUpdate.cover_url = dataToUpdate.cover_url.file?.urlPublik || dataToUpdate.cover_url.url || '';
    }

    if (pengaturan) {
      dataToUpdate.pengaturan = {
        upsert: {
          create: pengaturan,
          update: pengaturan,
        },
      };
    }

    // Replace daftar_isi: delete old entries, create new ones
    if (Array.isArray(daftar_isi)) {
      await prisma.c_eproposal_daftar_isi.deleteMany({ where: { m_eproposal_id: id } });
      if (daftar_isi.length > 0) {
        dataToUpdate.daftar_isi = {
          createMany: { data: daftar_isi.map((d: any, i: number) => ({ judul: d.judul, halaman: d.halaman, urutan: d.urutan ?? i + 1 })) },
        };
      }
    }

    const updated = await prisma.m_eproposal.update({
      where: { id },
      data: dataToUpdate,
      include: { pengaturan: true, daftar_isi: { orderBy: { urutan: 'asc' } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});

export const DELETE = withAuth(async (
  req: AuthenticatedRequest,
  props: { params: Promise<{ id: string }> }
) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(
      userLevelId,
      userJabatanId,
      "/api/eproposal",
      "DELETE"
    );
    if (!hasAccess) {
      return errorResponse(
        403,
        "Akses ditolak. Anda tidak memiliki izin menghapus e-proposal.",
        "FORBIDDEN"
      );
    }

    const params = await props.params;
    const id = Number(params.id);
    await prisma.m_eproposal.delete({ where: { id } });

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
