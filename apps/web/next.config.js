/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Don't advertise the framework in an "X-Powered-By: Next.js" header.
    poweredByHeader: false,
    // Browser source maps are never published (the default, stated explicitly so a future edit doesn't flip it).
    productionBrowserSourceMaps: false,
    compiler: {
        // Production bundles keep console.error only — no debug output for someone watching DevTools.
        removeConsole: { exclude: ["error"] },
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                // Apply these security headers to every route.
                // Content-Security-Policy is deliberately NOT set here — it's
                // set per-request in middleware.ts instead, where a real,
                // nonce-based policy can be built (a static header here can't
                // carry a per-request nonce). Setting it in both places would
                // just leave two sources of truth to keep in sync.
                source: "/(.*)",
                headers: [
                    {
                        // Tell browsers to always use HTTPS for this domain
                        // for the next 2 years, including subdomains.
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    {
                        // Prevent MIME-type sniffing attacks
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        // Switch off powerful browser features this app never uses.
                        key: "Permissions-Policy",
                        value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
                    },
                    {
                        // Only send the origin (not the full URL path) as referrer
                        // when navigating cross-origin
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;