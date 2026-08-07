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

import { setToken, clearToken } from "./auth-store";
import {
    mockLogin,
    mockRegister,
    mockLogout,
    mockRefreshToken,
    type AuthUser,
    type KycTier,
} from "./mock-api";
import type { LoginValues } from "./schemas/auth";
import type { RegisterValues } from "./schemas/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthContextValue {
    /** Authenticated user. Null when logged out or loading. */
    user: AuthUser | null;
    /** Current KYC tier derived from the user object. */
    kycTier: KycTier;
    /** True while the initial session check is in-flight. */
    isLoading: boolean;
    /** True when a login/register/logout mutation is pending. */
    isMutating: boolean;

    login: (values: LoginValues) => Promise<void>;
    register: (values: Omit<RegisterValues, "confirmPassword" | "acceptTerms">) => Promise<void>;
    logout: () => Promise<void>;
    /** Called by api.ts on 401. Returns the new token or null. */
    refreshToken: () => Promise<string | null>;
    /** Manually update the user's KYC tier (called after KYC steps complete). */
    updateKycTier: (tier: KycTier) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isMutating, setIsMutating] = React.useState(false);

    // ── Initialise session on mount ────────────────────────────────────────
    // In production this would silently refresh the access token using the
    // httpOnly refresh cookie. For the mock, we skip straight to "not logged in".
    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // Attempt a silent token refresh — if the cookie exists, this
                // will succeed and we restore the session without a login page.
                const tokens = await mockRefreshToken();
                if (!cancelled) {
                    setToken(tokens.accessToken);
                    // TODO: swap with GET /auth/me to get the actual user profile
                    // For now, we remain "not logged in" after a cold load so the
                    // middleware redirects work correctly in prototype mode.
                }
            } catch {
                // No valid session — user will be redirected by middleware.
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // ── Login ──────────────────────────────────────────────────────────────
    const login = React.useCallback(
        async (values: LoginValues) => {
            setIsMutating(true);
            try {
                const { user: authUser, tokens } = await mockLogin({
                    identifier: values.identifier,
                    password: values.password,
                });
                setToken(tokens.accessToken);
                setUser(authUser);
                // Set a mock cookie so the middleware knows we are logged in
                document.cookie = "nepay_refresh=mock_session; path=/; max-age=86400";
                
                toast.success(`Welcome back, ${authUser.name.split(" ")[0]}!`);
                
                // Navigate to the returnTo URL if present, otherwise /overview
                // We use window.location.href instead of router.push to force a hard reload
                // so the edge middleware reliably picks up the newly set cookie.
                const searchParams = new URLSearchParams(window.location.search);
                const returnTo = searchParams.get("returnTo") || "/overview";
                window.location.href = returnTo;
            } finally {
                setIsMutating(false);
            }
        },
        [router],
    );

    // ── Register ───────────────────────────────────────────────────────────
    const register = React.useCallback(
        async (values: Omit<RegisterValues, "confirmPassword" | "acceptTerms">) => {
            setIsMutating(true);
            try {
                const { user: authUser, tokens } = await mockRegister({
                    phone: values.phone,
                    email: values.email,
                    password: values.password,
                });
                setToken(tokens.accessToken);
                setUser(authUser);
                document.cookie = "nepay_refresh=mock_session; path=/; max-age=86400";
                
                toast.success("Account created! Let's get you verified.");
                window.location.href = "/kyc";
            } finally {
                setIsMutating(false);
            }
        },
        [],
    );

    // ── Logout ─────────────────────────────────────────────────────────────
    const logout = React.useCallback(async () => {
        setIsMutating(true);
        try {
            await mockLogout();
        } finally {
            clearToken();
            setUser(null);
            document.cookie = "nepay_refresh=; path=/; max-age=0";
            setIsMutating(false);
            toast.info("You have been signed out.");
            router.push("/login");
        }
    }, [router]);

    // ── Refresh token (called by api.ts) ───────────────────────────────────
    const refreshToken = React.useCallback(async (): Promise<string | null> => {
        try {
            const tokens = await mockRefreshToken();
            setToken(tokens.accessToken);
            return tokens.accessToken;
        } catch {
            clearToken();
            setUser(null);
            router.push("/login");
            return null;
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
        refreshToken,
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
