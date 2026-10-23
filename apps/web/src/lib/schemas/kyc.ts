import { z } from "zod";

/** Shared Zod schemas for identity verification forms. */

/** BVN: exactly 11 digits. */
export const bvnSchema = z
    .string()
    .min(1, "BVN is required")
    .regex(/^\d{11}$/, "BVN must be exactly 11 digits");

export const verifyBvnSchema = z.object({
    bvn: bvnSchema,
});
export type VerifyBvnValues = z.infer<typeof verifyBvnSchema>;

/** NIN verification requires the date of birth registered with NIMC. */
export const verifyNinSchema = z.object({
    nin: z.string().min(1, "NIN is required").regex(/^\d{11}$/, "NIN must be exactly 11 digits"),
    dateOfBirth: z
        .string()
        .min(1, "Date of birth is required")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth as YYYY-MM-DD")
        .refine((value) => {
            const date = new Date(`${value}T00:00:00.000Z`);
            return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
        }, "Enter a valid date of birth")
        .refine((value) => value <= new Date().toISOString().slice(0, 10), "Date of birth cannot be in the future"),
});
export type VerifyNinValues = z.infer<typeof verifyNinSchema>;
