import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { invalidateCachePrefix } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";

import { REDIS_KEYS, ELASTIC_INDICES } from "@/lib/constants";
import bcrypt from "bcrypt";
import { z } from "zod";

type RouteProps = { params: Promise<{ id: string }> };

// ─── Schema ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseId = (id: string): number | null => {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
};

// ──────────────────────────────────────────────────────────
// PUT /api/users/[id] — Update User
// ──────────────────────────────────────────────────────────
export const PUT = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const userId = parseId(rawId);
      if (!userId)
        return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { level: userLevel } = req.user;
      const isKoordinator = userLevel.toLowerCase() === "koordinator";

      // Ambil target user
      const targetUser = await prisma.m_user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          no_handphone: true,
          m_jabatan_id: true,
        },
      });
      if (!targetUser)
        return errorResponse(404, "Data tidak ditemukan", "NOT_FOUND");

      const body = await req.json();
      const data = updateUserSchema.parse(body);

      // RBAC: Koordinator hanya boleh update user di jabatannya sendiri
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

        // Koordinator tidak boleh memindahkan user ke jabatan lain
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

      // Cek uniqueness username jika berubah
      if (data.username && data.username !== targetUser.username) {
        const existing = await prisma.m_user.findUnique({
          where: { username: data.username },
        });
        if (existing)
          return errorResponse(409, "Username sudah digunakan", "CONFLICT");
      }

      // Cek uniqueness no_handphone jika berubah
      if (data.no_handphone && data.no_handphone !== targetUser.no_handphone) {
        const existing = await prisma.m_user.findUnique({
          where: { no_handphone: data.no_handphone },
        });
        if (existing)
          return errorResponse(
            409,
            "Nomor handphone sudah digunakan",
            "CONFLICT",
          );
      }

      // Hash password jika disertakan
      const updateData: Record<string, unknown> = { ...data };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      } else {
        delete updateData.password;
      }

      const updated = await prisma.m_user.update({
        where: { id: userId },
        data: updateData as any,
        select: {
          id: true,
          nama_lengkap: true,
          username: true,
          m_jabatan_id: true,
          m_level_id: true,
        },
      });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.USERS.SINGLE(userId));
      await indexDocument(ELASTIC_INDICES.USERS, String(updated.id), updated);
      await invalidateCachePrefix(REDIS_KEYS.USERS.ALL_PREFIX);
      return successResponse(updated, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// ──────────────────────────────────────────────────────────
// DELETE /api/users/[id] — Hapus User
// ──────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }: RouteProps) => {
    try {
      const { id: rawId } = await params;
      const userId = parseId(rawId);
      if (!userId)
        return errorResponse(400, "ID tidak valid", "VALIDATION_ERROR");

      const { level: userLevel } = req.user;
      const isKoordinator = userLevel.toLowerCase() === "koordinator";

      // Cegah user menghapus dirinya sendiri
      if (req.user.userId === userId) {
        return errorResponse(
          403,
          "Tidak dapat menghapus akun Anda sendiri.",
          "FORBIDDEN",
        );
      }

      const targetUser = await prisma.m_user.findUnique({
        where: { id: userId },
        select: { id: true, m_jabatan_id: true },
      });
      if (!targetUser)
        return errorResponse(404, "Data tidak ditemukan", "NOT_FOUND");

      // RBAC: Koordinator hanya boleh hapus user di jabatannya sendiri
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

      await prisma.m_user.delete({ where: { id: userId } });

      // Invalidate cache
      await invalidateCachePrefix(REDIS_KEYS.USERS.SINGLE(userId));
      await deleteDocument(ELASTIC_INDICES.USERS, userId);
      await invalidateCachePrefix(REDIS_KEYS.USERS.ALL_PREFIX);
      return successResponse(null, 200);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
