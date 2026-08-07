/**
 * Shared domain types.
 */

export type KycTier = "NONE" | "PHONE_VERIFIED" | "FULL_BVN_NIN";

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    kycTier: KycTier;
}

export interface AuthSession {
    accessToken: string;
    refreshToken: string;
    user: User;
}
