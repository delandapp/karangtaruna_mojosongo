import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import bcrypt from "bcrypt";
import { z } from "zod";
import { getCache, setCache } from "@/lib/redis";
import {
  REDIS_KEYS,
  DEFAULT_CACHE_TTL,
  ELASTIC_INDICES,
} from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";
import { produceCacheInvalidate } from "@/lib/kafka";

// ─── Validation Schemas ───────────────────────────────────────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  m_jabatan_id: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map(Number)
            .filter((n) => !isNaN(n))
        : undefined,
    ),
  m_level_id: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map(Number)
            .filter((n) => !isNaN(n))
        : undefined,
    ),
  dropdown: z.coerce.boolean().default(false),
});

const createUserSchema = z.object({
  nama_lengkap: z.string().min(3).max(100),
  username: z
    .string()
    .min(4)
    .max(50)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username hanya boleh huruf, angka, dan underscore",
    ),
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung huruf besar, kecil, dan angka",
    ),
  no_handphone: z
    .string()
    .min(10)
    .max(15)
    .regex(/^[0-9]+$/, "Nomor handphone hanya boleh berisi angka"),
  rt: z.string().min(1).max(5),
  rw: z.string().min(1).max(5),
  alamat: z.string().optional(),
  jenis_kelamin: z.enum(["L", "P"]).optional(),
  m_jabatan_id: z.number().int().positive().optional(),
  m_level_id: z.number().int().positive().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/users — List dengan Pagination, Search & Filter
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { level: userLevel } = req.user;
    const { searchParams } = new URL(req.url);
    const { page, limit, search, m_jabatan_id, m_level_id, dropdown } =
      listQuerySchema.parse(Object.fromEntries(searchParams));

    // ── Mode Dropdown (untuk select input) ───────────────────────────────
    if (dropdown) {
      const cacheKey = `${REDIS_KEYS.USERS.ALL}:dropdown`;
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return successResponse(cached, 200);

      const users = await prisma.m_user.findMany({
        select: { id: true, nama_lengkap: true },
        orderBy: { nama_lengkap: "asc" },
      });

      await setCache(cacheKey, users, DEFAULT_CACHE_TTL);
      return successResponse(users, 200);
    }

    // ── Mode Paginated ────────────────────────────────────────────────────
    const skip = (page - 1) * limit;
    const isFiltered = !!(search || m_jabatan_id?.length || m_level_id?.length);

    // Koordinator hanya boleh melihat user di jabatannya sendiri
    let forcedJabatanId: number | null = null;
    if (userLevel.toLowerCase() === "koordinator") {
      const currentUser = await prisma.m_user.findUnique({
        where: { id: req.user.userId },
        select: { m_jabatan_id: true },
      });

      if (!currentUser?.m_jabatan_id) {
        return errorResponse(
          403,
          "Koordinator tidak memiliki jabatan",
          "FORBIDDEN",
        );
      }

      // Jika koordinator mencoba filter jabatan lain → return kosong
      if (
        m_jabatan_id?.length &&
        !m_jabatan_id.includes(currentUser.m_jabatan_id)
      ) {
        return paginatedResponse(
          [],
          { total: 0, page, limit, totalPages: 0 },
          200,
        );
      }

      forcedJabatanId = currentUser.m_jabatan_id;
    }

    // Buat cache key yang mencerminkan semua parameter
    const jabKey = m_jabatan_id?.join(",") ?? "all";
    const lvlKey = m_level_id?.join(",") ?? "all";
    const cacheKey = `${REDIS_KEYS.USERS.ALL}:page:${page}:limit:${limit}:jab:${jabKey}:lvl:${lvlKey}`;

    // Cek cache hanya untuk query tanpa search
    if (!search) {
      const cached = await getCache<{ data: unknown[]; meta: unknown }>(
        cacheKey,
      );
      if (cached)
        return paginatedResponse(cached.data as any[], cached.meta as any, 200);
    }

    // ── Query via Elasticsearch untuk search, Prisma untuk list ──────────
    let idFilter: number[] | undefined;

    if (search) {
      const { hits } = await searchDocuments(
        ELASTIC_INDICES.USERS,
        {
          multi_match: {
            query: search,
            fields: ["nama_lengkap", "username"],
            fuzziness: "AUTO",
          },
        },
        { size: 5000 },
      );

      idFilter = hits
        .map((h: any) => parseInt(h.id ?? h._id, 10))
        .filter((id: number) => !isNaN(id));

      if (idFilter.length === 0) {
        return paginatedResponse(
          [],
          { total: 0, page, limit, totalPages: 0 },
          200,
        );
      }
    }

    // Build Prisma where clause
    const where: Record<string, unknown> = {};
    if (idFilter) where.id = { in: idFilter };
    if (forcedJabatanId) {
      where.m_jabatan_id = forcedJabatanId;
    } else {
      if (m_jabatan_id?.length) where.m_jabatan_id = { in: m_jabatan_id };
      if (m_level_id?.length) where.m_level_id = { in: m_level_id };
    }

    const [users, total] = await Promise.all([
      prisma.m_user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nama_lengkap: true,
          username: true,
          no_handphone: true,
          rt: true,
          rw: true,
          alamat: true,
          jenis_kelamin: true,
          m_jabatan_id: true,
          m_level_id: true,
          createdAt: true,
          jabatan: { select: { nama_jabatan: true } },
          level: { select: { nama_level: true } },
        },
      }),
      prisma.m_user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { total, page, limit, totalPages };

    // Simpan ke cache jika bukan search
    if (!search) {
      await setCache(cacheKey, { data: users, meta }, DEFAULT_CACHE_TTL);
    }

    return paginatedResponse(users, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/users — Buat User Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { level: userLevel } = req.user;
    const isKoordinator = userLevel.toLowerCase() === "koordinator";

    const body = await req.json();
    const data = createUserSchema.parse(body);

    // Koordinator hanya boleh membuat user di jabatannya sendiri
    if (isKoordinator) {
      const currentUser = await prisma.m_user.findUnique({
        where: { id: req.user.userId },
        select: { m_jabatan_id: true },
      });

      if (!currentUser?.m_jabatan_id) {
        return errorResponse(
          403,
          "Koordinator tidak memiliki jabatan",
          "FORBIDDEN",
        );
      }

      if (data.m_jabatan_id !== currentUser.m_jabatan_id) {
        return errorResponse(
          403,
          "Koordinator hanya dapat menambahkan anggota ke dalam jabatannya sendiri.",
          "FORBIDDEN",
        );
      }
    }

    // Cek unique constraints dengan pesan error yang jelas
    const existingUsername = await prisma.m_user.findUnique({
      where: { username: data.username },
      select: { id: true },
    });
    if (existingUsername) {
      return errorResponse(409, "Username sudah digunakan", "CONFLICT");
    }

    const existingPhone = await prisma.m_user.findUnique({
      where: { no_handphone: data.no_handphone },
      select: { id: true },
    });
    if (existingPhone) {
      return errorResponse(409, "Nomor handphone sudah digunakan", "CONFLICT");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.m_user.create({
      data: { ...data, password: hashedPassword },
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        m_jabatan_id: true,
        m_level_id: true,
      },
    });

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(REDIS_KEYS.USERS.ALL_PREFIX);

    return successResponse(newUser, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
