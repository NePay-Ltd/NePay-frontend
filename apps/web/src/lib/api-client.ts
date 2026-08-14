import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { AuthTokensDto } from "./types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nepay-backend.onrender.com/api/v1";

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── Token Management ────────────────────────────────────────────────────────

// In a real app with more complex auth state, these would be in Zustand.
// For the interceptor, we often need synchronous access without react hooks.

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

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // Check if it's explicitly a token expiry
            // If the code is INVALID_CREDENTIALS, it's a login failure, not an expiry.
            const data = error.response.data as any;
            if (data?.code === "INVALID_CREDENTIALS") {
                return Promise.reject(error);
            }

            const tokens = getTokens();
            if (!tokens?.refreshToken) {
                // No refresh token available to retry
                clearTokens();
                // Optionally dispatch a global logout event here
                window.location.href = "/login";
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If a refresh is already in flight, queue this request
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
                // Perform the refresh
                const refreshResponse = await axios.post<{ success: boolean; data: AuthTokensDto }>(
                    `${BASE_URL}/auth/refresh`,
                    { refreshToken: tokens.refreshToken }
                );

                const newTokens = refreshResponse.data.data;
                setTokens(newTokens);
                
                // Retry the original request
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                
                // Resolve all queued requests
                processQueue(null, newTokens.accessToken);
                
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed (e.g., refresh token expired or was replayed)
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
