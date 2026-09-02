/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                // Apply these security headers to every route
                source: "/(.*)",
                headers: [
                    {
                        // Force ALL mixed-content (http://) sub-resources to be
                        // loaded as https:// automatically. This is the primary
                        // fix for the "Not Secure" padlock warning.
                        key: "Content-Security-Policy",
                        value: "upgrade-insecure-requests",
                    },
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