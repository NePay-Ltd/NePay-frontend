/**
 * Typed API client.
 *
 * Responsibilities:
 *  - Attach the auth token (from the in-memory store, populated from a cookie)
 *    to every request as `Authorization: Bearer <token>`.
 *  - On HTTP 401, attempt a single silent token refresh, then replay the
 *    original request once. If the refresh fails, throw a typed `ApiError`.
 *  - Always throw `ApiError` on non-2xx responses — never return an error shape
 *    as data — so callers can `try/catch` consistently.
 */

import { getToken, setToken, clearToken } from "./auth-store";

export interface ApiErrorShape {
    /** HTTP status code (0 for network failures). */
    status: number;
    /** Stable, machine-readable error code from the backend. */
    code: string;
    /** Human-readable message safe to surface in the UI. */
    message: string;
    /** Optional field-level validation errors. */
    fields?: Record<string, string[]>;
}

export class ApiError extends Error implements ApiErrorShape {
    public readonly status: number;
    public readonly code: string;
    public readonly fields?: Record<string, string[]>;

    constructor(shape: ApiErrorShape) {
        super(shape.message);
        this.name = "ApiError";
        this.status = shape.status;
        this.code = shape.code;
        this.fields = shape.fields;
    }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions<TBody> {
    method?: HttpMethod;
    body?: TBody;
    query?: Record<string, string | number | boolean | undefined | null>;
    /** Override headers. */
    headers?: Record<string, string>;
    /** Bypass the 401 refresh retry (used by the refresh endpoint itself). */
    skipAuthRefresh?: boolean;
    /** Request signal (AbortController). */
    signal?: AbortSignal;
}

const DEFAULT_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token exactly once. Concurrent callers share
 * the same in-flight promise. Returns the new token, or `null` on failure.
 */
async function refreshAccessToken(): Promise<string | null> {
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const res = await fetch(`${DEFAULT_BASE_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include", // send the refresh-token cookie
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                clearToken();
                return null;
            }

            const data = (await res.json()) as { accessToken: string };
            setToken(data.accessToken);
            return data.accessToken;
        } catch {
            clearToken();
            return null;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

function buildUrl(
    path: string,
    query?: ApiRequestOptions<unknown>["query"],
): string {
    const url = path.startsWith("http")
        ? path
        : `${DEFAULT_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

    if (!query) return url;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
            params.append(key, String(value));
        }
    }
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
}

async function parseResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return (await res.json()) as T;
    }

    // Non-JSON (e.g. 204 No Content) — cast to expected shape best-effort.
    return undefined as unknown as T;
}

async function request<TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
    const {
        method = "GET",
        body,
        query,
        headers = {},
        skipAuthRefresh = false,
        signal,
    } = options;

    const token = getToken();

    const finalHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
    };

    if (token) {
        finalHeaders.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(buildUrl(path, query), {
        method,
        headers: finalHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: "include",
        signal,
    });

    // —— 401: attempt a single silent refresh + replay ————————————————
    if (res.status === 401 && !skipAuthRefresh) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            finalHeaders.Authorization = `Bearer ${newToken}`;
            const retryRes = await fetch(buildUrl(path, query), {
                method,
                headers: finalHeaders,
                body: body !== undefined ? JSON.stringify(body) : undefined,
                credentials: "include",
                signal,
            });
            return handleResponse<TResponse>(retryRes);
        }

        clearToken();
        throw new ApiError({
            status: 401,
            code: "SESSION_EXPIRED",
            message: "Your session has expired. Please sign in again.",
        });
    }

    return handleResponse<TResponse>(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let code = `HTTP_${res.status}`;
        let message = res.statusText || "Something went wrong.";
        let fields: Record<string, string[]> | undefined;

        try {
            const errorBody = (await res.json()) as Partial<ApiErrorShape>;
            if (errorBody.code) code = errorBody.code;
            if (errorBody.message) message = errorBody.message;
            if (errorBody.fields) fields = errorBody.fields;
        } catch {
            /* response had no JSON body — keep defaults */
        }

        throw new ApiError({ status: res.status, code, message, fields });
    }

    return parseResponse<T>(res);
}

/** The typed API client. Usage: `api.get<User>("/users/me")`. */
export const api = {
    get: <T>(path: string, options?: Omit<ApiRequestOptions<never>, "body" | "method">) =>
        request<T>(path, { ...options, method: "GET" }),
    post: <T, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, "body" | "method">) =>
        request<T, TBody>(path, { ...options, method: "POST", body }),
    put: <T, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, "body" | "method">) =>
        request<T, TBody>(path, { ...options, method: "PUT", body }),
    patch: <T, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, "body" | "method">) =>
        request<T, TBody>(path, { ...options, method: "PATCH", body }),
    delete: <T>(path: string, options?: Omit<ApiRequestOptions<never>, "body" | "method">) =>
        request<T>(path, { ...options, method: "DELETE" }),
    /** Raw escape hatch — rarely needed. */
    raw: request,
};