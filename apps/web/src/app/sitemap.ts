import type { MetadataRoute } from "next";

// Apex nepay.com.ng 308-redirects to www, so www is the canonical host.
const BASE_URL = "https://www.nepay.com.ng";

/** Public, indexable pages only — app and auth routes stay out. */
const PUBLIC_PAGES = ["", "/legal/terms", "/legal/privacy", "/legal/compliance", "/delete-account"];

export default function sitemap(): MetadataRoute.Sitemap {
    return PUBLIC_PAGES.map((path) => ({
        url: `${BASE_URL}${path}`,
        lastModified: new Date(),
    }));
}
