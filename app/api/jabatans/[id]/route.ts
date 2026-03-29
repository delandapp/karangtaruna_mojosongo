import { prisma } from "@/lib/prisma";
import { updateJabatanSchema } from "@/lib/validations/jabatan.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { ELASTIC_INDICES } from "@/lib/constants";
import { getDocument } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { id } = await props.params;
    const jabatanId = parseInt(id, 10);

    if (isNaN(jabatanId)) {
      return errorResponse(400, "ID Jabatan tidak valid", "BAD_REQUEST");
    }

    const cacheKey = `jabatan:${jabatanId}`;

    // 1. Cek Cache Redis
    const cachedJabatan = await getCache<any>(cacheKey);
    if (cachedJabatan) {
      return successResponse(cachedJabatan, 200);
    }

    // 2. Ambil dari Elasticsearch
    const jabatan = await getDocument(ELASTIC_INDICES.JABATANS, id);

    if (!jabatan) {
      return errorResponse(404, "Jabatan tidak ditemukan", "NOT_FOUND");
    }

    return successResponse(jabatan, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { id } = await props.params;
    const jabatanId = parseInt(id, 10);
    const body = await req.json();

    if (isNaN(jabatanId)) {
      return errorResponse(400, "ID Jabatan tidak valid", "BAD_REQUEST");
    }

    const validatedData = updateJabatanSchema.parse(body);

    const updatedJabatan = await prisma.m_jabatan.update({
      where: { id: jabatanId },
      data: {
        nama_jabatan: validatedData.nama_jabatan,
        deskripsi_jabatan: validatedData.deskripsi_jabatan,
      },
    });

    return successResponse(updatedJabatan, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { id } = await props.params;
    const jabatanId = parseInt(id, 10);

    if (isNaN(jabatanId)) {
      return errorResponse(400, "ID Jabatan tidak valid", "BAD_REQUEST");
    }

    await prisma.m_jabatan.delete({
      where: { id: jabatanId },
    });

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
