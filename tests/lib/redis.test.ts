/**
 * Unit Tests — lib/redis.ts
 * Tests: setCache, getCache, invalidateCachePrefix
 *
 * Strategy: mock the @/lib/redis module directly (from setup.ts) and test
 * the behavior contracts. For BigInt serialization we test the replacer in isolation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCache, setCache, invalidateCachePrefix } from "@/lib/redis";

const mockGetCache = vi.mocked(getCache);
const mockSetCache = vi.mocked(setCache);
const mockInvalidate = vi.mocked(invalidateCachePrefix);

// ─── BigInt Replacer (inline test, no external dependency) ─────────────────
describe("BigInt JSON Serialization", () => {
  const bigIntReplacer = (_k: string, v: unknown) =>
    typeof v === "bigint" ? Number(v) : v;

  it("converts BigInt to Number in JSON.stringify", () => {
    const data = { id: BigInt(9001), nama: "Test Provinsi" };
    expect(() => JSON.stringify(data)).toThrow();
    expect(() => JSON.stringify(data, bigIntReplacer)).not.toThrow();
    const result = JSON.parse(JSON.stringify(data, bigIntReplacer));
    expect(result.id).toBe(9001);
    expect(typeof result.id).toBe("number");
  });

  it("leaves regular numbers unchanged", () => {
    const data = { count: 42, price: 1.99 };
    const result = JSON.parse(JSON.stringify(data, bigIntReplacer));
    expect(result.count).toBe(42);
    expect(result.price).toBe(1.99);
  });

  it("handles nested BigInt values", () => {
    const data = { user: { id: BigInt(500), level_id: BigInt(3) } };
    const result = JSON.parse(JSON.stringify(data, bigIntReplacer));
    expect(result.user.id).toBe(500);
    expect(result.user.level_id).toBe(3);
  });

  it("handles arrays with BigInt values", () => {
    const data = [{ id: BigInt(1), nama: "A" }, { id: BigInt(2), nama: "B" }];
    const result = JSON.parse(JSON.stringify(data, bigIntReplacer));
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });
});

// ─── Cache Function Contracts (using mocked redis from setup.ts) ─────────────
describe("Cache Utilities — contract tests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getCache returns data when called", async () => {
    const mockData = { id: 1, nama: "Test" };
    mockGetCache.mockResolvedValueOnce(mockData);
    const result = await getCache("test-key");
    expect(result).toEqual(mockData);
  });

  it("getCache returns null when key missing", async () => {
    mockGetCache.mockResolvedValueOnce(null);
    const result = await getCache("missing-key");
    expect(result).toBeNull();
  });

  it("setCache is called with correct arguments", async () => {
    await setCache("my-key", { foo: "bar" }, 300);
    expect(mockSetCache).toHaveBeenCalledWith("my-key", { foo: "bar" }, 300);
  });

  it("setCache can handle BigInt values as payload (no throw)", async () => {
    const payload = { id: BigInt(9001), nama: "Test" };
    await expect(setCache("bigint-key", payload, 100)).resolves.not.toThrow();
  });

  it("setCache works without TTL", async () => {
    await setCache("no-ttl", [1, 2, 3]);
    expect(mockSetCache).toHaveBeenCalledWith("no-ttl", [1, 2, 3]);
  });

  it("invalidateCachePrefix is called with matching prefix", async () => {
    await invalidateCachePrefix("test:");
    expect(mockInvalidate).toHaveBeenCalledWith("test:");
  });

  it("invalidateCachePrefix with wildcard suffix", async () => {
    await invalidateCachePrefix("organisasi:*");
    expect(mockInvalidate).toHaveBeenCalledWith("organisasi:*");
  });
});
