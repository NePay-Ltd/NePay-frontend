/**
 * Maps this app's URL-friendly brand slugs (e.g. "google-play", used in
 * /gift-cards/sell/[brand]) to the backend's canonical cardBrand codes
 * (e.g. "GOOGLE_PLAY", used in GIFT_CARD_MANUAL_REVIEW_BRANDS and
 * GiftCardService's BRAND_DISCOUNTS table). Sending `brandId.toUpperCase()`
 * directly — the previous behaviour — turns "google-play" into
 * "GOOGLE-PLAY", which matches no discount entry and silently falls back
 * to the lowest default rate. Every call site that sends a brand to the
 * backend, or reads a backend brand-keyed response, must go through this
 * map rather than re-deriving the code with `.toUpperCase()`.
 */
export const GIFT_CARD_BRAND_CODES: Record<string, string> = {
    amazon: "AMAZON",
    itunes: "ITUNES",
    "google-play": "GOOGLE_PLAY",
    steam: "STEAM",
};

export function brandSlugToCode(slug: string): string {
    return GIFT_CARD_BRAND_CODES[slug] ?? slug.toUpperCase();
}
