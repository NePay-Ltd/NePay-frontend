"use client";

/**
 * AuthContext — global authentication state for the NePay app.
 *
 * Exposes: user, kycVerified, isLoading, login(), logout(), register(),
 * markKycVerified(), and a silent refreshToken() used by api.ts on 401.
 *
 * The access token is stored in the in-memory auth-store (auth-store.ts),
 * NOT in React state, so the api.ts fetch wrapper can read it synchronously.
 * The context only holds the *user profile* and *UI-relevant* auth state.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiClient, setTokens, clearTokens, getTokens } from "./api-client";
import { getOrCreateDeviceId } from "./device-id";
import type { LoginValues, RegisterValues } from "./schemas/auth";
import type { UserResponseDto, LoginResponse, AuthTokensDto, ApiResponse } from "./types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthContextValue {
    /** Authenticated user. Null when logged out or loading. */
    user: UserResponseDto | null;
    /**
     * True once this account has an APPROVED BVN verification — derived from
     * user.kycVerified (the backend's single KYC flag since the tier-collapse
     * rework; there is no kycTier on any response anymore).
     */
    kycVerified: boolean;
    /** True while the initial session check is in-flight. */
    isLoading: boolean;
    /** True when a login/register/logout mutation is pending. */
    isMutating: boolean;

    login: (values: LoginValues) => Promise<void>;
    register: (values: Omit<RegisterValues, "confirmPassword" | "acceptTerms">) => Promise<void>;
    logout: () => Promise<void>;
    /** Locally flip kycVerified to true after a successful BVN submission. */
    markKycVerified: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const [user, setUser] = React.useState<UserResponseDto | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isMutating, setIsMutating] = React.useState(false);

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const tokens = getTokens();
                if (tokens?.accessToken) {
                    const res = await apiClient.get<ApiResponse<UserResponseDto>>("/users/me");
                    if (!cancelled) {
                        setUser(res.data.data);
                    }
                }
            } catch {
                if (!cancelled) {
                    clearTokens();
                    setUser(null);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const login = React.useCallback(
        async (values: LoginValues) => {
            setIsMutating(true);
            try {
                const res = await apiClient.post<ApiResponse<LoginResponse>>("/auth/login", {
                    email: values.identifier,
                    password: values.password,
                });
                
                const data = res.data.data;
                
                if ('mfaRequired' in data) {
                    // Route to MFA verification page (not built yet)
                    toast.info("Two-factor authentication required.");
                    router.push(`/verify-mfa?token=${data.mfaToken}`);
                    return;
                }

                setTokens(data);
                setUser(data.user);
                
                document.cookie = "nepay_refresh=true; path=/; max-age=86400";
                toast.success(`Welcome back, ${data.user.firstName}!`);
                
                const searchParams = new URLSearchParams(window.location.search);
                const returnTo = searchParams.get("returnTo") || "/overview";
                window.location.href = returnTo;
            } catch (err: any) {
                // Handle API error structure if available
                const msg = err.response?.data?.message || "Invalid credentials.";
                toast.error(msg);
                throw err;
            } finally {
                setIsMutating(false);
            }
        },
        [router],
    );

    const register = React.useCallback(
        async (values: Omit<RegisterValues, "confirmPassword" | "acceptTerms">) => {
            setIsMutating(true);
            try {
                const res = await apiClient.post<ApiResponse<AuthTokensDto>>("/auth/register", {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    phoneNumber: values.phone,
                    password: values.password,
                    // Best-effort fraud signal — see FraudDetectionService's
                    // own note on why this is deliberately weaker than a
                    // native app's hardware device id. undefined (omitted
                    // from the body) when storage is unavailable, never sent
                    // as a fabricated value.
                    deviceId: getOrCreateDeviceId() ?? undefined,
                    // Both optional attribution codes — see the register
                    // page's own note on where each one comes from.
                    referralCode: values.referralCode || undefined,
                    referredByMarketerCode: values.referredByMarketerCode || undefined,
                });
                
                const data = res.data.data;
                setTokens(data);
                setUser(data.user);
                
                document.cookie = "nepay_refresh=true; path=/; max-age=86400";
                toast.success("Account created! Welcome to NePay.");
                window.location.href = "/overview";
            } catch (err: any) {
                const msg = err.response?.data?.message || "Registration failed. Please try again.";
                toast.error(msg);
                throw err;
            } finally {
                setIsMutating(false);
            }
        },
        [],
    );

    const logout = React.useCallback(async () => {
        setIsMutating(true);
        try {
            await apiClient.post("/auth/logout");
        } catch {
            // Ignore errors on logout (e.g., token already invalid)
        } finally {
            clearTokens();
            setUser(null);
            document.cookie = "nepay_refresh=; path=/; max-age=0";
            setIsMutating(false);
            toast.info("You have been signed out.");
            router.push("/login");
        }
    }, [router]);

    // ── Mark KYC verified ───────────────────────────────────────────────────
    const markKycVerified = React.useCallback(() => {
        setUser((prev) => (prev ? { ...prev, kycVerified: true } : prev));
    }, []);

    const value: AuthContextValue = {
        user,
        kycVerified: user?.kycVerified ?? false,
        isLoading,
        isMutating,
        login,
        register,
        logout,
        markKycVerified,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
    const ctx = React.useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return ctx;
}
