import type { ReceiptConfig, ReceiptHighlight, ReceiptRow, ReceiptTone } from "@/lib/receipt-config";

/**
 * The NePay receipt as HTML - the single `ReceiptShell` for web. One generator behind the
 * on-screen receipt AND every download (HTML file, PNG, PDF), driven entirely by a
 * `ReceiptConfig` (lib/receipt-config.ts), so what a customer sees is exactly what they share.
 *
 * Anatomy, top to bottom: lavender ground -> white paper (clipped, shadowed) carrying a
 * rotated brick watermark of the logo -> header -> hero (status pill, amount, hero line, date)
 * -> optional status message -> optional highlight block -> perforation -> details -> reference
 * box -> footer -> torn zigzag edge.
 *
 * Every value is escaped: this markup is injected into live pages (the on-screen receipt, and a
 * hidden node html2canvas screenshots), so a hostile string from a provider must never become
 * an event handler.
 */

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const TONE: Record<ReceiptTone, { bg: string; fg: string }> = {
    success: { bg: "#DCFCE7", fg: "#166534" },
    pending: { bg: "#FEF3C7", fg: "#92400E" },
    failed: { bg: "#FEE2E2", fg: "#991B1B" },
};

const SANS = `var(--font-sans, "Plus Jakarta Sans"), "Plus Jakarta Sans", -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
const SERIF = `var(--font-receipt-serif, "Instrument Serif"), "Instrument Serif", Georgia, serif`;
const MONO = `var(--font-receipt-mono, "JetBrains Mono"), "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`;

/** The receipt's own stylesheet. Scoped under `.receipt` so it can sit on a live page without leaking. */
export const RECEIPT_CSS = `
.receipt, .receipt * { box-sizing: border-box; }
.receipt { width: 100%; max-width: 560px; margin: 0 auto; padding: 0; background: transparent; font-family: ${SANS}; color: #14092E; line-height: 1.35; -webkit-font-smoothing: antialiased; }
.receipt .rc-paper { position: relative; z-index: 0; overflow: hidden; background: #FFFFFF; border: 1px solid #F0EBFA; border-bottom: 0; }
.receipt .rc-wm { position: absolute; left: 50%; top: 50%; width: 1280px; height: 1680px; margin: -840px 0 0 -640px; transform: rotate(-22deg); z-index: -1; pointer-events: none; opacity: 0.028; }
.receipt .rc-wm-cell { position: absolute; width: 160px; height: 100px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.receipt .rc-wm-cell img { width: 40px; height: 40px; display: block; }
.receipt .rc-wm-cell span { font-size: 30px; font-weight: 800; color: #1A0050; letter-spacing: -0.5px; }
.receipt .rc-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 22px 24px 0; }
.receipt .rc-brand { display: flex; align-items: center; gap: 10px; }
.receipt .rc-brand img { width: 34px; height: 34px; display: block; }
.receipt .rc-brand span { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
.receipt .rc-kind { font-size: 11px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #5B4F78; text-align: right; }
.receipt .rc-hero { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 26px 24px 18px; text-align: center; }
.receipt .rc-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; }
.receipt .rc-dot { width: 8px; height: 8px; border-radius: 50%; }
.receipt .rc-amount { font-size: 40px; font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; }
.receipt .rc-line { font-size: 15px; font-weight: 600; color: #3B2470; word-break: break-word; }
.receipt .rc-date { font-family: ${MONO}; font-size: 12px; color: #5B4F78; }
.receipt .rc-msg { margin: 0 24px 18px; padding: 14px 16px; border-radius: 14px; display: flex; flex-direction: column; gap: 4px; }
.receipt .rc-msg b { font-size: 14px; font-weight: 700; }
.receipt .rc-msg span { font-size: 13px; line-height: 1.5; }
.receipt .rc-hl { margin: 0 24px 18px; border-radius: 14px; }
.receipt .rc-hl-dark { padding: 14px 16px; background: #1A0050; display: flex; flex-direction: column; gap: 8px; text-align: center; }
.receipt .rc-hl-tint { padding: 14px 16px; background: #F3EEFF; }
.receipt .rc-cap { font-size: 11px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #5B4F78; }
.receipt .rc-cap-lilac { color: #C4B5FD; }
.receipt .rc-token { font-family: ${MONO}; font-size: 19px; color: #FFFFFF; letter-spacing: 1px; word-break: break-all; }
.receipt .rc-foot-note { font-size: 12px; color: #DCD3F7; }
.receipt .rc-hl-extra { display: flex; justify-content: space-between; gap: 12px; padding-top: 10px; border-top: 1px solid #3B2470; font-size: 12px; text-align: left; }
.receipt .rc-hl-extra span:first-child { color: #C4B5FD; }
.receipt .rc-hl-extra span:last-child { font-family: ${MONO}; color: #FFFFFF; word-break: break-all; text-align: right; }
.receipt .rc-flex { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.receipt .rc-stack { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.receipt .rc-phone { font-family: ${MONO}; font-size: 16px; }
.receipt .rc-trail { font-size: 13px; font-weight: 700; color: #5B21B6; text-align: right; }
.receipt .rc-title { font-size: 17px; font-weight: 800; }
.receipt .rc-sub { font-size: 12.5px; color: #3B2470; }
.receipt .rc-tiles { margin: 0 24px 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.receipt .rc-tile { padding: 12px 14px; border-radius: 14px; display: flex; flex-direction: column; gap: 4px; }
.receipt .rc-tile b { font-size: 18px; font-weight: 800; word-break: break-word; }
.receipt .rc-who { font-size: 15px; font-weight: 800; word-break: break-word; }
.receipt .rc-whosub { font-size: 12px; color: #5B4F78; }
.receipt .rc-route-code { font-size: 30px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; }
.receipt .rc-route-city { font-size: 12px; color: #C4B5FD; }
.receipt .rc-route-foot { display: flex; justify-content: space-between; gap: 12px; padding-top: 10px; border-top: 1px solid #3B2470; font-size: 12px; color: #DCD3F7; }
.receipt .rc-perf { position: relative; height: 24px; }
.receipt .rc-perf div { position: absolute; left: 24px; right: 24px; top: 11px; border-top: 2px dashed #DCD3F7; }
.receipt .rc-details { padding: 12px 24px 0; }
.receipt .rc-details-title { font-size: 11px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #5B4F78; padding-bottom: 4px; }
.receipt .rc-row { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #F0EBFA; font-size: 14px; }
.receipt .rc-row:last-child { border-bottom: 0; }
.receipt .rc-row > span:first-child { color: #5B4F78; flex: 0 0 auto; max-width: 46%; }
.receipt .rc-row > span:last-child { font-weight: 600; text-align: right; min-width: 0; word-break: break-word; }
.receipt .rc-row .rc-mono { font-family: ${MONO}; font-size: 13px; }
.receipt .rc-row .rc-royal { color: #5B21B6; font-weight: 700; }
.receipt .rc-row .rc-total { font-weight: 800; }
.receipt .rc-refs { margin: 8px 24px 0; padding: 14px 16px; border-radius: 14px; background: #F8F6FC; display: flex; flex-direction: column; gap: 10px; }
.receipt .rc-ref { display: flex; flex-direction: column; gap: 6px; }
.receipt .rc-ref-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.receipt .rc-ref-val { flex: 1 1 auto; min-width: 0; font-family: ${MONO}; font-size: 14px; line-height: 1.4; word-break: break-all; }
.receipt .rc-copy { all: unset; box-sizing: border-box; flex: none; cursor: pointer; font-size: 12px; font-weight: 700; line-height: 1; color: #5B21B6; padding: 7px 14px; border-radius: 999px; background: #F0EBFA; white-space: nowrap; }
.receipt .rc-copy:hover { background: #E2D6FF; }
.receipt .rc-copy-block { margin-top: 2px; align-self: center; }
.receipt .rc-footer { display: flex; flex-direction: column; align-items: center; gap: 9px; padding: 20px 28px 18px; text-align: center; }
.receipt .rc-sign { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
.receipt .rc-sign em { font-family: ${SERIF}; font-style: italic; font-weight: 400; font-size: 24px; color: #7C3AED; letter-spacing: 0; }
.receipt .rc-help { margin: 0; font-size: 12.5px; line-height: 1.5; color: #3B2470; }
.receipt .rc-site { font-size: 12px; font-weight: 700; color: #5B21B6; letter-spacing: 0.4px; }
.receipt.rc-flat .rc-hl, .receipt.rc-flat .rc-tiles { margin: 0 0 14px; }
.receipt .rc-zig { display: block; height: 14px; overflow: hidden; background: #F3EEFF; }
.receipt .rc-zig svg { display: block; }
`;

const cap = (text: string, extra = "") => `<span class="rc-cap ${extra}">${escapeHtml(text)}</span>`;

function copyBtn(value: string, interactive: boolean, extra = ""): string {
    return interactive ? `<button type="button" class="rc-copy ${extra}" data-copy="${escapeHtml(value)}">Copy</button>` : "";
}

/** A staggered brick of logo + wordmark, oversized and rotated so no corner of the paper is left empty. */
function watermark(logoSrc: string): string {
    const cols = 8;
    const rows = 17;
    const cellW = 160;
    const cellH = 100;
    const logo = logoSrc ? `<img src="${escapeHtml(logoSrc)}" alt="" />` : "";
    const cells: string[] = [];
    for (let r = 0; r < rows; r++) {
        const shift = r % 2 === 1 ? cellW / 2 : 0;
        for (let c = -1; c < cols; c++) {
            cells.push(`<div class="rc-wm-cell" style="left:${c * cellW + shift}px;top:${r * cellH}px">${logo}<span>NePay</span></div>`);
        }
    }
    return `<div class="rc-wm" aria-hidden="true">${cells.join("")}</div>`;
}

/** Torn edge: 20px-wide, 14px-tall teeth drawn as one path (no image), wide enough for the widest paper. */
function zigzag(): string {
    const teeth = 30;
    let d = `M0 0H${teeth * 20}`;
    for (let k = teeth - 1; k >= 0; k--) d += `L${k * 20 + 10} 14L${k * 20} 0`;
    return `<div class="rc-zig" aria-hidden="true"><svg width="${teeth * 20}" height="14" viewBox="0 0 ${teeth * 20} 14" xmlns="http://www.w3.org/2000/svg"><path d="${d}Z" fill="#FFFFFF"/></svg></div>`;
}

export function highlightHtml(h: ReceiptHighlight, interactive: boolean): string {
    switch (h.kind) {
        case "token":
            return `<div class="rc-hl rc-hl-dark">${cap(h.label, "rc-cap-lilac")}<span class="rc-token">${escapeHtml(h.value)}</span>${
                h.footnote ? `<span class="rc-foot-note">${escapeHtml(h.footnote)}</span>` : ""
            }${h.extra ? `<div class="rc-hl-extra"><span>${escapeHtml(h.extra.label)}</span><span>${escapeHtml(h.extra.value)}</span></div>` : ""}${copyBtn(
                h.value.replace(/\s+/g, ""),
                interactive,
                "rc-copy-block",
            )}</div>`;
        case "phone":
            return `<div class="rc-hl rc-hl-tint rc-flex"><div class="rc-stack">${cap(h.label)}<span class="rc-phone">${escapeHtml(h.value)}</span></div>${
                h.trailing ? `<span class="rc-trail">${escapeHtml(h.trailing)}</span>` : ""
            }</div>`;
        case "package":
            return `<div class="rc-hl rc-hl-tint"><div class="rc-stack"><span class="rc-title">${escapeHtml(h.title)}</span>${
                h.subtitle ? `<span class="rc-sub">${escapeHtml(h.subtitle)}</span>` : ""
            }</div></div>`;
        case "tiles": {
            const style = {
                violet: { bg: "#7C3AED", cap: "#EEE7FF", ink: "#FFFFFF" },
                tint: { bg: "#F3EEFF", cap: "#5B4F78", ink: "#14092E" },
                panel: { bg: "#F8F6FC", cap: "#5B4F78", ink: "#14092E" },
            };
            return `<div class="rc-tiles">${h.tiles
                .map((t) => {
                    const s = style[t.tone];
                    return `<div class="rc-tile" style="background:${s.bg}"><span class="rc-cap" style="color:${s.cap}">${escapeHtml(t.label)}</span><b style="color:${s.ink}">${escapeHtml(t.value)}</b></div>`;
                })
                .join("")}</div>`;
        }
        case "transfer": {
            const side = (label: string, w: { name: string; sub?: string }, right: boolean) =>
                `<div class="rc-stack" style="${right ? "text-align:right" : ""}">${cap(label)}<span class="rc-who">${escapeHtml(w.name)}</span>${
                    w.sub ? `<span class="rc-whosub">${escapeHtml(w.sub)}</span>` : ""
                }</div>`;
            const arrow = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`;
            return `<div class="rc-hl rc-hl-tint rc-flex">${side("From", h.from, false)}${arrow}${side("To", h.to, true)}</div>`;
        }
        case "route": {
            const plane = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`;
            const end = (e: { code: string; city?: string }, right: boolean) =>
                `<div class="rc-stack" style="${right ? "text-align:right" : ""}"><span class="rc-route-code">${escapeHtml(e.code)}</span>${
                    e.city ? `<span class="rc-route-city">${escapeHtml(e.city)}</span>` : ""
                }</div>`;
            const foot = h.departs || h.flightNo;
            return `<div class="rc-hl rc-hl-dark" style="text-align:left;gap:12px;border-radius:16px"><div class="rc-flex">${end(h.from, false)}<div class="rc-stack" style="align-items:center;gap:4px">${plane}${
                h.duration ? `<span class="rc-route-city" style="font-size:11px">${escapeHtml(h.duration)}</span>` : ""
            }</div>${end(h.to, true)}</div>${
                foot ? `<div class="rc-route-foot"><span>${h.departs ? escapeHtml(h.departs) : ""}</span><span>${h.flightNo ? escapeHtml(h.flightNo) : ""}</span></div>` : ""
            }</div>`;
        }
    }
}

function rowHtml(r: ReceiptRow): string {
    const cls = [r.mono ? "rc-mono" : "", r.emphasis === "royal" ? "rc-royal" : "", r.emphasis === "total" ? "rc-total" : ""].filter(Boolean).join(" ");
    return `<div class="rc-row"><span>${escapeHtml(r.label)}</span><span class="${cls}">${escapeHtml(r.value)}</span></div>`;
}

export interface MarkupOptions {
    /** Show the in-app Copy buttons. Off for downloads and images. */
    interactive?: boolean;
}

/** `logoSrc` is a URL (on-screen) or a data URI (downloads, which must work offline). */
export function buildReceiptMarkup(c: ReceiptConfig, logoSrc: string, opts: MarkupOptions = {}): { css: string; html: string } {
    const interactive = !!opts.interactive;
    const tone = TONE[c.tone];
    const logo = logoSrc ? `<img src="${escapeHtml(logoSrc)}" alt="NePay logo" />` : "";

    const message = c.statusMessage
        ? `<div class="rc-msg" style="background:${tone.bg};color:${tone.fg}"><b>${escapeHtml(c.statusMessage.title)}</b><span>${escapeHtml(c.statusMessage.body)}</span></div>`
        : "";

    const refs = c.references.length
        ? `<div class="rc-refs">${c.references
              .map(
                  (r) =>
                      `<div class="rc-ref">${cap(r.label)}<div class="rc-ref-row"><span class="rc-ref-val">${escapeHtml(r.value)}</span>${copyBtn(r.value, interactive)}</div></div>`,
              )
              .join("")}</div>`
        : "";

    const html = `<div class="receipt"><div class="rc-paper">${watermark(logoSrc)}
<div class="rc-head"><div class="rc-brand">${logo}<span>NePay</span></div><span class="rc-kind">${escapeHtml(c.headerLabel)}</span></div>
<div class="rc-hero"><span class="rc-pill" style="background:${tone.bg};color:${tone.fg}"><span class="rc-dot" style="background:${tone.fg}"></span>${escapeHtml(c.statusLabel)}</span><div class="rc-amount">${escapeHtml(c.amount)}</div><div class="rc-line">${escapeHtml(c.heroLine)}</div>${
        c.dateLine ? `<div class="rc-date">${escapeHtml(c.dateLine)}</div>` : ""
    }</div>
${message}${c.highlight ? highlightHtml(c.highlight, interactive) : ""}
<div class="rc-perf"><div></div></div>
${
    c.rows.length
        ? `<div class="rc-details"><div class="rc-details-title">${escapeHtml(c.detailsTitle)}</div>${c.rows.map(rowHtml).join("")}</div>`
        : ""
}
${refs}
<div class="rc-footer"><div class="rc-sign">${escapeHtml(c.signOff.lead)}<em>${escapeHtml(c.signOff.accent)}</em></div><p class="rc-help">${escapeHtml(c.helpLine)}</p><span class="rc-site">nepay.com.ng</span></div>
</div>${zigzag()}</div>`;

    return { css: RECEIPT_CSS, html };
}
