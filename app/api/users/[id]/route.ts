import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import bcrypt from "bcrypt";
import { z } from "zod";
import { redis, getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";

const FULL_CRUD_LEVELS = [
  "superuser",
  "ketua",
  "wakil ketua",
  "seketaris",
  "bendahara",
];

const updateUserSchema = z.object({
  nama_lengkap: z.string().min(3).max(100).optional(),
  username: z
    .string()
    .min(4)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional()
    .or(z.literal("")),
  no_handphone: z
    .string()
    .min(10)
    .max(15)
    .regex(/^[0-9]+$/)
    .optional(),
  rt: z.string().min(1).max(5).optional(),
  rw: z.string().min(1).max(5).optional(),
  alamat: z.string().optional(),
  jenis_kelamin: z.enum(["L", "P"]).optional(),
  m_jabatan_id: z.number().int().positive().optional(),
  m_level_id: z.number().int().positive().optional(),
});

export const PUT = withAuth(
  async (
    req: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      const resolvedParams = await params;
      const userId = parseInt(resolvedParams.id, 10);
      if (isNaN(userId)) return errorResponse(400, "ID tidak valid");

      const { level: userLevel } = req.user;
      const isFullCrud = FULL_CRUD_LEVELS.includes(userLevel.toLowerCase());
      const isKoordinator = userLevel.toLowerCase() === "koordinator";

      if (!isFullCrud && !isKoordinator) {
        return errorResponse(
          403,
          "Akses ditolak. Anda tidak memiliki izin untuk mengubah data.",
          "FORBIDDEN",
        );
      }

      const body = await req.json();
      const data = updateUserSchema.parse(body);

      // Fetch target user to check existance and current jabata_id
      const targetUser = await prisma.m_user.findUnique({
        where: { id: userId },
      });
      if (!targetUser)
        return errorResponse(404, "Data tidak ditemukan", "NOT_FOUND");

      // RBAC logic for Koordinator
      if (isKoordinator) {
        const currentUser = await prisma.m_user.findUnique({
          where: { id: req.user.userId },
          select: { m_jabatan_id: true },
        });

        if (
          !currentUser?.m_jabatan_id ||
          targetUser.m_jabatan_id !== currentUser.m_jabatan_id
        ) {
          return errorResponse(
            403,
            "Akses ditolak. Anda hanya dapat mengubah data anggota di jabatan Anda sendiri.",
            "FORBIDDEN",
          );
        }

        // Prevent Koordinator from changing the user's jabatan
        if (
          data.m_jabatan_id &&
          data.m_jabatan_id !== currentUser.m_jabatan_id
        ) {
          return errorResponse(
            403,
            "Akses ditolak. Anda tidak dapat memindahkan anggota ke jabatan lain.",
            "FORBIDDEN",
          );
        }
      }

      // Check unique constraints if username or no_handphone is updated
      if (data.username && data.username !== targetUser.username) {
        const existingUsername = await prisma.m_user.findUnique({
          where: { username: data.username },
        });
        if (existingUsername)
          return errorResponse(409, "Username sudah digunakan", "CONFLICT");
      }

      if (data.no_handphone && data.no_handphone !== targetUser.no_handphone) {
        const existingPhone = await prisma.m_user.findUnique({
          where: { no_handphone: data.no_handphone },
        });
        if (existingPhone)
          return errorResponse(
            409,
            "Nomor handphone sudah digunakan",
            "CONFLICT",
          );
      }

      // Prepare update data
      const updateData: any = { ...data };
      if (data.password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(data.password, saltRounds);
      } else {
        delete updateData.password;
      }

      const updatedUser = await prisma.m_user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          nama_lengkap: true,
          username: true,
          m_jabatan_id: true,
          m_level_id: true,
        },
      });

      // Update Single Cache & Invalidate All Users Prefix
      await setCache(
        REDIS_KEYS.USERS.SINGLE(updatedUser.id),
        updatedUser,
        DEFAULT_CACHE_TTL,
      );
      await invalidateCachePrefix(REDIS_KEYS.USERS.ALL_PREFIX);

      return successResponse(updatedUser);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

export const DELETE = withAuth(
  async (
    req: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      const resolvedParams = await params;
      const userId = parseInt(resolvedParams.id, 10);
      if (isNaN(userId)) return errorResponse(400, "ID tidak valid");

      const { level: userLevel } = req.user;
      const isFullCrud = FULL_CRUD_LEVELS.includes(userLevel.toLowerCase());
      const isKoordinator = userLevel.toLowerCase() === "koordinator";

      if (!isFullCrud && !isKoordinator) {
        return errorResponse(
          403,
          "Akses ditolak. Anda tidak memiliki izin untuk menghapus data.",
          "FORBIDDEN",
        );
      }

      const targetUser = await prisma.m_user.findUnique({
        where: { id: userId },
      });
      if (!targetUser)
        return errorResponse(404, "Data tidak ditemukan", "NOT_FOUND");

      // RBAC logic for Koordinator
      if (isKoordinator) {
        const currentUser = await prisma.m_user.findUnique({
          where: { id: req.user.userId },
          select: { m_jabatan_id: true },
        });

        if (
          !currentUser?.m_jabatan_id ||
          targetUser.m_jabatan_id !== currentUser.m_jabatan_id
        ) {
          return errorResponse(
            403,
            "Akses ditolak. Anda hanya dapat menghapus anggota di jabatan Anda sendiri.",
            "FORBIDDEN",
          );
        }
      }

      // Prevent deleting oneself
      if (req.user.userId === userId) {
        return errorResponse(
          403,
          "Tidak dapat menghapus akun Anda sendiri.",
          "FORBIDDEN",
        );
      }

      await prisma.m_user.delete({ where: { id: userId } });

      // Remove Single Cache & Invalidate All Users Prefix
      await redis.del(REDIS_KEYS.USERS.SINGLE(userId));
      await invalidateCachePrefix(REDIS_KEYS.USERS.ALL_PREFIX);

      return successResponse(null);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
