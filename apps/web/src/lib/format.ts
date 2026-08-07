/**
 * Money formatting helpers.
 *
 * Every Naira amount in the app MUST be rendered through `formatNaira` — never
 * manually concatenate the ₦ symbol or call `.toFixed` inline. This guarantees
 * consistent grouping, decimal places, and locale handling across the UI.
 */

const nairaFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/**
 * Format a value as Naira, always showing 2 decimal places and the ₦ symbol.
 *
 * @example formatNaira(12500)     // "₦12,500.00"
 * @example formatNaira("12500")   // "₦12,500.00"
 * @example formatNaira(-12500.5)  // "-₦12,500.50"
 */
export function formatNaira(amount: string | number): string {
    const numeric = typeof amount === "string" ? Number.parseFloat(amount) : amount;

    if (Number.isNaN(numeric)) {
        // Fail loudly in dev; render a safe placeholder in prod.
        if (process.env.NODE_ENV !== "production") {
            console.warn(`[formatNaira] invalid amount: ${String(amount)}`);
        }
        return "₦0.00";
    }

    return nairaFormatter.format(numeric);
}

/**
 * Compact formatter for tight spaces (KPI cards, charts).
 * @example formatNairaCompact(1_250_000) // "₦1.25M"
 */
const compactFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 2,
});

export function formatNairaCompact(amount: string | number): string {
    const numeric = typeof amount === "string" ? Number.parseFloat(amount) : amount;
    if (Number.isNaN(numeric)) return "₦0";
    return compactFormatter.format(numeric);
}