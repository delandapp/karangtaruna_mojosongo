/**
 * Unit Tests — app/api/organisasi (GET list, POST)
 *              app/api/organisasi/[id] (GET detail, PUT, DELETE)
 * Tests: pagination, search, create with validation, update, delete, cache
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";
import { checkUserAccess } from "@/lib/rbac";

const mockPrisma = vi.mocked(prisma);
const mockGetCache = vi.mocked(getCache);
const mockSetCache = vi.mocked(setCache);
const mockInvalidateCache = vi.mocked(invalidateCachePrefix);
const mockCheckAccess = vi.mocked(checkUserAccess);

const sampleOrganisasi = {
  id: 1,
  nama_org: "Karang Taruna Mojosongo",
  kode_wilayah_induk_provinsi: "030000",
  kode_wilayah_induk_kota: "030110",
  kode_wilayah_induk_kecamatan: "03011001",
  kode_wilayah_induk_kelurahan: "030110010201",
  m_provinsi: { id: 1, nama: "Prov. Jawa Tengah", kode_wilayah: "030000" },
  m_kota: { id: 1, nama: "Kota Surakarta", kode_wilayah: "030110" },
  m_kecamatan: { id: 1, nama: "Kec. Jebres", kode_wilayah: "03011001" },
  m_kelurahan: { id: 1, nama: "Mojosongo", kode_wilayah: "030110010201" },
  dibuat_pada: new Date(),
  diperbarui_pada: new Date(),
};

function buildRequest(
  body?: object,
  params: Record<string, string> = {}
) {
  const url = new URL("http://localhost/api/organisasi");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return {
    url: url.toString(),
    nextUrl: url,
    json: async () => body,
    user: { id: 1, m_level_id: 1, m_jabatan_id: 1 },
  } as any;
}

function buildIdProps(id: number) {
  return { params: Promise.resolve({ id: String(id) }) } as any;
}

// ─── GET /api/organisasi (List) ───────────────────────────────────────────────
describe("GET /api/organisasi (list)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAccess.mockResolvedValue(true);
    mockGetCache.mockResolvedValue(null);
  });

  it("returns paginated organisasi list from DB", async () => {
    vi.mocked(mockPrisma.m_organisasi.findMany).mockResolvedValueOnce([sampleOrganisasi] as any);
    vi.mocked(mockPrisma.m_organisasi.count).mockResolvedValueOnce(1);

    const { GET } = await import("@/app/api/organisasi/route");
    const response = await GET(buildRequest(), {} as any);
    const json = await (response as any).json();

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.meta.total).toBe(1);
  });

  it("returns cached list when cache hit", async () => {
    mockGetCache.mockResolvedValueOnce({
      data: [sampleOrganisasi],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any);

    const { GET } = await import("@/app/api/organisasi/route");
    const response = await GET(buildRequest(), {} as any);
    const json = await (response as any).json();

    expect(json.success).toBe(true);
    expect(mockPrisma.m_organisasi.findMany).not.toHaveBeenCalled();
  });

  it("returns 403 when user has no access", async () => {
    mockCheckAccess.mockResolvedValueOnce(false);

    const { GET } = await import("@/app/api/organisasi/route");
    const response = await GET(buildRequest(), {} as any);
    expect((response as any).status).toBe(403);
  });

  it("applies search filter when ?search= is provided", async () => {
    vi.mocked(mockPrisma.m_organisasi.findMany).mockResolvedValueOnce([] as any);
    vi.mocked(mockPrisma.m_organisasi.count).mockResolvedValueOnce(0);

    const { GET } = await import("@/app/api/organisasi/route");
    await GET(buildRequest({}, { search: "Taruna" }), {} as any);

    expect(mockPrisma.m_organisasi.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    );
  });
});

// ─── POST /api/organisasi (Create) ───────────────────────────────────────────
describe("POST /api/organisasi (create)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAccess.mockResolvedValue(true);
  });

  const validBody = {
    nama_org: "Pokdarwis Mojosongo",
    kode_wilayah_induk_provinsi: "030000",
    kode_wilayah_induk_kota: "030110",
    kode_wilayah_induk_kecamatan: "03011001",
    kode_wilayah_induk_kelurahan: "030110010201",
  };

  it("creates organisasi and returns 201", async () => {
    vi.mocked(mockPrisma.m_organisasi.create).mockResolvedValueOnce({
      ...sampleOrganisasi,
      id: 2,
      nama_org: "Pokdarwis Mojosongo",
    } as any);

    const { POST } = await import("@/app/api/organisasi/route");
    const response = await POST(buildRequest(validBody), {} as any);
    expect((response as any).status).toBe(201);
  });

  it("returns 400 when nama_org is too short", async () => {
    const { POST } = await import("@/app/api/organisasi/route");
    const response = await POST(
      buildRequest({ ...validBody, nama_org: "AB" }),
      {} as any
    );
    expect((response as any).status).toBe(400);
  });

  it("returns 400 when kode_wilayah_induk_provinsi is missing", async () => {
    const { POST } = await import("@/app/api/organisasi/route");
    const { kode_wilayah_induk_provinsi, ...bad } = validBody;
    const response = await POST(buildRequest(bad), {} as any);
    expect((response as any).status).toBe(400);
  });

  it("returns 403 when user lacks write access", async () => {
    mockCheckAccess.mockResolvedValueOnce(false);
    const { POST } = await import("@/app/api/organisasi/route");
    const response = await POST(buildRequest(validBody), {} as any);
    expect((response as any).status).toBe(403);
  });

  it("invalidates cache after successful create", async () => {
    vi.mocked(mockPrisma.m_organisasi.create).mockResolvedValueOnce({ ...sampleOrganisasi, id: 3 } as any);
    const { POST } = await import("@/app/api/organisasi/route");
    await POST(buildRequest(validBody), {} as any);
    expect(mockInvalidateCache).toHaveBeenCalled();
  });
});

// ─── GET /api/organisasi/[id] (Detail) ───────────────────────────────────────
describe("GET /api/organisasi/[id] (detail)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAccess.mockResolvedValue(true);
    mockGetCache.mockResolvedValue(null);
  });

  it("returns organisasi by ID", async () => {
    vi.mocked(mockPrisma.m_organisasi.findUnique).mockResolvedValueOnce(sampleOrganisasi as any);

    const { GET } = await import("@/app/api/organisasi/[id]/route");
    const response = await GET(buildRequest(), buildIdProps(1));
    const json = await (response as any).json();

    expect(json.success).toBe(true);
    expect(json.data.id).toBe(1);
  });

  it("returns 404 when organisasi not found", async () => {
    vi.mocked(mockPrisma.m_organisasi.findUnique).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/organisasi/[id]/route");
    const response = await GET(buildRequest(), buildIdProps(9999));
    expect((response as any).status).toBe(404);
  });

  it("returns 400 for invalid (non-numeric) ID", async () => {
    const req = buildRequest();
    const props = { params: Promise.resolve({ id: "abc" }) } as any;

    const { GET } = await import("@/app/api/organisasi/[id]/route");
    const response = await GET(req, props);
    expect((response as any).status).toBe(400);
  });

  it("returns cached result when cache hit", async () => {
    mockGetCache.mockResolvedValueOnce(sampleOrganisasi);

    const { GET } = await import("@/app/api/organisasi/[id]/route");
    const response = await GET(buildRequest(), buildIdProps(1));
    const json = await (response as any).json();

    expect(json.success).toBe(true);
    expect(mockPrisma.m_organisasi.findUnique).not.toHaveBeenCalled();
  });
});

// ─── PUT /api/organisasi/[id] (Update) ───────────────────────────────────────
describe("PUT /api/organisasi/[id] (update)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAccess.mockResolvedValue(true);
  });

  it("updates and returns the updated organisasi", async () => {
    vi.mocked(mockPrisma.m_organisasi.findUnique).mockResolvedValueOnce(sampleOrganisasi as any);
    vi.mocked(mockPrisma.m_organisasi.update).mockResolvedValueOnce({
      ...sampleOrganisasi,
      nama_org: "Updated Name",
    } as any);

    const { PUT } = await import("@/app/api/organisasi/[id]/route");
    const response = await PUT(buildRequest({ nama_org: "Updated Name" }), buildIdProps(1));
    const json = await (response as any).json();

    expect(json.success).toBe(true);
    expect(json.data.nama_org).toBe("Updated Name");
  });

  it("returns 404 when record not found before update", async () => {
    vi.mocked(mockPrisma.m_organisasi.findUnique).mockResolvedValueOnce(null);

    const { PUT } = await import("@/app/api/organisasi/[id]/route");
    const response = await PUT(buildRequest({ nama_org: "X Y Z" }), buildIdProps(9999));
    expect((response as any).status).toBe(404);
  });
});

// ─── DELETE /api/organisasi/[id] (Delete) ─────────────────────────────────────
describe("DELETE /api/organisasi/[id] (delete)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAccess.mockResolvedValue(true);
  });

  it("deletes organisasi and returns 200", async () => {
    vi.mocked(mockPrisma.m_organisasi.findUnique).mockResolvedValueOnce(sampleOrganisasi as any);
    vi.mocked(mockPrisma.m_organisasi.delete).mockResolvedValueOnce(sampleOrganisasi as any);

    const { DELETE } = await import("@/app/api/organisasi/[id]/route");
    const response = await DELETE(buildRequest(), buildIdProps(1));
    const json = await (response as any).json();

    expect(json.success).toBe(true);
  });

  it("returns 404 when record not found", async () => {
    vi.mocked(mockPrisma.m_organisasi.findUnique).mockResolvedValueOnce(null);

    const { DELETE } = await import("@/app/api/organisasi/[id]/route");
    const response = await DELETE(buildRequest(), buildIdProps(404));
    expect((response as any).status).toBe(404);
  });

  it("returns 403 when user lacks delete access", async () => {
    mockCheckAccess.mockResolvedValueOnce(false);

    const { DELETE } = await import("@/app/api/organisasi/[id]/route");
    const response = await DELETE(buildRequest(), buildIdProps(1));
    expect((response as any).status).toBe(403);
  });

  it("invalidates cache after delete", async () => {
    vi.mocked(mockPrisma.m_organisasi.findUnique).mockResolvedValueOnce(sampleOrganisasi as any);
    vi.mocked(mockPrisma.m_organisasi.delete).mockResolvedValueOnce(sampleOrganisasi as any);

    const { DELETE } = await import("@/app/api/organisasi/[id]/route");
    await DELETE(buildRequest(), buildIdProps(1));
    expect(mockInvalidateCache).toHaveBeenCalled();
  });
});
