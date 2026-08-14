"use client";

/**
 * AuthContext — global authentication state for the NePay app.
 *
 * Exposes: user, kycTier, isLoading, login(), logout(), register(),
 * and a silent refreshToken() used by api.ts on 401.
 *
 * The access token is stored in the in-memory auth-store (auth-store.ts),
 * NOT in React state, so the api.ts fetch wrapper can read it synchronously.
 * The context only holds the *user profile* and *UI-relevant* auth state.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { apiClient, setTokens, clearTokens, getTokens } from "./api-client";
import type { LoginValues, RegisterValues } from "./schemas/auth";
import type { UserResponseDto, KycTier, LoginResponse, AuthTokensDto, ApiResponse } from "./types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthContextValue {
    /** Authenticated user. Null when logged out or loading. */
    user: UserResponseDto | null;
    /** Current KYC tier derived from the user object. */
    kycTier: KycTier;
    /** True while the initial session check is in-flight. */
    isLoading: boolean;
    /** True when a login/register/logout mutation is pending. */
    isMutating: boolean;

    login: (values: LoginValues) => Promise<void>;
    register: (values: Omit<RegisterValues, "confirmPassword" | "acceptTerms">) => Promise<void>;
    logout: () => Promise<void>;
    /** Manually update the user's KYC tier (called after KYC steps complete). */
    updateKycTier: (tier: KycTier) => void;
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

    // ── Update KYC tier ────────────────────────────────────────────────────
    const updateKycTier = React.useCallback((tier: KycTier) => {
        setUser((prev) => (prev ? { ...prev, kycTier: tier } : prev));
    }, []);

    const value: AuthContextValue = {
        user,
        kycTier: user?.kycTier ?? "FULL_BVN_NIN",
        isLoading,
        isMutating,
        login,
        register,
        logout,
        updateKycTier,
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
