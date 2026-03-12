/**
 * Unit Tests — lib/validations/organisasi.schema.ts
 * Tests: createOrganisasiSchema, updateOrganisasiSchema validation rules
 */
import { describe, it, expect } from "vitest";
import {
  createOrganisasiSchema,
  updateOrganisasiSchema,
} from "@/lib/validations/organisasi.schema";

const validPayload = {
  nama_org: "Karang Taruna Mojosongo",
  kode_wilayah_induk_kelurahan: "030110010201",
  kode_wilayah_induk_kecamatan: "03011001",
  kode_wilayah_induk_kota: "030110",
  kode_wilayah_induk_provinsi: "030000",
};

describe("Validation — createOrganisasiSchema", () => {
  it("accepts a valid payload", () => {
    const result = createOrganisasiSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects payload missing nama_org", () => {
    const result = createOrganisasiSchema.safeParse({
      ...validPayload,
      nama_org: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("nama_org");
  });

  it("rejects nama_org shorter than 3 chars", () => {
    const result = createOrganisasiSchema.safeParse({
      ...validPayload,
      nama_org: "KT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing provinsi code", () => {
    const result = createOrganisasiSchema.safeParse({
      ...validPayload,
      kode_wilayah_induk_provinsi: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing kota code", () => {
    const result = createOrganisasiSchema.safeParse({
      ...validPayload,
      kode_wilayah_induk_kota: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing kecamatan code", () => {
    const result = createOrganisasiSchema.safeParse({
      ...validPayload,
      kode_wilayah_induk_kecamatan: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing kelurahan code", () => {
    const result = createOrganisasiSchema.safeParse({
      ...validPayload,
      kode_wilayah_induk_kelurahan: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid email when provided", () => {
    const result = createOrganisasiSchema.safeParse({
      ...validPayload,
      email: "test@test.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = createOrganisasiSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("allows optional fields to be omitted", () => {
    const result = createOrganisasiSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
    }
  });
});

describe("Validation — updateOrganisasiSchema", () => {
  it("accepts a partial update payload", () => {
    const result = updateOrganisasiSchema.safeParse({ nama_org: "Updated Name" });
    expect(result.success).toBe(true);
  });

  it("rejects nama_org shorter than 3 chars on update", () => {
    const result = updateOrganisasiSchema.safeParse({ nama_org: "AB" });
    expect(result.success).toBe(false);
  });

  it("accepts all field updates", () => {
    const result = updateOrganisasiSchema.safeParse({
      ...validPayload,
      alamat: "Jl. Test 123",
    });
    expect(result.success).toBe(true);
  });
});
