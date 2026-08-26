import { z } from "zod";

/**
 * Shared Zod schemas for KYC verification forms.
 */

/** BVN: exactly 11 digits. */
export const bvnSchema = z
    .string()
    .min(1, "BVN is required")
    .regex(/^\d{11}$/, "BVN must be exactly 11 digits");

/** NIN: exactly 11 digits. */
export const ninSchema = z
    .string()
    .min(1, "NIN is required")
    .regex(/^\d{11}$/, "NIN must be exactly 11 digits");

export const verifyBvnSchema = z.object({
    bvn: bvnSchema,
});
export type VerifyBvnValues = z.infer<typeof verifyBvnSchema>;

export const verifyNinSchema = z.object({
    nin: ninSchema,
});
export type VerifyNinValues = z.infer<typeof verifyNinSchema>;

/**
 * OTP sent by Safe Haven to confirm a BVN/NIN submission. Loosely validated
 * (length only, matching the backend's own ConfirmKycDto) — Safe Haven's
 * exact OTP format isn't confirmed.
 */
export const otpSchema = z
    .string()
    .min(1, "Enter the code sent to your phone")
    .max(10, "Code is too long");

export const confirmOtpSchema = z.object({
    otp: otpSchema,
});
export type ConfirmOtpValues = z.infer<typeof confirmOtpSchema>;
