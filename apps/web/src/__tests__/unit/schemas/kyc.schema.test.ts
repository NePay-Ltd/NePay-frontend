// src/__tests__/unit/schemas/kyc.schema.test.ts
// ─── KYC Schema Unit Tests ────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { z } from "zod";

// KYC schema (replicated from kyc.ts — adapt once the real file is confirmed)
const bvnSchema = z
  .string()
  .min(1, "BVN is required")
  .regex(/^\d{11}$/, "BVN must be exactly 11 digits");

describe("BVN Schema", () => {
  // Positive
  it("P1 | Valid 11-digit BVN passes", () => {
    expect(bvnSchema.safeParse("12345678901").success).toBe(true);
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
