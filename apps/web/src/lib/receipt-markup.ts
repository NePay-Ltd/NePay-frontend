import { receiptCode, RECEIPT_STATUS_LABEL, type ReceiptRow, type ReceiptStatus } from "@/lib/receipt-model";

/**
 * The NePay receipt, as HTML — one generator behind the on-screen receipt AND every
 * download (HTML file, PNG, PDF), so what a customer sees is exactly what they share.
 *
 * What makes it NePay rather than "a receipt":
 *   - a violet gradient band carrying the N mark, with a circular STATUS SEAL
 *     straddling its lower edge (check / clock / cross);
 *   - a ticket perforation with punched side notches between the amount and the details;
 *   - a "Verified by NePay" tag and a NePay CODE — a bar pattern derived from the
 *     transaction id, so every receipt carries its own recognisable signature;
 *   - a faint diagonal NePay watermark behind the details.
 * Deliberately none of the plain-white-with-a-green-amount look other apps use.
 *
 * Every value is escaped: this markup is injected into live pages (the on-screen
 * receipt, and a hidden node html2canvas screenshots), so a hostile string from a
 * provider must never become an event handler.
 */

export interface ReceiptMarkupInput {
    id: string;
    amount: number;
    currency: string;
    status: ReceiptStatus;
    date?: string;
    /** Ordered lines — see lib/receipt-model.ts. */
    rows: ReceiptRow[];
}

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function formatReceiptAmount(amount: number, currency: string): string {
    const abs = Math.abs(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currency === "NGN" ? `₦${abs}` : `${abs} ${currency}`;
}

export function formatReceiptDate(date?: string): string {
    return date ? new Date(date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "medium" }) : "";
}

const STATUS_COLOR: Record<ReceiptStatus, string> = { success: "#059669", pending: "#D97706", failed: "#DC2626" };

const STATUS_ICON: Record<ReceiptStatus, string> = {
    success: `<path d="M6 12.5l4.2 4.2L18.5 8" />`,
    pending: `<circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />`,
    failed: `<path d="M8 8l8 8M16 8l-8 8" />`,
};

/** The receipt's own stylesheet. Scoped under `.receipt` so it can sit on a live page without leaking. */
export const RECEIPT_CSS = `
.receipt, .receipt * { box-sizing: border-box; }
.receipt { background: #F5F3FF; padding: 20px; max-width: 500px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #111827; line-height: 1.35; }
.receipt .np-card { position: relative; background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 12px 32px rgba(76, 29, 149, 0.14); }
.receipt .np-band { background: linear-gradient(135deg, #3B0A8C 0%, #6D28D9 55%, #8B5CF6 100%); padding: 22px 24px 48px; display: flex; align-items: center; justify-content: space-between; color: #fff; }
.receipt .np-brand { display: flex; align-items: center; gap: 10px; }
.receipt .np-logo { width: 36px; height: 36px; border-radius: 11px; background: #fff; display: flex; align-items: center; justify-content: center; flex: none; }
.receipt .np-logo img { height: 22px; width: auto; display: block; }
.receipt .np-word { font-size: 22px; font-weight: 800; letter-spacing: -0.4px; }
.receipt .np-kind { font-size: 10.5px; letter-spacing: 1.6px; text-transform: uppercase; font-weight: 700; opacity: 0.88; text-align: right; }
.receipt .np-seal { width: 64px; height: 64px; border-radius: 50%; margin: -32px auto 0; position: relative; background: #fff; padding: 5px; box-shadow: 0 6px 16px rgba(17, 24, 39, 0.14); }
.receipt .np-seal-in { width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.receipt .np-seal svg { width: 30px; height: 30px; fill: none; stroke: #fff; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
.receipt .np-hero { text-align: center; padding: 14px 24px 24px; }
.receipt .np-amount { font-size: 36px; font-weight: 800; letter-spacing: -0.8px; color: #111827; font-variant-numeric: tabular-nums; }
.receipt .np-status { font-size: 15px; font-weight: 700; margin-top: 6px; }
.receipt .np-date { font-size: 12px; color: #6B7280; margin-top: 4px; }
.receipt .np-perf { position: relative; height: 0; border-top: 2px dashed #E5E7EB; margin: 0 18px; }
.receipt .np-perf::before, .receipt .np-perf::after { content: ""; position: absolute; top: -12px; width: 22px; height: 22px; border-radius: 50%; background: #F5F3FF; }
.receipt .np-perf::before { left: -29px; }
.receipt .np-perf::after { right: -29px; }
.receipt .np-body { padding: 8px 24px 10px; }
.receipt .np-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; padding: 13px 0; border-bottom: 1px solid #F3F4F6; }
.receipt .np-row:last-child { border-bottom: 0; }
.receipt .np-label { font-size: 12.5px; font-weight: 500; color: #6B7280; flex: 0 0 auto; max-width: 40%; padding-top: 1px; }
.receipt .np-val { flex: 1 1 auto; min-width: 0; text-align: right; }
.receipt .np-val b { display: block; font-size: 14px; font-weight: 700; color: #111827; word-break: break-word; }
.receipt .np-val small { display: block; font-size: 12px; font-weight: 500; color: #6B7280; margin-top: 2px; word-break: break-word; }
.receipt .np-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; font-size: 12.5px !important; letter-spacing: 0; }
.receipt .np-foot { padding: 18px 24px 24px; text-align: center; background: #FAF8FF; border-top: 1px solid #F0EBFF; }
.receipt .np-verified { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #5B21B6; background: #EDE9FE; border-radius: 999px; padding: 5px 12px; }
.receipt .np-verified svg { width: 13px; height: 13px; fill: none; stroke: #5B21B6; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.receipt .np-code { display: block; margin: 14px auto 6px; }
.receipt .np-codeid { font-size: 9.5px; letter-spacing: 2.2px; color: #9CA3AF; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; text-transform: uppercase; }
.receipt .np-legal { font-size: 10.5px; color: #9CA3AF; margin-top: 10px; line-height: 1.55; }
`;

/** The NePay code as an inline SVG — see receiptCode(). */
function codeSvg(seed: string): string {
    const bars = receiptCode(seed);
    const gap = 2;
    let x = 0;
    const rects = bars
        .map((w) => {
            const rect = `<rect x="${x}" y="0" width="${w}" height="26" rx="0.5" />`;
            x += w + gap;
            return rect;
        })
        .join("");
    return `<svg class="np-code" width="${x}" height="26" viewBox="0 0 ${x} 26" fill="#5B21B6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${rects}</svg>`;
}

/** Tiled diagonal "NePay" — an SVG data URI so html2canvas/html2pdf need no extra request. */
function watermarkUrl(): string {
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="150"><text x="110" y="82" text-anchor="middle" transform="rotate(-24 110 75)" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="#6D28D9" fill-opacity="0.045">NePay</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function rowHtml(r: ReceiptRow): string {
    const mono = r.mono ? " np-mono" : "";
    const sub = r.sub ? `<small>${escapeHtml(r.sub)}</small>` : "";
    return `<div class="np-row"><span class="np-label">${escapeHtml(r.label)}</span><span class="np-val"><b class="${mono.trim()}">${escapeHtml(r.value)}</b>${sub}</span></div>`;
}

/** `logoSrc` is a URL (on-screen) or a data URI (downloads, which must work offline). */
export function buildReceiptMarkup(input: ReceiptMarkupInput, logoSrc: string): { css: string; html: string } {
        const color = STATUS_COLOR[input.status];
    // The NePay code follows the Transaction ID printed on the receipt, so one transaction always has one code.
    const codeSeed = input.rows.find((r) => r.label === "Transaction ID")?.value ?? input.id;
    const logo = logoSrc ? `<img src="${escapeHtml(logoSrc)}" alt="" />` : `<span style="color:#6D28D9;font-weight:800">N</span>`;
    const date = formatReceiptDate(input.date);

    const html = `<div class="receipt"><div class="np-card">
<div class="np-band"><div class="np-brand"><span class="np-logo">${logo}</span><span class="np-word">NePay</span></div><div class="np-kind">Transaction<br/>Receipt</div></div>
<div class="np-seal"><div class="np-seal-in" style="background:${color}"><svg viewBox="0 0 24 24">${STATUS_ICON[input.status]}</svg></div></div>
<div class="np-hero"><div class="np-amount">${escapeHtml(formatReceiptAmount(input.amount, input.currency))}</div><div class="np-status" style="color:${color}">${RECEIPT_STATUS_LABEL[input.status]}</div>${date ? `<div class="np-date">${escapeHtml(date)}</div>` : ""}</div>
<div class="np-perf"></div>
<div class="np-body" style="background:#fff url('${watermarkUrl()}') repeat">${input.rows.map(rowHtml).join("")}</div>
<div class="np-foot"><span class="np-verified"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" /></svg>Verified by NePay</span>${codeSvg(codeSeed)}<div class="np-codeid">NePay · ${escapeHtml(codeSeed.replace(/-/g, "").slice(0, 12))}</div><div class="np-legal">This is an official NePay transaction receipt.<br/>www.nepay.com.ng</div></div>
</div></div>`;

    return { css: RECEIPT_CSS, html };
}
