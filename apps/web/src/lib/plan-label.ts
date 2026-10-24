/**
 * Reads a VTpass plan's NAME to work out how long it lasts and how to show it.
 *
 * VTpass has no structured "validity" field — only free text, written differently
 * by every network: "N100 100MB - 24 hrs", "Airtel Data Bundle - 50 Naira - 25MB  - 1Day",
 * "MTN N50,000 165GB SME Mobile Data (2-Months)", "1.5GB Bigga for 30days - 1,000 Naira",
 * "Nova - 900 Naira - 1 Month". The old per-screen string matching ("30 day" with a
 * space, "7 day"…) silently missed most of those, so whole plans vanished under the
 * Daily/Weekly/Monthly tabs and titles came out as prices.
 *
 * Pure and dependency-free on purpose: this exact file is mirrored in the mobile app
 * (src/lib/plan-label.ts) so both apps group plans identically. Keep them in sync.
 */

export type PlanBucket = "Daily" | "Weekly" | "Monthly" | "Long term" | "Other";

/** Tab order shown to the customer (after "All"). */
export const PLAN_BUCKETS: PlanBucket[] = ["Daily", "Weekly", "Monthly", "Long term", "Other"];

const DURATION = /(\d+(?:\.\d+)?)\s*-?\s*(hrs?|hours?|days?|weeks?|months?|years?)\b/i;

const UNIT_DAYS: Record<string, number> = { hour: 1 / 24, day: 1, week: 7, month: 30, year: 365 };

/** "24 hrs" -> "hour", "2-Months" -> "month" … */
function unitOf(raw: string): keyof typeof UNIT_DAYS {
    const u = raw.toLowerCase();
    if (u.startsWith("hr") || u.startsWith("hour")) return "hour";
    if (u.startsWith("day")) return "day";
    if (u.startsWith("week")) return "week";
    if (u.startsWith("month")) return "month";
    return "year";
}

/** How many days the plan lasts, or null if the text doesn't say. */
function daysFromText(text: string): number | null {
    const m = text.match(DURATION);
    if (m) {
        return Number(m[1]) * UNIT_DAYS[unitOf(m[2]!)]!;
    }
    const t = text.toLowerCase();
    if (/\bdaily\b/.test(t)) return 1;
    if (/\bweekly\b/.test(t)) return 7;
    if (/\bmonthly\b/.test(t)) return 30;
    if (/\b(yearly|annual)\b/.test(t)) return 365;
    return null;
}

function bucketForDays(days: number): PlanBucket {
    if (days <= 3) return "Daily";
    if (days <= 14) return "Weekly";
    if (days <= 35) return "Monthly";
    return "Long term";
}

/**
 * Which tab a plan belongs under. Reads the name first, then the variation code
 * (Glo's "glo-monthly-1000", "glo-2weeks-500" carry the period even when the
 * name only says "Oneoff"); "Other" only when neither says anything.
 */
export function planBucket(name: string, variationCode = ""): PlanBucket {
    const fromName = daysFromText(name);
    if (fromName !== null) return bucketForDays(fromName);

    const fromCode = daysFromText(variationCode.replace(/[_-]/g, " "));
    if (fromCode !== null) return bucketForDays(fromCode);

    return "Other";
}

export interface PlanLabel {
    /** The big line: the data size ("1.5GB") when there is one, else the plan's own name ("DStv Padi"). */
    title: string;
    /** The small line: how long it lasts ("30 days"), when the name says. */
    validity: string;
    /** What else makes this plan different ("SME", "Telegram", "Night") — empty for a plain bundle. */
    note: string;
}

const SIZE = /(\d+(?:\.\d+)?)\s*(MB|GB|TB)\b/i;
// Brand/filler words and price tokens that add nothing next to the price shown on the card.
const NOISE =
    /\b(?:n\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s*naira|naira|oneoff|data|bundle|plan|mobile|for|mtn|glo|airtel|9mobile|etisalat)\b/gi;

function tidy(text: string): string {
    let out = text
        .replace(/\(\s*\)/g, " ")
        .replace(/\s+[-–]\s+/g, " ")
        .replace(/^[\s\-–+:,]+|[\s\-–+:,]+$/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    // Only unwrap "( … )" when the whole thing is one pair — never leave a lone bracket behind.
    if (/^\([^()]*\)$/.test(out)) out = out.slice(1, -1).trim();
    return out;
}

/** Splits a raw VTpass plan name into a clean title / validity / note for display. */
export function parsePlanLabel(name: string): PlanLabel {
    const duration = name.match(DURATION);
    const size = name.match(SIZE);
    const validity = duration ? `${duration[1]} ${duration[2]!.toLowerCase()}` : "";

    let rest = name;
    if (duration) rest = rest.replace(duration[0], " ");

    if (size) {
        // The size is the headline; whatever else is left says what kind of bundle it is.
        const note = tidy(rest.replace(size[0], " ").replace(NOISE, " "));
        return { title: `${size[1]}${size[2]!.toUpperCase()}`, validity, note };
    }

    // No data size (TV bouquets, Spectranet, voice bundles): show the plan's own name,
    // minus the price (it has its own line) and the period (it has its own line).
    const title = tidy(rest.replace(NOISE, " "));

    return { title: title || tidy(name) || name, validity, note: "" };
}
