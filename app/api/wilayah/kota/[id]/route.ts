});

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kota", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const body = await req.json();
    const validatedData = kotaSchema.parse(body);

    const existingData = await prisma.m_kota.findUnique({ where: { id } });
    if (!existingData) return errorResponse(404, "Kota tidak ditemukan", "NOT_FOUND");

    // Check kode wilayah uniqueness if changed
    if (existingData.kode_wilayah !== validatedData.kode_wilayah) {
      const codeExists = await prisma.m_kota.findUnique({
        where: { kode_wilayah: validatedData.kode_wilayah },
      });
      if (codeExists) {
        return errorResponse(400, "Kode wilayah kota sudah digunakan");
      }
    }

    const updatedData = await prisma.m_kota.update({
      where: { id },
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
        m_provinsi_id: validatedData.m_provinsi_id,
      },
      include: {
        m_provinsi: { select: { nama: true } }
      }
    });
    return successResponse(updatedData, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kota", "DELETE");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    // Relational check
    const referencedKecamatan = await prisma.m_kecamatan.findFirst({
      where: { m_kota_id: id },
    });
    
    if (referencedKecamatan) {
      return errorResponse(400, "Kota tidak dapat dihapus karena masih menjadi rujukan lokasi kecamatan.");
    }

    await prisma.m_kota.delete({ where: { id } });
    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
