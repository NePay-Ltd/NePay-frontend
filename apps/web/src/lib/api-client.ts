import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { attachPaymentIdempotency } from "./idempotency";
import { AuthTokensDto } from "./types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nepay-backend.onrender.com/api/v1";

/**
 * Cookie mode (NEXT_PUBLIC_COOKIE_AUTH=true): the refresh token lives in an
 * HttpOnly cookie the backend sets, so no script on the page can read it, and
 * the access token is held in memory only, never in localStorage. Off by
 * default: with it off this file behaves exactly as it always did. The backend
 * must have AUTH_REFRESH_COOKIE=true too, or it simply keeps returning the
 * refresh token in the response body (handled below).
 */
export const COOKIE_AUTH = process.env.NEXT_PUBLIC_COOKIE_AUTH === "true";

const AUTH_MODE_HEADERS: Record<string, string> = COOKIE_AUTH ? { "X-NePay-Auth-Mode": "cookie" } : {};

export const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: COOKIE_AUTH,
    headers: {
        ...AUTH_MODE_HEADERS,
        "Content-Type": "application/json",
        // Tells the backend which client this is, so staff can see whether a
        // customer signed up from the website or the mobile app
        // (User.signupPlatform). The backend only reads it at registration.
        "X-NePay-Client": "web",
    },
});

// ─── Error Extraction ─────────────────────────────────────────────────────────

/**
 * Extracts the human-readable error message from any error thrown by apiClient.
 *
 * The NePay backend always returns:
 *   { success: false, code: "CONFLICT", message: "...", traceId: "..." }
 *
 * Axios wraps this in error.response.data. Without this helper, callers
 * would see "Request failed with status 409" instead of the real message.
 *
 * Usage:
 *   onError: (err) => toast.error(getApiErrorMessage(err))
 *   catch(err) { toast.error(getApiErrorMessage(err, "Operation failed")) }
 */
export function getApiErrorMessage(
    err: unknown,
    fallback = "Something went wrong. Please try again."
): string {
    if (!err) return fallback;

    // Axios error — backend message is in error.response.data.message
    if (axios.isAxiosError(err)) {
        const backendMsg = (err.response?.data as any)?.message;
        if (typeof backendMsg === "string" && backendMsg.length > 0) {
            return backendMsg;
        }
        return err.message || fallback;
    }

    // Standard Error or ApiError (from api.ts fetch-based client)
    if (err instanceof Error && err.message) {
        return err.message;
    }

    return fallback;
}

// ─── Token Management ────────────────────────────────────────────────────────

// In cookie mode this is the only copy of the access token: gone on reload, restored from the cookie by bootstrapSession().
let memoryTokens: AuthTokensDto | null = null;

const LEGACY_KEY = "nepay-auth";

export function getTokens(): AuthTokensDto | null {
    if (COOKIE_AUTH) return memoryTokens;
    const raw = typeof window !== "undefined" ? localStorage.getItem(LEGACY_KEY) : null;
    return raw ? JSON.parse(raw) : null;
}

export function setTokens(tokens: AuthTokensDto) {
    if (COOKIE_AUTH) {
        memoryTokens = tokens;
        // Anything left from before cookie mode must not linger where a script can read it.
        if (typeof window !== "undefined") localStorage.removeItem(LEGACY_KEY);
        return;
    }
    if (typeof window !== "undefined") {
        localStorage.setItem(LEGACY_KEY, JSON.stringify(tokens));
    }
}

/** True when this browser holds a session it can use right now (replaces peeking at localStorage). */
export function hasSession(): boolean {
    if (COOKIE_AUTH) return !!memoryTokens?.accessToken;
    return typeof window !== "undefined" && !!localStorage.getItem(LEGACY_KEY);
}

export function clearTokens() {
    memoryTokens = null;
    if (typeof window !== "undefined") {
        localStorage.removeItem(LEGACY_KEY);
        // Every clearTokens() call means the client no longer considers itself
        // authenticated, so the nepay_refresh flag cookie middleware.ts reads
        // must go with it. Without this, a token going bad anywhere other than
        // an explicit logout() (e.g. a failed silent refresh, or a stale token
        // rejected on initial load) leaves the cookie set — middleware then
        // keeps bouncing the now-logged-out client from /login back to
        // /overview while the client bounces itself back to /login, forever.
        document.cookie = "nepay_refresh=; path=/; max-age=0";
    }
}

/** Max-age for the nepay_refresh routing flag: 1 day as ever, or the refresh token's 7 days in cookie mode. */
export const SESSION_FLAG_MAX_AGE_SECONDS = COOKIE_AUTH ? 7 * 86400 : 86400;

/** Only a definite answer from the server that the session is over ends it; a dropped connection or 5xx must not. */
function isSessionOver(error: unknown): boolean {
    const status = (error as AxiosError | undefined)?.response?.status;
    return status === 400 || status === 401 || status === 403;
}

/** Exchanges the refresh token (cookie, or legacy body token) for a new pair and stores it. */
async function requestRefresh(legacyRefreshToken?: string): Promise<AuthTokensDto> {
    const res = await axios.post<{ success: boolean; data: AuthTokensDto }>(
        `${BASE_URL}/auth/refresh`,
        COOKIE_AUTH && !legacyRefreshToken ? {} : { refreshToken: legacyRefreshToken },
        { withCredentials: COOKIE_AUTH, headers: AUTH_MODE_HEADERS },
    );
    const tokens = res.data.data;
    setTokens(tokens);
    return tokens;
}

let bootstrapPromise: Promise<boolean> | null = null;

/**
 * Cookie mode only: after a page load there is no access token in memory, so
 * get one from the cookie before the first request. People already signed in
 * from before cookie mode are moved over without being logged out: their old
 * localStorage refresh token is exchanged once (the server answers by setting
 * the cookie), then deleted. Returns whether a session now exists.
 */
export function bootstrapSession(): Promise<boolean> {
    if (!COOKIE_AUTH || typeof window === "undefined") return Promise.resolve(hasSession());
    if (memoryTokens?.accessToken) return Promise.resolve(true);
    if (bootstrapPromise) return bootstrapPromise;

    bootstrapPromise = (async () => {
        let legacy: string | undefined;
        try {
            legacy = (JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "null") as AuthTokensDto | null)?.refreshToken;
        } catch {
            legacy = undefined;
        }

        // No cookie flag and nothing to migrate: signed out, don't call the server at all.
        if (!legacy && !document.cookie.split("; ").some((c) => c.startsWith("nepay_refresh="))) {
            return false;
        }

        try {
            await requestRefresh(legacy);
            return true;
        } catch (error) {
            // A transient failure (bad connection, 5xx) keeps whatever we have, so it cannot sign anyone out.
            if (isSessionOver(error)) clearTokens();
            return false;
        } finally {
            bootstrapPromise = null;
        }
    })();

    return bootstrapPromise;
}

// ─── Interceptors ────────────────────────────────────────────────────────────

// Mutex lock variables
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
}

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const tokens = getTokens();
        if (tokens?.accessToken) {
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // ── Overwrite error.message with the backend's human-readable message ──
        // This means any catch(err) block that reads err.message will see
        // the actual backend message (e.g. "An account with this phone number
        // already exists") instead of the generic Axios "Request failed with
        // status 409". All toast.error(err.message) calls are fixed for free.
        const backendMsg = (error.response?.data as any)?.message;
        if (typeof backendMsg === "string" && backendMsg.length > 0) {
            error.message = backendMsg;
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {

            // A login-endpoint failure, not a session expiry — let the caller's own
            // catch handler show it inline instead of hard-redirecting to /login,
            // which would wipe out that handler's state before it can render.
            const data = error.response.data as any;
            if (data?.code === "INVALID_CREDENTIALS" || data?.code === "UNAUTHENTICATED") {
                // If the request was made to an auth endpoint (like login or verify-mfa), 
                // do not attempt to refresh or redirect, let the page handle it.
                if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/2fa/verify-login")) {
                    return Promise.reject(error);
                }
            }

            const tokens = getTokens();
            // In cookie mode there is no token to look for: the browser holds it, and the server decides.
            if (!COOKIE_AUTH && !tokens?.refreshToken) {
                clearTokens();
                window.location.href = "/login";
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(apiClient(originalRequest));
                        },
                        reject: (err) => {
                            reject(err);
                        },
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newTokens = await requestRefresh(tokens?.refreshToken);

                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                processQueue(null, newTokens.accessToken);

                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Only a definite "session is over" answer signs the user out; a network blip keeps the session.
                if (isSessionOver(refreshError)) {
                    clearTokens();
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// Double-tap protection for payments — attached last so it sees each request's final outcome. See ./idempotency.
attachPaymentIdempotency(apiClient);
