import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateLevelSchema } from "@/lib/validations/level.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache } from "@/lib/redis";
import { REDIS_KEYS, ELASTIC_INDICES } from "@/lib/constants";
import { getDocument } from "@/lib/elasticsearch";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { id } = await props.params;
    const levelId = parseInt(id, 10);

    if (isNaN(levelId)) {
      return errorResponse(400, "ID Level tidak valid", "BAD_REQUEST");
    }

    const cacheKey = REDIS_KEYS.LEVELS.SINGLE(levelId);

    // 1. Cek Cache Redis
    const cachedLevel = await getCache<any>(cacheKey);
    if (cachedLevel) {
      return successResponse(cachedLevel, 200);
    }

    const level = await getDocument(ELASTIC_INDICES.LEVELS, levelId);
    if (!level) {
      return errorResponse(404, "Level tidak ditemukan", "NOT_FOUND");
    }

    return successResponse(level, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { id } = await props.params;
    const levelId = parseInt(id, 10);
    const body = await req.json();

    if (isNaN(levelId)) {
      return errorResponse(400, "ID Level tidak valid", "BAD_REQUEST");
    }

    const validatedData = updateLevelSchema.parse(body);

    const updatedLevel = await prisma.m_level.update({
      where: { id: levelId },
      data: {
        nama_level: validatedData.nama_level,
      },
    });

    // Validasi Sinkronisasi & Optimasi
    return successResponse(updatedLevel, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, props: RouteProps) => {
  try {
    const { id } = await props.params;
    const levelId = parseInt(id, 10);

    if (isNaN(levelId)) {
      return errorResponse(400, "ID Level tidak valid", "BAD_REQUEST");
    }

    await prisma.m_level.delete({
      where: { id: levelId },
    });

    return successResponse(null, 200);
  } catch (error) {
    return handleApiError(error);
  }
});
