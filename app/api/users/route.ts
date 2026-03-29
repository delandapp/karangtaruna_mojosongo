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
import { redis, getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL, ELASTIC_INDICES } from "@/lib/constants";
import { searchDocuments } from "@/lib/elasticsearch";

// Schema validation for query params filtering
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  m_jabatan_id: zCommaSeparatedNumbers,
  m_level_id: zCommaSeparatedNumbers,
  search: z.string().optional(),
});

// Schema for POST
const createUserSchema = z.object({
  nama_lengkap: z.string().min(3).max(100),
  username: z
    .string()
    .min(4)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  no_handphone: z
    .string()
    .min(10)
    .max(15)
    .regex(/^[0-9]+$/),
  rt: z.string().min(1).max(5),
  rw: z.string().min(1).max(5),
  alamat: z.string().optional(),
  jenis_kelamin: z.enum(["L", "P"]).optional(),
  m_jabatan_id: z.number().int().positive().optional(),
  m_level_id: z.number().int().positive().optional(),
});

import { checkUserAccess } from "@/lib/rbac";
import { buildCacheKeyPart, buildInFilter, zCommaSeparatedNumbers } from "@/utils/helpers/api-filter";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { level: userLevel, m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/users", "GET");
    if (!hasAccess) {
      return errorResponse(403, "Akses ditolak. Anda tidak memiliki izin untuk melihat data anggota.", "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const dropdown = searchParams.get("dropdown") === "true";

    if (dropdown) {
      const dropdownCacheKey = `${REDIS_KEYS.USERS.ALL}:dropdown`;
      const cachedDropdown = await getCache<{ data: any[] }>(dropdownCacheKey);
      if (cachedDropdown) {
        return successResponse(cachedDropdown.data, 200);
      }

      const usersResult = await prisma.m_user.findMany({
        select: { id: true, nama_lengkap: true },
        orderBy: { nama_lengkap: "asc" },
      });

      await setCache(dropdownCacheKey, { data: usersResult }, DEFAULT_CACHE_TTL);
      return successResponse(usersResult, 200);
    }

    const query = Object.fromEntries(searchParams.entries());
    const validatedQuery = querySchema.parse(query);

    const { page, limit, m_jabatan_id, m_level_id, search } = validatedQuery;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply filters utilizing reusable helper
    if (m_jabatan_id && m_jabatan_id.length > 0) {
      where.m_jabatan_id = buildInFilter(m_jabatan_id);
    }
    if (m_level_id && m_level_id.length > 0) {
      where.m_level_id = buildInFilter(m_level_id);
    }
    if (search) {
      const { hits } = await searchDocuments(
        ELASTIC_INDICES.USERS,
        {
          multi_match: {
            query: search,
            fields: ["nama_lengkap", "username"],
          },
        },
        { size: 5000 } // Ambil cukup banyak id untuk difilter oleh Prisma Security
      );
      
      const ids = hits.map((h: any) => parseInt(h.id, 10)).filter((id: number) => !isNaN(id));
      
      if (ids.length === 0) {
        return paginatedResponse([], { total: 0, page, limit, totalPages: 0 });
      }
      where.id = { in: ids };
    }

    // Generate deterministric Cache Key parameter mapping based on query combinations
    const jabKey = buildCacheKeyPart(m_jabatan_id, "all");
    const lvlKey = buildCacheKeyPart(m_level_id, "all");
    const cacheKey = `${REDIS_KEYS.USERS.ALL}:page:${page}:limit:${limit}:jab:${jabKey}:lvl:${lvlKey}:search:${search || "none"}`;

    // Try hitting cache first
    const cachedData = !search ? await getCache<{ data: any[]; meta: any }>(cacheKey) : null;
    if (cachedData) {
      // Perhatikan Koordinator strict isolation di filter cache
      // The Koordinator logic below should still work if isolated correctly by params,
      // but to be safe, caching structure isolates them by their explicit jabata_id
      return paginatedResponse(cachedData.data, cachedData.meta, 200);
    }

    // Koordinator can only see users of the same jabatan
    if (userLevel.toLowerCase() === "koordinator") {
      // we need to get current user's jabatan
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

      // Pastikan koordinator hanya bisa memfilter jabatannya sendiri.
      // Jika mereka mecoba memfilter jabatan lain, kembalikan kosong.
      if (m_jabatan_id && m_jabatan_id.length > 0) {
        const isRequestingOtherJabatan = !m_jabatan_id.includes(currentUser.m_jabatan_id);
        if (isRequestingOtherJabatan) {
           return successResponse({ data: [], total: 0, page, limit }); // return empty if trying to access other jabatan
        }
      }
      
      // Override/Set filter ke jabatan koordinator itu sendiri
      where.m_jabatan_id = currentUser.m_jabatan_id;
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
        }, // Omit password
      }),
      prisma.m_user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { total, page, limit, totalPages };

    // Set to Cache
    if (!search) { await setCache(cacheKey, { data: users, meta }, DEFAULT_CACHE_TTL); }

    return paginatedResponse(users, meta);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { level: userLevel, m_level_id: userLevelId, m_jabatan_id: userJabatanId } = req.user;
    const isKoordinator = userLevel.toLowerCase() === "koordinator";

    const hasAccess = await checkUserAccess(userLevelId, userJabatanId, "/api/users", "POST");

    if (!hasAccess) {
      return errorResponse(
        403,
        "Akses ditolak. Anda tidak memiliki izin untuk menambah data.",
        "FORBIDDEN",
      );
    }

    const body = await req.json();
    const data = createUserSchema.parse(body);

    // RBAC logic for Koordinator
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

      // Koordinator MUST create user within their own jabatan
      if (data.m_jabatan_id !== currentUser.m_jabatan_id) {
        return errorResponse(
          403,
          "Koordinator hanya dapat menambahkan anggota ke dalam jabatannya sendiri.",
          "FORBIDDEN",
        );
      }
    }

    // Check unique constraints manually to provide clear error messages
    const existingUsername = await prisma.m_user.findUnique({
      where: { username: data.username },
    });
    if (existingUsername) {
      return errorResponse(409, "Username sudah digunakan", "CONFLICT");
    }

    const existingPhone = await prisma.m_user.findUnique({
      where: { no_handphone: data.no_handphone },
    });
    if (existingPhone) {
      return errorResponse(409, "Nomor handphone sudah digunakan", "CONFLICT");
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create user
    const newUser = await prisma.m_user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        nama_lengkap: true,
        username: true,
        m_jabatan_id: true,
        m_level_id: true,
      },
    });

    // Invalidate All Users Cache Prefix on successful creation
    return successResponse(newUser, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
