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
    /** Completes a login that was paused by a 2FA challenge — see login()'s `mfaRequired` branch. */
    verifyMfa: (mfaToken: string, code: string) => Promise<void>;
    register: (values: Omit<RegisterValues, "confirmPassword" | "acceptTerms">, autoLogin?: boolean) => Promise<AuthTokensDto | void>;
    logout: () => Promise<void>;
    /** Exposed to finalize session after external verifications (e.g. email OTP) */
    finalizeLogin: (data: AuthTokensDto) => void;
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

    /** Shared by login() and verifyMfa() — both end with a real token pair. */
    const completeLogin = React.useCallback((data: AuthTokensDto) => {
        setTokens(data);
        setUser(data.user);

        document.cookie = "nepay_refresh=true; path=/; max-age=86400";
        toast.success(`Welcome back, ${data.user.firstName}!`);

        const searchParams = new URLSearchParams(window.location.search);
        const returnTo = searchParams.get("returnTo") || "/overview";
        window.location.href = returnTo;
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
                    toast.info("Two-factor authentication required.");
                    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
                    const params = new URLSearchParams({ token: data.mfaToken });
                    if (returnTo) params.set("returnTo", returnTo);
                    router.push(`/verify-mfa?${params.toString()}`);
                    return;
                }

                if ('user' in data && data.user.emailVerified === false) {
                    toast.info("Please verify your email address to continue.");
                    try {
                        // Automatically resend a fresh code when they hit this block
                        await apiClient.post("/auth/resend-verification-email", { email: data.user.email });
                    } catch (e) {
                        // Ignore resend errors (could be rate limited, that's fine)
                    }
                    sessionStorage.setItem("pending_verification_tokens", JSON.stringify(data));
                    router.push(`/verify-email?email=${encodeURIComponent(data.user.email)}`);
                    return;
                }

                completeLogin(data as AuthTokensDto);
            } catch (err: any) {
                // ACCOUNT_SUSPENDED and INVALID_CREDENTIALS are shown inline by the
                // login page itself (a persistent banner / field error respectively)
                // — a toast here would be redundant, and for a suspended account is
                // actively harmful: toasts auto-dismiss, so a message the user needs
                // to actually act on (contact support) must not be a toast.
                const code = err.response?.data?.code;
                if (code !== "ACCOUNT_SUSPENDED" && code !== "INVALID_CREDENTIALS") {
                    const msg = err.response?.data?.message || "Invalid credentials.";
                    toast.error(msg);
                }
                throw err;
            } finally {
                setIsMutating(false);
            }
        },
        [router, completeLogin],
    );

    const verifyMfa = React.useCallback(
        async (mfaToken: string, code: string) => {
            setIsMutating(true);
            try {
                const res = await apiClient.post<ApiResponse<AuthTokensDto>>("/auth/2fa/verify-login", {
                    mfaToken,
                    code,
                });

                completeLogin(res.data.data);
            } catch (err: any) {
                // No toast here — the verify-mfa page shows a wrong-code error
                // inline next to the input, the same way login() and the login
                // page split password errors between setError and toast.
                throw err;
            } finally {
                setIsMutating(false);
            }
        },
        [completeLogin],
    );

    const register = React.useCallback(
        async (values: Omit<RegisterValues, "confirmPassword" | "acceptTerms">) => {
            setIsMutating(true);
            try {
                const res = await apiClient.post<ApiResponse<UserResponseDto>>("/auth/register", {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    username: values.username,
                    phoneNumber: values.phone,
                    password: values.password,
                    // Best-effort fraud signal
                    deviceId: getOrCreateDeviceId() ?? undefined,
                    referralCode: values.referralCode || undefined,
                    referredByMarketerCode: values.referredByMarketerCode || undefined,
                });
                
                const user = res.data.data;
                return user;
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
        verifyMfa,
        register,
        logout,
        finalizeLogin: completeLogin,
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
