// src/__tests__/unit/utils/safe-return-to.test.ts
// ─── safeReturnTo Unit Tests ──────────────────────────────────────────────────
// Tests the open-redirect protection function extracted from auth-context.tsx.
// We replicate the function here to test it in isolation since it's not exported.

import { describe, it, expect } from "vitest";

/**
 * Replicated from auth-context.tsx — safeReturnTo().
 * Only a same-origin relative path is accepted.
 */
function safeReturnTo(value: string | null): string {
  const fallback = "/overview";
  if (!value || !/^\/(?!\/|\\)/.test(value)) {
    return fallback;
  }
  return value;
}

describe("safeReturnTo — Open Redirect Protection", () => {
  // ── Positive: valid relative paths accepted ────────────────────────────────

  it("P1 | '/overview' → accepted", () => {
    expect(safeReturnTo("/overview")).toBe("/overview");
  });

  it("P2 | '/transfer' → accepted", () => {
    expect(safeReturnTo("/transfer")).toBe("/transfer");
  });

  it("P3 | '/wallet' → accepted", () => {
    expect(safeReturnTo("/wallet")).toBe("/wallet");
  });

  it("P4 | '/pods' → accepted", () => {
    expect(safeReturnTo("/pods")).toBe("/pods");
  });

  it("P5 | Long nested path '/settings/security/change-password' → accepted", () => {
    expect(safeReturnTo("/settings/security/change-password")).toBe(
      "/settings/security/change-password"
    );
  });

  // ── Negative: dangerous or external values rejected ────────────────────────

  it("N1 | null → fallback '/overview'", () => {
    expect(safeReturnTo(null)).toBe("/overview");
  });

  it("N2 | empty string → fallback '/overview'", () => {
    expect(safeReturnTo("")).toBe("/overview");
  });

  it("N3 | 'https://evil.com' → rejected (absolute URL)", () => {
    expect(safeReturnTo("https://evil.com")).toBe("/overview");
  });

  it("N4 | 'http://evil.com' → rejected", () => {
    expect(safeReturnTo("http://evil.com")).toBe("/overview");
  });

  it("N5 | '//evil.com' → rejected (protocol-relative)", () => {
    expect(safeReturnTo("//evil.com")).toBe("/overview");
  });

  it("N6 | '\\/evil.com' → rejected (backslash bypass)", () => {
    expect(safeReturnTo("\\/evil.com")).toBe("/overview");
  });

  it("N7 | '\\evil.com' → rejected (backslash only)", () => {
    expect(safeReturnTo("\\evil.com")).toBe("/overview");
  });

  it("N8 | 'evil.com' → rejected (no leading slash)", () => {
    expect(safeReturnTo("evil.com")).toBe("/overview");
  });

  it("N9 | 'javascript:alert(1)' → rejected", () => {
    expect(safeReturnTo("javascript:alert(1)")).toBe("/overview");
  });

  it("N10 | '/\\evil.com' → rejected (forward slash + backslash bypass)", () => {
    // Some parsers treat /\ as // — this must be rejected
    expect(safeReturnTo("/\\evil.com")).toBe("/overview");
  });
});
