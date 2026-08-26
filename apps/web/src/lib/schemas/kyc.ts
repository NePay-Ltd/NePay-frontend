import { z } from "zod";

/**
 * Shared Zod schema for the BVN verification form — the only identity check
 * this app performs (NIN verification was removed entirely).
 */

/** BVN: exactly 11 digits. */
export const bvnSchema = z
    .string()
    .min(1, "BVN is required")
    .regex(/^\d{11}$/, "BVN must be exactly 11 digits");

export const verifyBvnSchema = z.object({
    bvn: bvnSchema,
});
export type VerifyBvnValues = z.infer<typeof verifyBvnSchema>;

