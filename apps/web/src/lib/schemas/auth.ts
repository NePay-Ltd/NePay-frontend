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

/** Matches the backend's own @Length(4, 20) on RegisterDto.referralCode/referredByMarketerCode — only enforced when a value is actually present, since both are optional. */
const attributionCodeSchema = z
    .string()
    .trim()
    .refine((v) => v.length === 0 || (v.length >= 4 && v.length <= 20), "Code must be 4-20 characters")
    .optional();

export const registerStepOneSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(80, "First name is too long"),
    lastName: z.string().min(1, "Last name is required").max(80, "Last name is too long"),
    phone: nigerianPhoneSchema,
    otpVerified: z.boolean().refine((v) => v === true, "You must verify your phone number"),
});
export type RegisterStepOneValues = z.infer<typeof registerStepOneSchema>;

export const registerStepTwoSchema = z
    .object({
        username: z
            .string()
            .trim()
            .min(3, "Username must be 3-20 characters: letters, numbers and underscores only")
            .max(20, "Username must be 3-20 characters: letters, numbers and underscores only")
            .regex(/^[a-zA-Z0-9_]+$/, "Username must be 3-20 characters: letters, numbers and underscores only"),
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string().min(1, "Confirm your password"),
        acceptTerms: z
            .boolean()
            .refine((v) => v === true, "You must accept the terms of service"),
        /** Another customer's shareable code, typed in by hand or prefilled from a `?ref=` link. */
        referralCode: attributionCodeSchema,
        /** A marketer's own attribution code — only ever arrives via a `?mkt=` partner link, never typed by hand; see the register page's own note. */
        referredByMarketerCode: attributionCodeSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });
export type RegisterStepTwoValues = z.infer<typeof registerStepTwoSchema>;

export const registerSchema = registerStepOneSchema.and(registerStepTwoSchema);
export type RegisterValues = z.infer<typeof registerSchema>;

// ─── Forgot Password ──────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, "Enter your email address")
        .email("Enter a valid email address"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ───────────────────────────────────────────────────
export const resetPasswordSchema = z
    .object({
        email: z
            .string()
            .min(1, "Enter your email address")
            .email("Enter a valid email address"),
        code: z
            .string()
            .min(1, "Enter the 6-digit code")
            .regex(/^\d{6}$/, "Code must be 6 digits"),
        password: passwordSchema,
        confirmPassword: z.string().min(1, "Confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// ─── MFA Login Verification ───────────────────────────────────────────
export const verifyMfaSchema = z.object({
    code: z
        .string()
        .min(1, "Enter the 6-digit code")
        .regex(/^\d{6}$/, "Code must be 6 digits"),
});
export type VerifyMfaValues = z.infer<typeof verifyMfaSchema>;
