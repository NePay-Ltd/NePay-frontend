/**
 * In-memory auth-token store.
 *
 * The access token is NOT persisted in localStorage (XSS risk). On the client,
 * it is hydrated once from an httpOnly-readable-on-server cookie via a server
 * component, or via the login response. The refresh token lives in an httpOnly
 * cookie that the browser sends automatically.
 *
 * This module is intentionally tiny and framework-agnostic so it can be used
 * from both React components and the plain `api.ts` fetch wrapper.
 */

let accessToken: string | null = null;

export function getToken(): string | null {
    return accessToken;
}

export function setToken(token: string): void {
    accessToken = token;
}

export function clearToken(): void {
    accessToken = null;
}