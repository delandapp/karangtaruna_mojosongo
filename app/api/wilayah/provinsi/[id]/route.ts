import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { provinsiSchema } from "@/lib/validations/wilayah.schema";
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
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/provinsi", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const cacheKey = REDIS_KEYS.PROVINSI.SINGLE(id);
    const cachedData = await getCache(cacheKey);
    if (cachedData) return successResponse(cachedData, 200);

    const data = await getDocument(ELASTIC_INDICES.PROVINSI, id);
    if (!data) return errorResponse(404, "Provinsi tidak ditemukan", "NOT_FOUND");

    return successResponse(data, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/provinsi", "PUT");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    const body = await req.json();
    const validatedData = provinsiSchema.parse(body);

    const existingData = await prisma.m_provinsi.findUnique({ where: { id } });
    if (!existingData) return errorResponse(404, "Provinsi tidak ditemukan", "NOT_FOUND");

    // Check kode wilayah uniqueness if changed
    if (existingData.kode_wilayah !== validatedData.kode_wilayah) {
      const codeExists = await prisma.m_provinsi.findUnique({
        where: { kode_wilayah: validatedData.kode_wilayah },
      });
      if (codeExists) {
        return errorResponse(400, "Kode wilayah provinsi sudah digunakan");
      }
    }

    const updatedData = await prisma.m_provinsi.update({
      where: { id },
      data: {
        kode_wilayah: validatedData.kode_wilayah,
        nama: validatedData.nama,
      },
    });
    return successResponse(updatedData, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/wilayah/provinsi", "DELETE");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak.", "FORBIDDEN");
    }

    const id = parseInt((await params).id, 10);
    if (isNaN(id)) return errorResponse(400, "ID tidak valid", "BAD_REQUEST");

    // Prisma relational integrity check: check if any kota refers to this provinsi
    const referencedKota = await prisma.m_kota.findFirst({
      where: { m_provinsi_id: id },
    });
    
    if (referencedKota) {
      return errorResponse(400, "Provinsi tidak dapat dihapus karena masih menjadi rujukan lokasi kota.");
    }

    await prisma.m_provinsi.delete({ where: { id } });
    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
