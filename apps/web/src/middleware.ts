import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection middleware.
 *
 * Public routes (no auth required):
 *   /login, /register, /forgot-password, /reset-password
 *
 * All other routes require the user to be authenticated, indicated by the
 * presence of a `nepay_refresh` cookie. This is NOT an httpOnly,
 * backend-issued session cookie — the backend never sets any cookie at
 * all (every auth response is JSON-body-only); this is a plain flag
 * cookie (`document.cookie = "nepay_refresh=true"`, see auth-context.tsx)
 * set by client-side JS purely so this middleware has something to read
 * before the page renders. It is NOT the security boundary: no
 * server-side code in this app reads cookies at all (no Server Component
 * or route handler calls `cookies()`), so this only ever controls a
 * redirect-to-/login UX decision. Real authorization happens entirely via
 * the Bearer token validated by the backend's JWT guard on actual API
 * calls — forging this cookie without ever logging in gets you a page
 * shell, not any real data.
 *
 * In prototype/design mode this is intentionally loose — any visit to the
 * app routes will redirect to /login so you can explore the auth flows.
 */

const PUBLIC_PATHS = new Set([
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-mfa",
    "/verify-email",
    "/icons-preview",
]);

/** Paths that can be viewed by anyone, logged in or not, without redirecting. */
const PUBLIC_CONTENT_PATHS = new Set([
    "/terms",
    "/privacy",
    "/eula",
    "/faq",
    "/about",
    "/legal/terms",
    "/legal/privacy",
    "/legal/compliance",
    // Google Play's required external account-deletion resource — must be
    // reachable without a session, since the whole point is letting someone
    // request account deletion without opening or reinstalling the app.
    "/delete-account",
]);

/** Paths that start with these prefixes are always public (static, marketing). */
const PUBLIC_PREFIXES = ["/_next", "/favicon", "/api/auth/callback", "/sitemap.xml", "/robots.txt"];

/**
 * Marketer routes run their own auth system (a bearer token in localStorage,
 * checked client-side — see marketer-api.ts), entirely separate from the
 * `nepay_refresh` cookie used by the main app. They must be excluded here or
 * this middleware bounces marketer visitors to the main /login page.
 */
const MARKETER_PREFIX = "/marketer";

/**
 * The backend's own origin, both http(s) and ws(s) forms — needed in
 * connect-src below for plain API calls and the socket.io connections
 * (support chat, live notices; see use-support-conversation.ts and
 * NoticeSocketListener.tsx, both of which derive their socket origin from
 * this exact same env var with the exact same fallback).
 */
function backendOrigins(): { http: string; ws: string } {
    const configured = process.env.NEXT_PUBLIC_API_URL;
    let http = "https://nepay-backend.onrender.com";
    try {
        if (configured) http = new URL(configured).origin;
    } catch {
        // keep the fallback
    }
    return { http, ws: http.replace(/^http/, "ws") };
}

/**
 * A real Content-Security-Policy, nonce-based per Next.js's own documented
 * App Router pattern (https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy) —
 * replaces the previous header in next.config.js, which only forced
 * http->https upgrades and placed no restriction on script execution at
 * all. This app has a deliberately minimal external footprint that makes a
 * real policy achievable: next/font self-hosts its one Google font (no
 * external font host to allow), there are no analytics/tracking scripts or
 * third-party embeds anywhere in the codebase, and the only external image
 * host is Cloudinary (avatarUrl, plain <img> tags — not next/image, so no
 * remotePatterns concern either).
 *
 * 'strict-dynamic' alongside the nonce is required, not optional: without
 * it, Next.js's own dynamically-injected code-split chunk scripts (which
 * carry no nonce of their own) would be blocked by a plain nonce-only
 * policy, breaking the app rather than securing it. style-src keeps
 * 'unsafe-inline' rather than reusing the script nonce — next-themes
 * injects a small pre-hydration inline script to avoid a flash of the
 * wrong theme, and style-based injection is a materially smaller risk than
 * script-based, so this is a deliberate, pragmatic line, not an oversight.
 */
function contentSecurityPolicy(nonce: string): string {
    const { http, ws } = backendOrigins();
    return `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https://res.cloudinary.com;
        font-src 'self';
        connect-src 'self' ${http} ${ws};
        frame-ancestors 'self';
        base-uri 'self';
        object-src 'none';
        form-action 'self';
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, " ").trim();
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const csp = contentSecurityPolicy(nonce);

    // Per Next.js's own documented CSP pattern: the nonce is threaded through
    // as a request header too (not just the response header) so Next's own
    // App Router rendering pipeline can read it and apply it to the inline
    // bootstrap scripts it generates itself.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);

    // Every response — pass-through or redirect — carries the same CSP,
    // and every pass-through also carries the request-header form of the
    // nonce (see the comment above) so Next's renderer can see it.
    const passThrough = (): NextResponse => {
        const res = NextResponse.next({ request: { headers: requestHeaders } });
        res.headers.set("Content-Security-Policy", csp);
        return res;
    };
    const withCsp = (res: NextResponse): NextResponse => {
        res.headers.set("Content-Security-Policy", csp);
        return res;
    };

    // Always pass through Next.js internals and static files
    if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return passThrough();
    }

    // Marketer routes handle their own auth; never gate them on the main app cookie.
    if (pathname === MARKETER_PREFIX || pathname.startsWith(`${MARKETER_PREFIX}/`)) {
        return passThrough();
    }

    // The nepay_refresh flag cookie is the only persistent, readable signal
    // available here — see this file's class-level note on why it's a
    // routing UX gate, not the real auth boundary.
    const hasSession = request.cookies.has("nepay_refresh");

    // If the user is logged in and visiting an auth page, bounce to overview
    if (hasSession && PUBLIC_PATHS.has(pathname)) {
        return withCsp(NextResponse.redirect(new URL("/overview", request.url)));
    }

    // Pass through exact public auth pages (for non-logged in users)
    if (PUBLIC_PATHS.has(pathname)) {
        return passThrough();
    }

    if (!hasSession) {
        // If it's a public content page, let them view it without logging in
        if (PUBLIC_CONTENT_PATHS.has(pathname)) {
            return passThrough();
        }

        // Preserve the attempted URL so we can redirect back after login
        const loginUrl = new URL("/login", request.url);
        const returnTo = pathname !== "/" ? pathname : undefined;
        if (returnTo) {
            loginUrl.searchParams.set("returnTo", returnTo);
        }
        return withCsp(NextResponse.redirect(loginUrl));
    }

    return passThrough();
}

export const config = {
    /*
     * Match everything except:
     * - Next.js internals (_next/static, _next/image)
     * - Any file with an extension (images, fonts, favicons, etc.)
     */
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot|css|js)$).*)",
    ],
};
