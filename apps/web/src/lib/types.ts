/**
 * Shared domain types.
 */

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    /** True once this account has an APPROVED BVN verification. */
    kycVerified: boolean;
}

export interface AuthSession {
    accessToken: string;
    refreshToken: string;
    user: User;
}
