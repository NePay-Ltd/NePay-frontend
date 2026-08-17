/**
 * Mock API — realistic stand-ins for the NePay backend endpoints.
 *
 * Every function simulates network latency (600-1400 ms), has a small chance
 * of random failure, and returns typed data that matches what the real API will
 * send. Swap these out for `api.*` calls during backend integration with zero
 * component changes.
 */

import { ApiError } from "./api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(minMs = 600, maxMs = 1400): Promise<void> {
    return delay(Math.floor(Math.random() * (maxMs - minMs) + minMs));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type KycTier = "NONE" | "PHONE_VERIFIED" | "FULL_BVN_NIN";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    kycTier: KycTier;
    avatarInitials: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginPayload {
    identifier: string; // email or phone
    password: string;
}

export interface RegisterPayload {
    phone: string;
    email: string;
    password: string;
}

export interface KycStatusResponse {
    tier: KycTier;
    bvnVerified: boolean;
    ninVerified: boolean;
}

// ─── In-memory mock state ─────────────────────────────────────────────────────

const MOCK_USER: AuthUser = {
    id: "usr_01JKNG8XWZ0M3PVAQBNRZ",
    name: "Adaeze Okonkwo",
    email: "adaeze@example.com",
    phone: "08032145678",
    kycTier: "FULL_BVN_NIN",
    avatarInitials: "AO",
};

const MOCK_TOKENS: AuthTokens = {
    accessToken: "mock_access_eyJhbGciOiJIUzI1NiJ9",
    refreshToken: "mock_refresh_eyJhbGciOiJIUzI1NiJ9",
};

// Tracks mock KYC state in-memory (resets on page refresh, intentionally).
let mockKycState: KycStatusResponse = {
    tier: "FULL_BVN_NIN",
    bvnVerified: true,
    ninVerified: true,
};

// ─── Endpoint mocks ───────────────────────────────────────────────────────────

/** POST /auth/login */
export async function mockLogin(
    payload: LoginPayload,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    await randomDelay();

    // Simulate wrong-credential error
    if (payload.password === "wrong") {
        throw new ApiError({
            status: 401,
            code: "INVALID_CREDENTIALS",
            message: "Incorrect email/phone or password. Please try again.",
        });
    }

    return { user: MOCK_USER, tokens: MOCK_TOKENS };
}

/** POST /auth/register */
export async function mockRegister(
    payload: RegisterPayload,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    await randomDelay();

    // Simulate email-already-registered error
    if (payload.email === "taken@example.com") {
        throw new ApiError({
            status: 409,
            code: "EMAIL_TAKEN",
            message: "An account with this email already exists.",
            fields: { email: ["This email is already registered."] },
        });
    }

    const nameParts = payload.email.split("@")[0]?.split(".") ?? ["User"];
    const name = nameParts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");

    const initials = name
        .split(" ")
        .map((n) => n[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const newUser: AuthUser = {
        ...MOCK_USER,
        name,
        email: payload.email,
        phone: payload.phone,
        kycTier: "NONE",
        avatarInitials: initials,
    };

    return { user: newUser, tokens: MOCK_TOKENS };
}

/** POST /auth/refresh */
export async function mockRefreshToken(): Promise<AuthTokens> {
    await delay(400);
    return MOCK_TOKENS;
}

/** POST /auth/logout */
export async function mockLogout(): Promise<void> {
    await delay(300);
}

/** POST /auth/forgot-password */
export async function mockForgotPassword(
    identifier: string,
): Promise<{ message: string }> {
    await randomDelay();

    // Simulate "account not found" error for unknown identifier
    if (identifier === "notfound@example.com") {
        throw new ApiError({
            status: 404,
            code: "ACCOUNT_NOT_FOUND",
            message: "No account found with that email or phone number.",
        });
    }

    return {
        message:
            "A password reset link has been sent to your email or phone number.",
    };
}

/** POST /auth/reset-password */
export async function mockResetPassword(
    token: string,
    password: string,
): Promise<{ message: string }> {
    await randomDelay();

    if (token === "expired") {
        throw new ApiError({
            status: 400,
            code: "TOKEN_EXPIRED",
            message:
                "This reset link has expired. Please request a new one.",
        });
    }

    void password; // used in real impl
    return { message: "Password updated successfully. Please sign in." };
}

/** GET /kyc/status */
export async function mockGetKycStatus(): Promise<KycStatusResponse> {
    await delay(500);
    return { ...mockKycState };
}

/** POST /kyc/verify-bvn */
export async function mockVerifyBvn(
    bvn: string,
): Promise<{ success: boolean; message: string }> {
    await randomDelay(800, 1600);

    if (bvn === "00000000000") {
        throw new ApiError({
            status: 400,
            code: "BVN_INVALID",
            message: "BVN could not be verified. Please check and try again.",
        });
    }

    // Update mock state
    mockKycState = {
        ...mockKycState,
        bvnVerified: true,
        // Tier only upgrades to FULL_BVN_NIN when both are done
        tier: mockKycState.ninVerified ? "FULL_BVN_NIN" : mockKycState.tier,
    };

    return { success: true, message: "BVN verified successfully." };
}

/** POST /kyc/verify-nin */
export async function mockVerifyNin(
    nin: string,
): Promise<{ success: boolean; message: string }> {
    await randomDelay(800, 1600);

    if (nin === "00000000000") {
        throw new ApiError({
            status: 400,
            code: "NIN_INVALID",
            message: "NIN could not be verified. Please check and try again.",
        });
    }

    // Update mock state
    mockKycState = {
        tier: "FULL_BVN_NIN",
        bvnVerified: true,
        ninVerified: true,
    };

    return { success: true, message: "NIN verified successfully." };
}
