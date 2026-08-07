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
