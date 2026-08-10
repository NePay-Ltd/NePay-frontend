import { z } from "zod";

/**
 * Shared Zod schemas for authentication forms.
 * These are designed to be reused by both the frontend and backend teams.
 */

/** Nigerian phone: starts with 0, followed by 10 digits (e.g. 08012345678). */
export const nigerianPhoneSchema = z
    .string()
    .min(1, "Phone number is required")
    .regex(/^0(7|8|9)\d{9}$/, "Enter a valid Nigerian phone number (e.g. 08012345678)");

/** Standard email. */
export const emailSchema = z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address");

/** Password: min 6 chars, at least one number. */
export const passwordSchema = z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine((val) => /\d/.test(val), "Password must contain at least one number");

// ─── Login ────────────────────────────────────────────────────────────
export const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, "Enter your email or phone number"),
    password: z
        .string()
        .min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

// ─── Register ─────────────────────────────────────────────────────────
export const registerSchema = z
    .object({
        phone: nigerianPhoneSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string().min(1, "Confirm your password"),
        acceptTerms: z
            .boolean()
            .refine((v) => v === true, "You must accept the terms of service"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });
export type RegisterValues = z.infer<typeof registerSchema>;

// ─── Forgot Password ──────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
    identifier: z
        .string()
        .min(1, "Enter your email or phone number"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ───────────────────────────────────────────────────
export const resetPasswordSchema = z
    .object({
        password: passwordSchema,
        confirmPassword: z.string().min(1, "Confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
