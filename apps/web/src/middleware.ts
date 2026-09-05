import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection middleware.
 *
 * Public routes (no auth required):
 *   /login, /register, /forgot-password, /reset-password
 *
 * All other routes require the user to be authenticated, indicated by the
 * presence of a `nepay_refresh` httpOnly cookie (set by the backend on login).
 *
 * In prototype/design mode this is intentionally loose — any visit to the
 * app routes will redirect to /login so you can explore the auth flows.
 *
 * During backend integration: replace the cookie check with a proper JWT
 * validation or keep it as a lightweight gate and let the API layer handle
 * full auth enforcement via 401 + silent refresh.
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
]);

/** Paths that start with these prefixes are always public (static, marketing). */
const PUBLIC_PREFIXES = ["/_next", "/favicon", "/api/auth/callback"];

/**
 * Marketer routes run their own auth system (a bearer token in localStorage,
 * checked client-side — see marketer-api.ts), entirely separate from the
 * `nepay_refresh` cookie used by the main app. They must be excluded here or
 * this middleware bounces marketer visitors to the main /login page.
 */
const MARKETER_PREFIX = "/marketer";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always pass through Next.js internals and static files
    if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return NextResponse.next();
    }

    // Marketer routes handle their own auth; never gate them on the main app cookie.
    if (pathname === MARKETER_PREFIX || pathname.startsWith(`${MARKETER_PREFIX}/`)) {
        return NextResponse.next();
    }

    // Pass through exact public auth pages
    if (PUBLIC_PATHS.has(pathname)) {
        return NextResponse.next();
    }

    // Check for the refresh-token cookie as the auth signal.
    // The access token is short-lived and lives in memory; the refresh token
    // is httpOnly and is the only persistent auth indicator we can read here.
    const hasSession = request.cookies.has("nepay_refresh");

    if (!hasSession) {
        // If it's a public content page, let them view it without logging in
        if (PUBLIC_CONTENT_PATHS.has(pathname)) {
            return NextResponse.next();
        }

        // Preserve the attempted URL so we can redirect back after login
        const loginUrl = new URL("/login", request.url);
        const returnTo = pathname !== "/" ? pathname : undefined;
        if (returnTo) {
            loginUrl.searchParams.set("returnTo", returnTo);
        }
        return NextResponse.redirect(loginUrl);
    }

    // If the user is logged in and visiting an auth page, bounce to overview
    if (PUBLIC_PATHS.has(pathname)) {
        return NextResponse.redirect(new URL("/overview", request.url));
    }

    return NextResponse.next();
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
