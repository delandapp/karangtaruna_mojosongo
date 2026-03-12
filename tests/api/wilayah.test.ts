/**
 * Unit Tests — app/api/wilayah/* (GET endpoints)
 * Tests: Provinsi, Kota, Kecamatan, Kelurahan — cache hits, DB queries, filters
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getCache, setCache } from "@/lib/redis";

const mockPrisma = vi.mocked(prisma);
const mockGetCache = vi.mocked(getCache);
const mockSetCache = vi.mocked(setCache);

// Helper to build a mock Next.js auth request
function buildRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/wilayah");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return {
    url: url.toString(),
    nextUrl: url,
    user: { id: 1, m_level_id: 1, m_jabatan_id: 1 },
  } as any;
}

// ─── Provinsi ─────────────────────────────────────────────────────────────────
describe("GET /api/wilayah/provinsi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns cached result if available", async () => {
    const cachedData = [{ id: 1, kode_wilayah: "030000", nama: "Prov. Jawa Tengah" }];
    mockGetCache.mockResolvedValueOnce(cachedData);

    const { GET } = await import("@/app/api/wilayah/provinsi/route");
    const response = await GET(buildRequest(), {} as any);
    const json = await (response as any).json();

    expect(json.success).toBe(true);
    expect(json.data).toEqual(cachedData);
    expect(mockPrisma.m_provinsi.findMany).not.toHaveBeenCalled();
  });

  it("fetches from DB when cache is empty and caches the result", async () => {
    mockGetCache.mockResolvedValueOnce(null);
    const dbData = [
      { id: 1, kode_wilayah: "030000", nama: "Prov. Jawa Tengah" },
      { id: 2, kode_wilayah: "010000", nama: "Prov. Aceh" },
    ];
    vi.mocked(mockPrisma.m_provinsi.findMany).mockResolvedValueOnce(dbData as any);

    const { GET } = await import("@/app/api/wilayah/provinsi/route");
    const response = await GET(buildRequest(), {} as any);
    const json = await (response as any).json();

    expect(json.success).toBe(true);
    expect(json.data).toEqual(dbData);
    expect(mockSetCache).toHaveBeenCalled();
  });
});

// ─── Kota ─────────────────────────────────────────────────────────────────────
describe("GET /api/wilayah/kota", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all kota when no provinsi_kode filter", async () => {
    mockGetCache.mockResolvedValueOnce(null);
    const dbData = [{ id: 1, kode_wilayah: "030110", nama: "Kota Surakarta", m_provinsi_id: 1 }];
    vi.mocked(mockPrisma.m_kota.findMany).mockResolvedValueOnce(dbData as any);

    const { GET } = await import("@/app/api/wilayah/kota/route");
    const response = await GET(buildRequest(), {} as any);
    const json = await (response as any).json();

    expect(json.success).toBe(true);
    expect(mockPrisma.m_kota.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it("filters by provinsi_kode when provided", async () => {
    mockGetCache.mockResolvedValueOnce(null);
    vi.mocked(mockPrisma.m_kota.findMany).mockResolvedValueOnce([] as any);

    const { GET } = await import("@/app/api/wilayah/kota/route");
    await GET(buildRequest({ provinsi_kode: "030000" }), {} as any);

    expect(mockPrisma.m_kota.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { m_provinsi: { kode_wilayah: "030000" } },
      })
    );
  });

  it("returns cached result", async () => {
    const cached = [{ id: 5, kode_wilayah: "030110", nama: "Kota Solo" }];
    mockGetCache.mockResolvedValueOnce(cached);

    const { GET } = await import("@/app/api/wilayah/kota/route");
    const response = await GET(buildRequest({ provinsi_kode: "030000" }), {} as any);
    const json = await (response as any).json();
    expect(json.data).toEqual(cached);
    expect(mockPrisma.m_kota.findMany).not.toHaveBeenCalled();
  });
});

// ─── Kecamatan ────────────────────────────────────────────────────────────────
describe("GET /api/wilayah/kecamatan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters by kota_kode when provided", async () => {
    mockGetCache.mockResolvedValueOnce(null);
    vi.mocked(mockPrisma.m_kecamatan.findMany).mockResolvedValueOnce([] as any);

    const { GET } = await import("@/app/api/wilayah/kecamatan/route");
    await GET(buildRequest({ kota_kode: "030110" }), {} as any);

    expect(mockPrisma.m_kecamatan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { m_kota: { kode_wilayah: "030110" } },
      })
    );
  });

  it("returns all when no filter", async () => {
    mockGetCache.mockResolvedValueOnce(null);
    vi.mocked(mockPrisma.m_kecamatan.findMany).mockResolvedValueOnce([] as any);

    const { GET } = await import("@/app/api/wilayah/kecamatan/route");
    await GET(buildRequest(), {} as any);

    expect(mockPrisma.m_kecamatan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });
});

// ─── Kelurahan ────────────────────────────────────────────────────────────────
describe("GET /api/wilayah/kelurahan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters by kecamatan_kode when provided", async () => {
    mockGetCache.mockResolvedValueOnce(null);
    vi.mocked(mockPrisma.m_kelurahan.findMany).mockResolvedValueOnce([] as any);

    const { GET } = await import("@/app/api/wilayah/kelurahan/route");
    await GET(buildRequest({ kecamatan_kode: "03011001" }), {} as any);

    expect(mockPrisma.m_kelurahan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { m_kecamatan: { kode_wilayah: "03011001" } },
      })
    );
  });

  it("returns all when no filter", async () => {
    mockGetCache.mockResolvedValueOnce(null);
    vi.mocked(mockPrisma.m_kelurahan.findMany).mockResolvedValueOnce([] as any);

    const { GET } = await import("@/app/api/wilayah/kelurahan/route");
    await GET(buildRequest(), {} as any);

    expect(mockPrisma.m_kelurahan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });
});
