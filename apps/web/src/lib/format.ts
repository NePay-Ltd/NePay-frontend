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
import React from 'react';

const NairaSvg = React.createElement(
    "svg",
    {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "w-[0.85em] h-[0.85em] self-center mr-[2px] inline-block -translate-y-[0.05em]"
    },
    React.createElement("path", { d: "M5 21V3l14 18V3" }),
    React.createElement("path", { d: "M3 10h18" }),
    React.createElement("path", { d: "M3 14h18" })
);

export function formatNaira(amount: string | number): React.ReactNode {
    const numeric = typeof amount === "string" ? Number.parseFloat(amount) : amount;

    if (Number.isNaN(numeric)) {
        if (process.env.NODE_ENV !== "production") {
            console.warn(`[formatNaira] invalid amount: ${String(amount)}`);
        }
        return React.createElement(
            "span",
            { className: "inline-flex items-baseline" },
            NairaSvg,
            "0.00"
        );
    }

    const formatted = nairaFormatter.format(numeric);
    const isNegative = formatted.startsWith("-");
    const valueStr = formatted.replace(/[₦-]/g, "");

    return React.createElement(
        "span",
        { className: "inline-flex items-baseline" },
        isNegative ? "-" : null,
        NairaSvg,
        valueStr
    );
}

export function formatNairaString(amount: string | number): string {
    const numeric = typeof amount === "string" ? Number.parseFloat(amount) : amount;
    if (Number.isNaN(numeric)) return "₦0.00";
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

export function formatNairaCompact(amount: string | number): React.ReactNode {
    const numeric = typeof amount === "string" ? Number.parseFloat(amount) : amount;
    if (Number.isNaN(numeric)) return React.createElement(
        "span",
        { className: "inline-flex items-baseline" },
        NairaSvg,
        "0"
    );
    
    const formatted = compactFormatter.format(numeric);
    const isNegative = formatted.startsWith("-");
    const valueStr = formatted.replace(/[₦-]/g, "");

    return React.createElement(
        "span",
        { className: "inline-flex items-baseline" },
        isNegative ? "-" : null,
        NairaSvg,
        valueStr
    );
}

/**
 * Format a value in an arbitrary ISO currency code — for the wallet's
 * preferred-display-currency figure, which can be NGN or USD today (EUR/GBP
 * have no rate source and are never rendered as a number, see
 * WalletBalanceDto.preferredCurrencyEquivalent). Routes NGN through
 * `formatNaira` so its formatting never drifts from the rest of the app;
 * anything else uses `Intl.NumberFormat` directly.
 *
 * @example formatByCurrency(12500, "NGN") // "₦12,500.00"
 * @example formatByCurrency(8.32, "USD")  // "$8.32"
 */
export function formatByCurrency(amount: string | number, currency: string): React.ReactNode {
    if (currency === "NGN") {
        return formatNaira(amount);
    }

    const numeric = typeof amount === "string" ? Number.parseFloat(amount) : amount;

    if (Number.isNaN(numeric)) {
        if (process.env.NODE_ENV !== "production") {
            console.warn(`[formatByCurrency] invalid amount: ${String(amount)}`);
        }
        return `0.00 ${currency}`;
    }

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numeric);
    } catch {
        // An ISO code Intl doesn't recognise — fail safe rather than throw.
        return `${numeric.toFixed(2)} ${currency}`;
    }
}