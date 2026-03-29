import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { kelurahanSchema } from "@/lib/validations/wilayah.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { REDIS_KEYS, ELASTIC_INDICES } from "@/lib/constants";
import { getDocument } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { checkUserAccess } from "@/lib/rbac";

export const GET = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kelurahan", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const cacheKey = REDIS_KEYS.KELURAHAN.SINGLE(id);
    const cachedData = await getCache(cacheKey);
    if (cachedData) return successResponse(cachedData, 200);

    const data = await getDocument(ELASTIC_INDICES.KELURAHAN, id);
    if (!data) return errorResponse(404, "Kelurahan tidak ditemukan", "NOT_FOUND");

    return successResponse(data, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kelurahan", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const body = await req.json();
    const validatedData = kelurahanSchema.parse(body);

    const existingData = await prisma.m_kelurahan.findUnique({ where: { id } });
    if (!existingData) return errorResponse(404, "Kelurahan tidak ditemukan", "NOT_FOUND");

    if (existingData.kode_wilayah !== validatedData.kode_wilayah) {
      const codeExists = await prisma.m_kelurahan.findUnique({
        where: { kode_wilayah: validatedData.kode_wilayah },
      });
      if (codeExists) {
        return errorResponse(400, "Kode wilayah kelurahan sudah digunakan");
      }
    }

    const updatedData = await prisma.m_kelurahan.update({
      where: { id },
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
        m_kecamatan_id: validatedData.m_kecamatan_id,
      },
      include: {
        m_kecamatan: { select: { nama: true, m_kota_id: true, m_kota: { select: { m_provinsi_id: true } } } }
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
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/kelurahan", "DELETE");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    await prisma.m_kelurahan.delete({ where: { id } });
    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
