/**
 * Vitest Global Setup
 * Mocks all external dependencies: Prisma, Redis, JWT, Auth Middleware
 */
import { vi } from "vitest";

// ─── Mock Next.js server module ──────────────────────────────────────────────
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => {
      return {
        json: async () => body,
        status: init?.status ?? 200,
        headers: new Map(),
      };
    }),
  },
  NextRequest: vi.fn(),
}));

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    m_provinsi: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    m_kota: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    m_kecamatan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    m_kelurahan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    m_organisasi: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    m_user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    m_jabatan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    m_level: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    m_hak_akses: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    m_hak_akses_rule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $executeRawUnsafe: vi.fn(),
  },
}));

// ─── Mock Redis ───────────────────────────────────────────────────────────────
vi.mock("@/lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
  },
  getCache: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
  invalidateCachePrefix: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock Auth Middleware ─────────────────────────────────────────────────────
vi.mock("@/lib/auth-middleware", () => ({
  withAuth: vi.fn((handler) => {
    return async (req: any, props: any) => {
      req.user = {
        id: 1,
        m_level_id: 1,
        m_jabatan_id: 1,
        username: "admin",
        nama_lengkap: "Admin Test",
      };
      return handler(req, props);
    };
  }),
}));

// ─── Mock RBAC ────────────────────────────────────────────────────────────────
vi.mock("@/lib/rbac", () => ({
  checkUserAccess: vi.fn().mockResolvedValue(true),
}));
