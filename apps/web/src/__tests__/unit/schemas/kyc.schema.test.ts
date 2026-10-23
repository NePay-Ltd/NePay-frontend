// src/__tests__/unit/schemas/kyc.schema.test.ts
// ─── KYC Schema Unit Tests ────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { bvnSchema, verifyNinSchema } from "../../../lib/schemas/kyc";

describe("BVN Schema", () => {
  // Positive
  it("P1 | Valid 11-digit BVN passes", () => {
    expect(bvnSchema.safeParse("12345678901").success).toBe(true);
  });

  describe("NIN verification schema", () => {
    it("accepts an 11-digit NIN and a valid date of birth", () => {
      expect(
        verifyNinSchema.safeParse({ nin: "12345678901", dateOfBirth: "1995-03-08" }).success,
      ).toBe(true);
    });

    it("requires a date of birth in YYYY-MM-DD format", () => {
      expect(verifyNinSchema.safeParse({ nin: "12345678901", dateOfBirth: "" }).success).toBe(false);
      expect(verifyNinSchema.safeParse({ nin: "12345678901", dateOfBirth: "08-03-1995" }).success).toBe(false);
    });

    it("rejects impossible and future dates of birth", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(verifyNinSchema.safeParse({ nin: "12345678901", dateOfBirth: "1995-02-30" }).success).toBe(false);
      expect(
        verifyNinSchema.safeParse({
          nin: "12345678901",
          dateOfBirth: futureDate.toISOString().slice(0, 10),
        }).success,
      ).toBe(false);
    });
  });

  it("P2 | Another valid BVN passes", () => {
    expect(bvnSchema.safeParse("22223333444").success).toBe(true);
  });

  // Negative
  it("N1 | 10-digit BVN → 'BVN must be exactly 11 digits'", () => {
    const result = bvnSchema.safeParse("1234567890");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("11 digits");
  });

  it("N2 | 12-digit BVN → 'BVN must be exactly 11 digits'", () => {
    const result = bvnSchema.safeParse("123456789012");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("11 digits");
  });

  it("N3 | BVN with letters → 'BVN must be exactly 11 digits'", () => {
    const result = bvnSchema.safeParse("1234567890A");
    expect(result.success).toBe(false);
  });

  it("N4 | BVN with spaces → validation error", () => {
    const result = bvnSchema.safeParse("12345 67890");
    expect(result.success).toBe(false);
  });

  it("N5 | Empty string → 'BVN is required'", () => {
    const result = bvnSchema.safeParse("");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("BVN is required");
  });

  it("N6 | Null → validation error", () => {
    const result = bvnSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});
