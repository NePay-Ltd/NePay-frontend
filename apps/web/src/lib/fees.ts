import type { FeeBand } from "@/lib/types/api";

/**
 * The fee for `amount` under `bands` (from GET /fees). Mirrors the
 * backend's feeFor. The server computes the real fee itself when the
 * withdrawal is made; this is only for showing it before they confirm.
 */
export function feeFor(bands: FeeBand[] | undefined, amount: number): number {
    if (!bands?.length || !(amount > 0)) return 0;
    const band = bands.find((b) => b.upTo === null || amount <= Number(b.upTo));
    return Number(band?.fee ?? 0);
}

/**
 * A customer-facing sentence for a fee schedule, or null when it's free:
 * "A ₦20 fee is taken from each deposit." or, for bands,
 * "A fee is taken from each deposit: ₦10 up to ₦5,000, ₦25 above."
 */
export function describeFees(
    bands: FeeBand[] | undefined,
    what: string,
    format: (amount: number) => string,
): string | null {
    if (!bands?.length || bands.every((b) => Number(b.fee) === 0)) return null;
    const [only] = bands;
    if (bands.length === 1 && only) return `A ${format(Number(only.fee))} fee is taken from each ${what}.`;

    const parts = bands.map((b) =>
        b.upTo === null ? `${format(Number(b.fee))} above` : `${format(Number(b.fee))} up to ${format(Number(b.upTo))}`,
    );
    return `A fee is taken from each ${what}: ${parts.join(", ")}.`;
}

/**
 * The largest amount that can be sent when the fee is charged on top, i.e.
 * the most `amount` where amount + fee(amount) still fits in `balance`.
 * Checked band by band because the fee steps up at each band's limit.
 */
export function maxSendable(bands: FeeBand[] | undefined, balance: number): number {
    if (!(balance > 0)) return 0;
    if (!bands?.length) return balance;

    let best = 0;
    let previousLimit = 0;

    for (const band of bands) {
        const limit = band.upTo === null ? Infinity : Number(band.upTo);
        const candidate = Math.min(limit, balance - Number(band.fee));

        if (candidate > previousLimit && candidate > best) {
            best = candidate;
        }

        previousLimit = limit;
    }

    return Math.floor(best * 100) / 100;
}
