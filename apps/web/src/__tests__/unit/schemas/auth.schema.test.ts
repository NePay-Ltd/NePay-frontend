// src/__tests__/unit/schemas/auth.schema.test.ts
// ─── Auth Schema Unit Tests ───────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerStepOneSchema,
  registerStepTwoSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../../lib/schemas/auth";

// ─── Login Schema ─────────────────────────────────────────────────────────────
describe("loginSchema", () => {
  // Positive
  it("P1 | Valid email + password passes", () => {
    const result = loginSchema.safeParse({ identifier: "test@example.com", password: "ValidPass1" });
    expect(result.success).toBe(true);
  });

  it("P2 | Valid phone number as identifier passes", () => {
    const result = loginSchema.safeParse({ identifier: "08012345678", password: "ValidPass1" });
    expect(result.success).toBe(true);
  });

  // Negative
  it("N1 | Empty identifier → 'Enter your email or phone number'", () => {
    const result = loginSchema.safeParse({ identifier: "", password: "ValidPass1" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter your email or phone number");
  });

  it("N2 | Empty password → 'Enter your password'", () => {
    const result = loginSchema.safeParse({ identifier: "test@example.com", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter your password");
  });

  it("N3 | Both fields empty → multiple errors", () => {
    const result = loginSchema.safeParse({ identifier: "", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Register Step One Schema ─────────────────────────────────────────────────
describe("registerStepOneSchema", () => {
  // Positive
  it("P1 | Valid first name, last name, phone passes", () => {
    const result = registerStepOneSchema.safeParse({
      firstName: "Dubem",
      lastName: "Test",
      phone: "08012345678",
    });
    expect(result.success).toBe(true);
  });

  // Negative
  it("N1 | Empty first name → 'First name is required'", () => {
    const result = registerStepOneSchema.safeParse({ firstName: "", lastName: "Test", phone: "08012345678" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toContain("First name is required");
  });

  it("N2 | First name > 80 chars → 'First name is too long'", () => {
    const result = registerStepOneSchema.safeParse({
      firstName: "A".repeat(81),
      lastName: "Test",
      phone: "08012345678",
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toContain("First name is too long");
  });

  it("N3 | Invalid Nigerian phone (too short) → validation error", () => {
    const result = registerStepOneSchema.safeParse({ firstName: "A", lastName: "B", phone: "12345" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages?.some((m) => m.toLowerCase().includes("phone"))).toBe(true);
  });

  it("N4 | Phone not starting with 0 → validation error", () => {
    const result = registerStepOneSchema.safeParse({ firstName: "A", lastName: "B", phone: "9012345678" });
    expect(result.success).toBe(false);
  });

  it("N5 | Phone starting with 01 (invalid prefix) → validation error", () => {
    const result = registerStepOneSchema.safeParse({ firstName: "A", lastName: "B", phone: "01012345678" });
    expect(result.success).toBe(false);
  });
});

// ─── Register Step Two Schema ─────────────────────────────────────────────────
describe("registerStepTwoSchema", () => {
  const validBase = {
    username: "testuser",
    email: "test@example.com",
    password: "ValidPass1",
    confirmPassword: "ValidPass1",
  };

  // Positive
  it("P1 | All valid fields pass", () => {
    const result = registerStepTwoSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("P2 | hearAboutUs = INSTAGRAM passes", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, hearAboutUs: "INSTAGRAM" });
    expect(result.success).toBe(true);
  });

  it("P3 | hearAboutUs = OTHER with hearAboutUsOther filled passes", () => {
    const result = registerStepTwoSchema.safeParse({
      ...validBase,
      hearAboutUs: "OTHER",
      hearAboutUsOther: "A friend told me",
    });
    expect(result.success).toBe(true);
  });

  it("P4 | hearAboutUs omitted entirely passes", () => {
    const result = registerStepTwoSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  // Negative
  it("N1 | Password < 6 chars → 'Password must be at least 6 characters'", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, password: "ab1", confirmPassword: "ab1" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages?.some((m) => m.includes("6 characters"))).toBe(true);
  });

  it("N2 | Password has no number → 'Password must contain at least one number'", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, password: "abcdefg", confirmPassword: "abcdefg" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages?.some((m) => m.includes("one number"))).toBe(true);
  });

  it("N3 | Passwords don't match → 'Passwords do not match'", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, confirmPassword: "DifferentPass1" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toContain("Passwords do not match");
  });

  it("N4 | Username < 3 chars → validation error", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, username: "ab" });
    expect(result.success).toBe(false);
  });

  it("N5 | Username > 20 chars → validation error", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, username: "a".repeat(21) });
    expect(result.success).toBe(false);
  });

  it("N6 | Username with spaces → validation error", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, username: "bad username" });
    expect(result.success).toBe(false);
  });

  it("N7 | Username with special chars → validation error", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, username: "bad@user!" });
    expect(result.success).toBe(false);
  });

  it("N8 | Invalid email format → validation error", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, email: "not-an-email" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages?.some((m) => m.includes("valid email"))).toBe(true);
  });

  it("N9 | hearAboutUs = OTHER + empty hearAboutUsOther → 'Please specify how you heard about us'", () => {
    const result = registerStepTwoSchema.safeParse({
      ...validBase,
      hearAboutUs: "OTHER",
      hearAboutUsOther: "",
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages?.some((m) => m.includes("Please specify"))).toBe(true);
  });

  it("N10 | hearAboutUsOther > 120 chars → 'Must be under 120 characters'", () => {
    const result = registerStepTwoSchema.safeParse({
      ...validBase,
      hearAboutUs: "OTHER",
      hearAboutUsOther: "A".repeat(121),
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages?.some((m) => m.includes("120 characters"))).toBe(true);
  });

  it("N11 | Invalid referral code (2 chars) → validation error", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, referralCode: "AB" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages?.some((m) => m.includes("4-20 characters"))).toBe(true);
  });

  it("P5 | Empty referral code (not filled in) → passes", () => {
    const result = registerStepTwoSchema.safeParse({ ...validBase, referralCode: "" });
    expect(result.success).toBe(true);
  });
});

// ─── Forgot Password Schema ───────────────────────────────────────────────────
describe("forgotPasswordSchema", () => {
  it("P1 | Valid email passes", () => {
    const result = forgotPasswordSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("N1 | Empty email → 'Enter your email address'", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter your email address");
  });

  it("N2 | Malformed email → 'Enter a valid email address'", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter a valid email address");
  });
});

// ─── Reset Password Schema ────────────────────────────────────────────────────
describe("resetPasswordSchema", () => {
  const validReset = {
    email: "test@example.com",
    code: "123456",
    password: "NewPass1",
    confirmPassword: "NewPass1",
  };

  it("P1 | Valid reset data passes", () => {
    const result = resetPasswordSchema.safeParse(validReset);
    expect(result.success).toBe(true);
  });

  it("N1 | Code not 6 digits → 'Code must be 6 digits'", () => {
    const result = resetPasswordSchema.safeParse({ ...validReset, code: "12345" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages?.some((m) => m.includes("6 digits"))).toBe(true);
  });

  it("N2 | Code with letters → 'Code must be 6 digits'", () => {
    const result = resetPasswordSchema.safeParse({ ...validReset, code: "1234ab" });
    expect(result.success).toBe(false);
  });

  it("N3 | Passwords don't match → 'Passwords do not match'", () => {
    const result = resetPasswordSchema.safeParse({ ...validReset, confirmPassword: "DifferentPass1" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toContain("Passwords do not match");
  });
});
