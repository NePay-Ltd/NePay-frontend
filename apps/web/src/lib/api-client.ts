import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { AuthTokensDto } from "./types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nepay-backend.onrender.com/api/v1";

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
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

export function getTokens(): AuthTokensDto | null {
    const raw = typeof window !== "undefined" ? localStorage.getItem("nepay-auth") : null;
    return raw ? JSON.parse(raw) : null;
}

export function setTokens(tokens: AuthTokensDto) {
    if (typeof window !== "undefined") {
        localStorage.setItem("nepay-auth", JSON.stringify(tokens));
    }
}

export function clearTokens() {
    if (typeof window !== "undefined") {
        localStorage.removeItem("nepay-auth");
    }
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
            if (!tokens?.refreshToken) {
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
                const refreshResponse = await axios.post<{ success: boolean; data: AuthTokensDto }>(
                    `${BASE_URL}/auth/refresh`,
                    { refreshToken: tokens.refreshToken }
                );

                const newTokens = refreshResponse.data.data;
                setTokens(newTokens);

                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                processQueue(null, newTokens.accessToken);

                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
