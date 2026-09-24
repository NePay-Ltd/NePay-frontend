// src/__tests__/unit/utils/format.test.ts
// ─── Format Utility Unit Tests ────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { formatNairaString, formatByCurrency } from "../../../lib/format";

// NOTE: formatNaira and formatNairaCompact return React nodes — we test
// the string variant (formatNairaString) for purity without a DOM, and
// formatByCurrency for the non-NGN path.

describe("formatNairaString", () => {
  // Positive
  it("P1 | 12500 → '₦12,500.00'", () => {
    expect(formatNairaString(12500)).toBe("₦12,500.00");
  });

  it("P2 | 0 → '₦0.00' (not blank, not NaN)", () => {
    expect(formatNairaString(0)).toBe("₦0.00");
  });

  it("P3 | String '12500' → '₦12,500.00'", () => {
    expect(formatNairaString("12500")).toBe("₦12,500.00");
  });

  it("P4 | Large amount 1,000,000 → '₦1,000,000.00'", () => {
    expect(formatNairaString(1_000_000)).toBe("₦1,000,000.00");
  });

  it("P5 | 2 decimal places preserved exactly", () => {
    expect(formatNairaString(12.5)).toBe("₦12.50");
  });

  it("P6 | Negative amount → '-₦12,500.50'", () => {
    expect(formatNairaString(-12500.5)).toBe("-₦12,500.50");
  });

  // Negative
  it("N1 | NaN string → '₦0.00' (safe fallback)", () => {
    expect(formatNairaString("not-a-number")).toBe("₦0.00");
  });

  it("N2 | undefined cast to string → '₦0.00'", () => {
    expect(formatNairaString("undefined")).toBe("₦0.00");
  });

  it("N3 | Empty string → '₦0.00'", () => {
    expect(formatNairaString("")).toBe("₦0.00");
  });
});

describe("formatByCurrency", () => {
  // Positive
  it("P1 | NGN routes through formatNairaString logic", () => {
    // Result is a React node, but for NGN it should include ₦
    const result = formatByCurrency(500, "NGN");
    // The result is a React element — we just check it's truthy
    expect(result).toBeTruthy();
  });

  it("P2 | USD returns Intl formatted string", () => {
    const result = formatByCurrency(8.32, "USD");
    expect(typeof result === "string" && result.includes("8.32")).toBe(true);
  });

  // Negative
  it("N1 | Unknown currency code → fallback string without throwing", () => {
    expect(() => formatByCurrency(100, "INVALID_CURRENCY")).not.toThrow();
  });

  it("N2 | NaN with USD → fallback '0.00 USD' or graceful string", () => {
    const result = formatByCurrency("not-a-number", "USD");
    expect(result).toBeTruthy();
  });
});
