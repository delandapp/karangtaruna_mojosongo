/**
 * Unit Tests — lib/rbac.ts (checkUserAccess)
 * Tests: cache hit, deny by default, allow all level/jabatan, rule matching
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Use the mocked modules from setup.ts
import { checkUserAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getCache } from "@/lib/redis";

const mockGetCache = vi.mocked(getCache);
const mockPrisma = vi.mocked(prisma);

describe("lib/rbac — checkUserAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no cache hit => fall through to DB query
    mockGetCache.mockResolvedValue(null);
  });

  it("returns cached result (true) immediately without DB call", async () => {
    mockGetCache.mockResolvedValueOnce(true as any);
    const result = await checkUserAccess(1, 1, "/api/organisasi", "GET");
    expect(result).toBe(true);
    expect(mockPrisma.m_hak_akses.findFirst).not.toHaveBeenCalled();
  });

  it("returns cached result (false) immediately without DB call", async () => {
    // Force cache to return false — must be returned as-is
    // Note: the rbac code checks: if (cachedAccess !== null) return cachedAccess
    // So returning false (not null) should short-circuit
    mockGetCache.mockImplementationOnce(async () => false as any);
    const result = await checkUserAccess(2, 2, "/api/organisasi", "DELETE");
    expect(result).toBe(false);
    expect(mockPrisma.m_hak_akses.findFirst).not.toHaveBeenCalled();
  });

  it("returns false when endpoint is not registered in DB", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce(null as any);
    const result = await checkUserAccess(1, 1, "/api/nonexistent", "GET");
    expect(result).toBe(false);
  });

  it("returns true when is_all_level and is_all_jabatan are true", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 1,
      endpoint: "/api/public",
      method: "GET",
      is_all_level: true,
      is_all_jabatan: true,
      rules: [],
    } as any);
    const result = await checkUserAccess(1, 1, "/api/public", "GET");
    expect(result).toBe(true);
  });

  it("returns true when rule matches exact level AND jabatan", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 2,
      is_all_level: false,
      is_all_jabatan: false,
      rules: [{ m_level_id: 1, m_jabatan_id: 2 }],
    } as any);
    const result = await checkUserAccess(1, 2, "/api/admin", "POST");
    expect(result).toBe(true);
  });

  it("returns false when level matches but jabatan doesn't", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 3,
      is_all_level: false,
      is_all_jabatan: false,
      rules: [{ m_level_id: 1, m_jabatan_id: 3 }],
    } as any);
    // jabatanId=99 doesn't match rule's jabatan_id=3
    const result = await checkUserAccess(1, 99, "/api/secure", "DELETE");
    expect(result).toBe(false);
  });

  it("returns true when rule only specifies level (any jabatan)", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 4,
      is_all_level: false,
      is_all_jabatan: false,
      rules: [{ m_level_id: 5, m_jabatan_id: null }],
    } as any);
    const result = await checkUserAccess(5, 99, "/api/level-only", "GET");
    expect(result).toBe(true);
  });

  it("returns true when rule only specifies jabatan (any level)", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 5,
      is_all_level: false,
      is_all_jabatan: false,
      rules: [{ m_level_id: null, m_jabatan_id: 7 }],
    } as any);
    const result = await checkUserAccess(0, 7, "/api/jabatan-only", "GET");
    expect(result).toBe(true);
  });

  it("returns false when no rules match user level+jabatan", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 6,
      is_all_level: false,
      is_all_jabatan: false,
      rules: [
        { m_level_id: 10, m_jabatan_id: 10 },
      ],
    } as any);
    const result = await checkUserAccess(1, 1, "/api/test", "PUT");
    expect(result).toBe(false);
  });
});


const mockGetCache = vi.mocked(getCache);
const mockSetCache = vi.mocked(setCache);
const mockPrisma = vi.mocked(prisma);

describe("lib/rbac — checkUserAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCache.mockResolvedValue(null);
  });

  it("returns cached result if available (true)", async () => {
    mockGetCache.mockResolvedValueOnce(true as any);
    const result = await checkUserAccess(1, 1, "/api/organisasi", "GET");
    expect(result).toBe(true);
    expect(mockPrisma.m_hak_akses.findFirst).not.toHaveBeenCalled();
  });

  it("returns cached result if available (false)", async () => {
    mockGetCache.mockResolvedValueOnce(false as any);
    const result = await checkUserAccess(2, 2, "/api/organisasi", "DELETE");
    expect(result).toBe(false);
  });

  it("returns false when endpoint is not registered", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce(null as any);
    const result = await checkUserAccess(1, 1, "/api/unknown", "GET");
    expect(result).toBe(false);
  });

  it("returns true when is_all_level and is_all_jabatan are true", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 1,
      endpoint: "/api/public",
      method: "GET",
      is_all_level: true,
      is_all_jabatan: true,
      rules: [],
    } as any);
    const result = await checkUserAccess(1, 1, "/api/public", "GET");
    expect(result).toBe(true);
    expect(mockSetCache).toHaveBeenCalledWith(expect.any(String), true, expect.any(Number));
  });

  it("returns true when rule matches exact level AND jabatan", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 2,
      endpoint: "/api/admin",
      method: "POST",
      is_all_level: false,
      is_all_jabatan: false,
      rules: [{ m_level_id: 1, m_jabatan_id: 2 }],
    } as any);
    const result = await checkUserAccess(1, 2, "/api/admin", "POST");
    expect(result).toBe(true);
  });

  it("returns false when level matches but jabatan doesn't", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 3,
      endpoint: "/api/secure",
      method: "DELETE",
      is_all_level: false,
      is_all_jabatan: false,
      rules: [{ m_level_id: 1, m_jabatan_id: 3 }],
    } as any);
    const result = await checkUserAccess(1, 99, "/api/secure", "DELETE");
    expect(result).toBe(false);
  });

  it("returns true when rule only specifies level (any jabatan)", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 4,
      endpoint: "/api/level-only",
      method: "GET",
      is_all_level: false,
      is_all_jabatan: false,
      rules: [{ m_level_id: 5, m_jabatan_id: null }],
    } as any);
    const result = await checkUserAccess(5, 99, "/api/level-only", "GET");
    expect(result).toBe(true);
  });

  it("returns true when rule only specifies jabatan (any level)", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 5,
      endpoint: "/api/jabatan-only",
      method: "GET",
      is_all_level: false,
      is_all_jabatan: false,
      rules: [{ m_level_id: null, m_jabatan_id: 7 }],
    } as any);
    const result = await checkUserAccess(0, 7, "/api/jabatan-only", "GET");
    expect(result).toBe(true);
  });

  it("caches the result after computing access", async () => {
    vi.mocked(mockPrisma.m_hak_akses.findFirst).mockResolvedValueOnce({
      id: 6,
      endpoint: "/api/test",
      method: "PUT",
      is_all_level: false,
      is_all_jabatan: false,
      rules: [],
    } as any);
    await checkUserAccess(1, 1, "/api/test", "PUT");
    expect(mockSetCache).toHaveBeenCalledWith(
      expect.stringContaining("rbac:access"),
      false,
      expect.any(Number)
    );
  });
});
