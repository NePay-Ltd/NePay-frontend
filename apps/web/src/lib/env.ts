/**
 * The real, customer-facing production domain(s) — deliberately a denylist,
 * not an allowlist of "known safe" hosts. Every other host (localhost, any
 * Vercel preview, staging-nepay.vercel.app, a future staging subdomain)
 * defaults to "not production" with no extra configuration needed, so this
 * never has to be updated when a new non-prod deployment target shows up.
 */
const PRODUCTION_HOSTNAMES = new Set(["nepay.com.ng", "www.nepay.com.ng"]);

/**
 * Whether this page is currently being served from the real production
 * domain — independent of GET /config/test-mode (useTestMode), which
 * reflects the connected *backend's* VFD credentials, not which frontend
 * deployment rendered the page. The two can legitimately disagree (most
 * notably: before live VFD keys are configured, every backend — including
 * whichever one nepay.com.ng points at — is still in VFD test mode), so a
 * test-only control like "Simulate Deposit" must check both before it
 * renders, never either alone.
 *
 * `false` during SSR (no `window`) — matches useTestMode's own `undefined`
 * state during the server pass, so a test-only block gated on both never
 * flashes on the server only to disappear on hydration.
 */
export function isProductionHost(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    return PRODUCTION_HOSTNAMES.has(window.location.hostname);
}
