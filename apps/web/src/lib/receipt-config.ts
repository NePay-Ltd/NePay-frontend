/**
 * The NePay receipt, as DATA. One config per transaction, built here from the facts we
 * hold, rendered by every surface: the web receipt and its downloads, the mobile receipt
 * and the summary sheet, and the emailed PDF. A surface never decides what a receipt says;
 * it only draws a ReceiptConfig. Adding a transaction type is a change in this file.
 *
 * Pure and dependency free (one sibling import, plan-label). This exact file is mirrored in
 * the mobile app (src/lib/receipt-config.ts) and the backend
 * (src/modules/notification/templates/receipt-config.ts). Keep the three identical; the
 * backend test suite covers it.
 *
 * Rules every builder follows:
 *  - A row appears only when there is a real value for it. Nothing is invented, and an
 *    empty value never reaches the screen.
 *  - Amounts show the currency symbol, thousands separators and two decimals.
 *  - Dates are written in West Africa Time: "25 Oct 2026 · 23:34 WAT".
 *  - Account numbers arrive already masked by the server ("105****311").
 */

import { parsePlanLabel } from "./plan-label";

// ─── Types ────────────────────────────────────────────────────────────────────────────────

export type ReceiptTone = "success" | "pending" | "failed";
export type CurrencyCode = "NGN" | "USD" | "EUR" | "GBP";

export type ReceiptKind =
    | "TRANSFER"
    | "DEPOSIT"
    | "ELECTRICITY"
    | "AIRTIME"
    | "DATA"
    | "EDUCATION"
    | "CABLE"
    | "CRYPTO"
    | "GIFTCARD"
    | "FOREIGN_DEPOSIT"
    | "FLIGHT"
    | "GENERIC";

export interface ReceiptRow {
    label: string;
    value: string;
    /** Monospace: numbers and IDs. */
    mono?: boolean;
    /** "royal" for discounts and PNR; "total" for the closing total. */
    emphasis?: "royal" | "total";
}

export interface ReceiptReference {
    label: string;
    value: string;
    /** A long ID that may wrap on the full receipt. */
    long?: boolean;
}

export type ReceiptHighlight =
    /** Dark block: an electricity token or exam PIN, copyable. */
    | { kind: "token"; label: string; value: string; footnote?: string; extra?: { label: string; value: string } }
    /** Tint block: a recharged number. */
    | { kind: "phone"; label: string; value: string; trailing?: string }
    /** Tint block: a TV package. */
    | { kind: "package"; title: string; subtitle?: string }
    /** Two tiles side by side. */
    | { kind: "tiles"; tiles: { label: string; value: string; tone: "violet" | "tint" | "panel" }[] }
    /** Tint block: money moving from a sender to a NePay account. */
    | { kind: "transfer"; from: { name: string; sub?: string }; to: { name: string; sub?: string } }
    /** Dark route block for a flight. */
    | {
          kind: "route";
          from: { code: string; city?: string };
          to: { code: string; city?: string };
          duration?: string;
          departs?: string;
          flightNo?: string;
      };

export interface ReceiptConfig {
    kind: ReceiptKind;
    id: string;
    headerLabel: string;
    tone: ReceiptTone;
    statusLabel: string;
    /** The hero amount, already formatted. */
    amount: string;
    heroLine: string;
    dateLine: string;
    statusMessage?: { title: string; body: string };
    highlight?: ReceiptHighlight;
    detailsTitle: string;
    rows: ReceiptRow[];
    /** The first is always the transaction reference. */
    references: ReceiptReference[];
    signOff: { lead: string; accent: string };
    helpLine: string;
}

// ─── Formatting helpers (the only place money, dates and masking are formatted) ─────────────

const SYMBOL: Record<CurrencyCode, string> = { NGN: "₦", USD: "$", EUR: "€", GBP: "£" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad2 = (n: number) => String(n).padStart(2, "0");

export const SUPPORT_EMAIL_DEFAULT = "support@nepay.com.ng";

const present = (v: string | null | undefined): v is string => typeof v === "string" && v.trim().length > 0;

/** "₦12,500.00", "$250.00", "−₦30.00". Not locale dependent, so every device prints the same. */
export function formatMoney(value: number | string | null | undefined, currency: CurrencyCode = "NGN"): string {
    const n = Number(value);
    if (value === null || value === undefined || value === "" || !Number.isFinite(n)) return "";
    const [whole, decimals] = Math.abs(n).toFixed(2).split(".");
    const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${n < 0 ? "−" : ""}${SYMBOL[currency] ?? ""}${grouped}.${decimals}`;
}

/** "25 Oct 2026 · 23:34 WAT". Nigeria is UTC+1 all year, so no time zone database is needed. */
export function formatReceiptDate(date: string | Date | null | undefined): string {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    const w = new Date(d.getTime() + 60 * 60 * 1000);
    return `${pad2(w.getUTCDate())} ${MONTHS[w.getUTCMonth()]} ${w.getUTCFullYear()} · ${pad2(w.getUTCHours())}:${pad2(w.getUTCMinutes())} WAT`;
}

/** "ADA OBI" -> "Ada Obi". Receipts print names in title case. */
export function titleCase(name: string | null | undefined): string {
    if (!present(name)) return "";
    return name
        .trim()
        .toLowerCase()
        .replace(/(^|[\s\-'’])([a-zà-ÿ])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** Tokens and PINs in groups of four: "263612345678" -> "2636 1234 5678". */
export function groupByFour(value: string | null | undefined): string {
    if (!present(value)) return "";
    const compact = value.replace(/[\s\-]/g, "");
    return compact.replace(/(.{4})/g, "$1 ").trim();
}

/** "08031234567" -> "0803 123 4567". Anything that is not an 11 digit number is left as written. */
export function formatPhone(value: string | null | undefined): string {
    if (!present(value)) return "";
    const digits = value.replace(/\s+/g, "");
    return /^\d{11}$/.test(digits) ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}` : value.trim();
}

/** "8300c176bb2f59df" -> "8300c176…59df". For lists and the summary sheet, never the full receipt. */
export function truncateMiddle(value: string | null | undefined, head = 8, tail = 4): string {
    if (!present(value)) return "";
    return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** "1050224311" -> "105****311". Never reveals a whole number. */
export function maskAccount(accountNumber: string): string {
    const digits = accountNumber.trim();
    if (digits.length <= 6) return digits.replace(/./g, "*");
    return `${digits.slice(0, 3)}${"*".repeat(Math.max(digits.length - 6, 4))}${digits.slice(-3)}`;
}

/** The last four digits of a foreign account, as "****1234". */
export function lastFour(accountNumber: string | null | undefined): string {
    if (!present(accountNumber)) return "";
    const digits = accountNumber.replace(/\D/g, "");
    return digits.length >= 4 ? `****${digits.slice(-4)}` : "";
}

// ─── Row helpers ───────────────────────────────────────────────────────────────────────────

function row(label: string, value: string | null | undefined, extra: Partial<ReceiptRow> = {}): ReceiptRow | null {
    return present(value) ? { label, value: value.trim(), ...extra } : null;
}

const compact = <T>(items: (T | null | undefined | false)[]): T[] => items.filter((x): x is T => !!x);

/**
 * The money rows at the foot of the details: Amount, Discount, Fee, Total. A discount is shown
 * as a negative in royal violet. The total closes the list, in bold, only when something sits
 * between the amount and what was actually paid (a discount or a fee), so a plain purchase
 * does not repeat its own hero amount.
 */
export function moneyRows(o: {
    currency: CurrencyCode;
    amountLabel: string;
    /** Face value, before any discount. Defaults to the amount paid. */
    face?: number | null;
    discount?: number | null;
    fee?: number | null;
    /** Show "Fee ₦0.00" when the fee is known to be zero (transfers). */
    showZeroFee?: boolean;
    totalLabel?: string;
    /** What the customer actually paid or received. */
    paid: number;
}): ReceiptRow[] {
    const discount = o.discount && o.discount > 0 ? o.discount : 0;
    const fee = o.fee !== null && o.fee !== undefined && Number.isFinite(o.fee) ? o.fee : null;
    const hasFee = fee !== null && (fee > 0 || !!o.showZeroFee);
    const face = o.face ?? o.paid;

    const rows: (ReceiptRow | null)[] = [row(o.amountLabel, formatMoney(face, o.currency))];

    if (discount > 0) rows.push(row("Discount", formatMoney(-discount, o.currency), { emphasis: "royal" }));
    if (hasFee) rows.push(row("Fee", formatMoney(fee, o.currency)));

    if (discount > 0 || (fee !== null && fee > 0)) {
        rows.push(row(o.totalLabel ?? "Total paid", formatMoney(face - discount + (fee ?? 0), o.currency), { emphasis: "total" }));
    }

    return compact(rows);
}

// ─── Status, copy and per type text ───────────────────────────────────────────────────────

const STATUS_LABEL: Record<ReceiptTone, string> = { success: "Successful", pending: "Pending", failed: "Failed" };

/** Shown under the hero for Pending and Failed. */
function statusMessage(tone: ReceiptTone, failedBody?: string): ReceiptConfig["statusMessage"] {
    if (tone === "pending") {
        return {
            title: "Still processing",
            body: "We are processing this transaction. You will get a notification once it completes, so there is no need to try again.",
        };
    }
    if (tone === "failed") {
        return { title: "Transaction not completed", body: failedBody ?? "This transaction did not go through. Any amount debited has been returned to your NePay wallet." };
    }
    return undefined;
}

const DEFAULT_SIGN_OFF = { lead: "Your Money, ", accent: "Your Way." };

// ─── Inputs ──────────────────────────────────────────────────────────────────────────────

interface BaseInput {
    /** NePay's own id for the transaction. */
    id: string;
    /** The transaction reference shown in the reference box. */
    reference: string;
    tone: ReceiptTone;
    /** The amount that actually moved: what was paid, sent or credited. */
    amount: number;
    currency?: CurrencyCode;
    date?: string | Date | null;
    fee?: number | null;
    /** Overrides the default status wording ("Received", "Booked"). */
    statusLabel?: string;
    supportEmail?: string;
    /** Set by `shareable()` - see there. Builders never need to look at it except to word a message. */
    share?: boolean;
}

export interface TransferInput extends BaseInput {
    kind: "TRANSFER";
    recipientName?: string | null;
    bankName?: string | null;
    /** Already masked. */
    accountNumber?: string | null;
    senderName?: string | null;
    narration?: string | null;
    sessionId?: string | null;
    isRefund?: boolean;
}

export interface DepositInput extends BaseInput {
    kind: "DEPOSIT";
    senderName?: string | null;
    senderBankName?: string | null;
    senderAccount?: string | null;
    narration?: string | null;
    sessionId?: string | null;
    recipientName?: string | null;
    recipientBankName?: string | null;
    recipientAccount?: string | null;
}

interface UtilityMoney {
    /** Face value, before the discount. */
    faceAmount?: number | null;
    discount?: number | null;
}

export interface ElectricityInput extends BaseInput, UtilityMoney {
    kind: "ELECTRICITY";
    disco?: string | null;
    meterNumber?: string | null;
    meterType?: string | null;
    customerName?: string | null;
    customerAddress?: string | null;
    tariff?: string | null;
    units?: string | null;
    token?: string | null;
    providerTransactionId?: string | null;
}

export interface AirtimeInput extends BaseInput, UtilityMoney {
    kind: "AIRTIME";
    network?: string | null;
    phone?: string | null;
}

export interface DataInput extends BaseInput, UtilityMoney {
    kind: "DATA";
    network?: string | null;
    phone?: string | null;
    /** The bundle as VTpass names it, for example "N1000 1.5GB, 30 days". */
    bundle?: string | null;
}

export interface EducationInput extends BaseInput, UtilityMoney {
    kind: "EDUCATION";
    examBody?: string | null;
    service?: string | null;
    quantity?: number | null;
    phone?: string | null;
    pin?: string | null;
    serial?: string | null;
}

export interface CableInput extends BaseInput, UtilityMoney {
    kind: "CABLE";
    provider?: string | null;
    smartcard?: string | null;
    customerName?: string | null;
    packageName?: string | null;
    /** "1 month" */
    period?: string | null;
    /** "25 Nov 2026" */
    until?: string | null;
}

export interface CryptoInput extends BaseInput {
    kind: "CRYPTO";
    coinAmount?: string | null;
    coin?: string | null;
    rate?: number | null;
    network?: string | null;
    txHash?: string | null;
}

export interface GiftCardInput extends BaseInput {
    kind: "GIFTCARD";
    brand?: string | null;
    /** Face value of one card, in USD. */
    valueUsd?: number | null;
    /** How many cards were sold; shown when more than one. */
    quantity?: number | null;
    country?: string | null;
    cardType?: string | null;
    rate?: number | null;
}

export interface ForeignDepositInput extends BaseInput {
    kind: "FOREIGN_DEPOSIT";
    /** The foreign currency of the account the money arrived in; `amount` is in it. */
    foreignCurrency: CurrencyCode;
    senderName?: string | null;
    senderCountry?: string | null;
    paymentMethod?: string | null;
    institution?: string | null;
    senderReference?: string | null;
    accountLast4?: string | null;
    /** Naira side of the automatic conversion. */
    rate?: number | null;
    convertedNgn?: number | null;
    conversionFeeNgn?: number | null;
    creditedNgn?: number | null;
}

export interface FlightInput extends BaseInput {
    kind: "FLIGHT";
    airline?: string | null;
    from?: { code: string; city?: string | null } | null;
    to?: { code: string; city?: string | null } | null;
    duration?: string | null;
    departs?: string | null;
    flightNo?: string | null;
    pnr?: string | null;
    passenger?: string | null;
    extraPassengers?: number | null;
    trip?: string | null;
    cabin?: string | null;
}

export interface GenericInput extends BaseInput {
    kind: "GENERIC";
    typeLabel: string;
    description?: string | null;
    /** Money in or out, for the hero line. */
    credit?: boolean;
}

export type ReceiptInput =
    | TransferInput
    | DepositInput
    | ElectricityInput
    | AirtimeInput
    | DataInput
    | EducationInput
    | CableInput
    | CryptoInput
    | GiftCardInput
    | ForeignDepositInput
    | FlightInput
    | GenericInput;

// ─── Builders ─────────────────────────────────────────────────────────────────────────────

function help(question: string, email: string, tail = " and quote the reference above."): string {
    return `${question} Contact NePay Support at ${email}${tail}`;
}

function shell(
    i: BaseInput,
    p: {
        kind: ReceiptKind;
        headerLabel: string;
        heroLine: string;
        detailsTitle?: string;
        highlight?: ReceiptHighlight | null;
        rows: ReceiptRow[];
        references?: ReceiptReference[];
        signOff?: { lead: string; accent: string };
        helpLine: string;
        dateLinePrefix?: string;
        failedBody?: string;
        statusLabel?: string;
    },
): ReceiptConfig {
    const currency = i.currency ?? "NGN";
    const seen = new Set<string>();
    // The same value is never printed twice (a ledger id doubles as the reference when no other one exists).
    const references = compact<ReceiptReference>([
        present(i.reference) ? { label: "Transaction reference", value: i.reference.trim() } : null,
        ...(p.references ?? []),
    ]).filter((r) => (seen.has(r.value) ? false : (seen.add(r.value), true)));

    return {
        kind: p.kind,
        id: i.id,
        headerLabel: p.headerLabel,
        tone: i.tone,
        statusLabel: p.statusLabel ?? i.statusLabel ?? STATUS_LABEL[i.tone],
        amount: formatMoney(i.amount, currency),
        heroLine: p.heroLine,
        dateLine: `${p.dateLinePrefix ?? ""}${formatReceiptDate(i.date)}`.trim(),
        statusMessage: statusMessage(i.tone, p.failedBody),
        highlight: p.highlight ?? undefined,
        detailsTitle: p.detailsTitle ?? "Transaction details",
        rows: p.rows,
        references,
        signOff: p.signOff ?? DEFAULT_SIGN_OFF,
        helpLine: p.helpLine,
    };
}

const email = (i: BaseInput) => (present(i.supportEmail) ? i.supportEmail : SUPPORT_EMAIL_DEFAULT);

function buildTransfer(i: TransferInput): ReceiptConfig {
    const recipient = titleCase(i.recipientName);
    const fee = i.fee ?? null;

    return shell(i, {
        kind: "TRANSFER",
        headerLabel: "Transfer receipt",
        heroLine: i.isRefund ? "Transfer refunded to your wallet" : recipient ? `Sent to ${recipient}` : "Transfer to a bank account",
        rows: compact([
            row("Recipient", recipient),
            row("Bank", i.bankName),
            row("Account number", i.accountNumber, { mono: true }),
            row("Sender", titleCase(i.senderName)),
            row("Narration", i.narration),
            // A failed transfer is returned to the wallet, so only the (non-refunded) fee is shown - never a "total debited".
            ...(fee !== null && i.amount > 0
                ? moneyRows({ currency: "NGN", amountLabel: "Amount", paid: i.amount, fee, showZeroFee: true, totalLabel: "Total debited" }).slice(1, i.tone === "failed" ? 2 : undefined)
                : []),
        ]),
        references: compact<ReceiptReference>([
            present(i.id) ? { label: "Transaction ID", value: i.id, long: true } : null,
            present(i.sessionId) ? { label: "Session ID", value: i.sessionId.trim(), long: true } : null,
        ]),
        helpLine: help("Questions about this transfer?", email(i)),
        // The fee is deliberately not refunded when a transfer fails (a decision of the business).
        failedBody: i.share
            ? "This transfer did not go through. The amount has been returned to your NePay wallet."
            : "This transfer did not go through. The amount has been returned to your NePay wallet. The transfer fee is not refunded.",
    });
}

function buildDeposit(i: DepositInput): ReceiptConfig {
    const sender = titleCase(i.senderName);

    return shell(i, {
        kind: "DEPOSIT",
        headerLabel: "Deposit receipt",
        heroLine: sender ? `Received from ${sender}` : "Received into your NePay wallet",
        rows: compact([
            row("Sender", sender),
            row("Bank", i.senderBankName),
            row("Account number", i.senderAccount, { mono: true }),
            row("Narration", i.narration),
            row("Credited to", [titleCase(i.recipientName), i.recipientBankName, i.recipientAccount].filter(present).join(" · ") || "NePay Naira wallet"),
            ...(i.fee && i.fee > 0 ? moneyRows({ currency: "NGN", amountLabel: "Amount", paid: i.amount, fee: i.fee, totalLabel: "Total credited" }) : []),
        ]),
        references: compact<ReceiptReference>([
            present(i.id) ? { label: "Transaction ID", value: i.id, long: true } : null,
            present(i.sessionId) ? { label: "Session ID", value: i.sessionId.trim(), long: true } : null,
        ]),
        helpLine: help("Questions about this deposit?", email(i)),
    });
}

function buildElectricity(i: ElectricityInput): ReceiptConfig {
    const money = moneyRows({ currency: "NGN", amountLabel: "Amount", face: i.faceAmount, discount: i.discount, fee: i.fee, paid: i.amount });

    return shell(i, {
        kind: "ELECTRICITY",
        headerLabel: "Bill payment receipt",
        heroLine: i.disco ? `Electricity · ${i.disco}` : "Electricity",
        highlight: present(i.token)
            ? { kind: "token", label: "Electricity token", value: groupByFour(i.token), footnote: present(i.units) ? i.units.trim() : undefined }
            : null,
        rows: compact([
            row("Meter number", i.meterNumber, { mono: true }),
            row("Meter type", i.meterType ? i.meterType.replace(/^./, (c) => c.toUpperCase()) : null),
            row("Customer name", titleCase(i.customerName)),
            row("Address", i.customerAddress),
            row("Tariff", i.tariff),
            row("Provider reference", i.providerTransactionId, { mono: true }),
            ...(money.length > 1 ? money : []),
        ]),
        helpLine: help("Token not loading?", email(i), " with the reference above."),
    });
}

function buildAirtime(i: AirtimeInput): ReceiptConfig {
    const phone = formatPhone(i.phone);

    return shell(i, {
        kind: "AIRTIME",
        headerLabel: "Airtime receipt",
        heroLine: i.network ? `Airtime · ${i.network}` : "Airtime",
        highlight: phone ? { kind: "phone", label: "Recharged number", value: phone, trailing: i.network ?? undefined } : null,
        rows: compact([
            row("Network", i.network),
            ...moneyRows({ currency: "NGN", amountLabel: "Airtime value", face: i.faceAmount, discount: i.discount, fee: i.fee, paid: i.amount }),
        ]),
        helpLine: help("Airtime not received?", email(i), " with the reference above."),
    });
}

function buildData(i: DataInput): ReceiptConfig {
    const phone = formatPhone(i.phone);
    const plan = present(i.bundle) ? parsePlanLabel(i.bundle) : null;
    const hasTiles = !!plan && /\d(MB|GB|TB)$/i.test(plan.title) && !!plan.validity;

    return shell(i, {
        kind: "DATA",
        headerLabel: "Data receipt",
        heroLine: i.network ? `Data · ${i.network}` : "Data",
        highlight: hasTiles
            ? {
                  kind: "tiles",
                  tiles: [
                      { label: "Data plan", value: plan!.title.replace(/(\d)(MB|GB|TB)/i, "$1 $2"), tone: "violet" },
                      { label: "Valid for", value: plan!.validity, tone: "tint" },
                  ],
              }
            : null,
        rows: compact([
            row("Phone number", phone, { mono: true }),
            row("Network", i.network),
            row("Bundle", i.bundle),
            ...moneyRows({ currency: "NGN", amountLabel: "Amount", face: i.faceAmount, discount: i.discount, fee: i.fee, paid: i.amount }).slice(
                i.discount || (i.fee ?? 0) > 0 ? 0 : 1,
            ),
        ]),
        helpLine: help("Data not received?", email(i), " with the reference above."),
    });
}

function buildEducation(i: EducationInput): ReceiptConfig {
    return shell(i, {
        kind: "EDUCATION",
        headerLabel: "Education receipt",
        heroLine: i.examBody ? `Education · ${i.examBody}` : "Education",
        highlight: present(i.pin)
            ? { kind: "token", label: "Exam PIN", value: groupByFour(i.pin), extra: present(i.serial) ? { label: "Serial number", value: i.serial.trim() } : undefined }
            : null,
        rows: compact([
            row("Service", i.service),
            row("Quantity", i.quantity ? String(i.quantity) : null),
            row("Phone number", formatPhone(i.phone), { mono: true }),
            ...moneyRows({ currency: "NGN", amountLabel: "Amount", face: i.faceAmount, discount: i.discount, fee: i.fee, paid: i.amount }).slice(
                i.discount || (i.fee ?? 0) > 0 ? 0 : 1,
            ),
        ]),
        helpLine: help("Keep your exam PIN private until you use it. Need help?", email(i), "."),
    });
}

function buildCable(i: CableInput): ReceiptConfig {
    const renewal = [present(i.period) ? `Renewed for ${i.period.trim()}` : null, present(i.until) ? `until ${i.until.trim()}` : null].filter(present).join(" · ");

    return shell(i, {
        kind: "CABLE",
        headerLabel: "Cable TV receipt",
        heroLine: i.provider ? `Cable TV · ${i.provider}` : "Cable TV",
        highlight: present(i.packageName) ? { kind: "package", title: i.packageName.trim(), subtitle: renewal || undefined } : null,
        rows: compact([
            row("Smartcard / IUC number", i.smartcard, { mono: true }),
            row("Customer name", titleCase(i.customerName)),
            row("Provider", i.provider),
            ...moneyRows({ currency: "NGN", amountLabel: "Amount", face: i.faceAmount, discount: i.discount, fee: i.fee, paid: i.amount }).slice(
                i.discount || (i.fee ?? 0) > 0 ? 0 : 1,
            ),
        ]),
        helpLine: `Channels not showing? Keep your decoder on for a few minutes, or contact NePay Support at ${email(i)}.`,
    });
}

function buildCrypto(i: CryptoInput): ReceiptConfig {
    const sold = present(i.coinAmount) && present(i.coin) ? `${i.coinAmount.trim()} ${i.coin.trim().toUpperCase()}` : null;

    return shell(i, {
        kind: "CRYPTO",
        headerLabel: "Exchange receipt",
        heroLine: "Crypto to Naira · credited to wallet",
        highlight: sold
            ? {
                  kind: "tiles",
                  tiles: [
                      { label: "You sold", value: sold, tone: "panel" },
                      { label: "You received", value: formatMoney(i.amount, "NGN"), tone: "violet" },
                  ],
              }
            : null,
        rows: compact([
            row("Rate", i.rate ? `${formatMoney(i.rate, "NGN")} per ${present(i.coin) ? i.coin.trim().toUpperCase() : "coin"}` : null),
            row("Network", i.network),
            row("Credited to", "NePay Naira wallet"),
            row("Fee", i.fee !== null && i.fee !== undefined ? formatMoney(i.fee, "NGN") : null),
        ]),
        references: compact<ReceiptReference>([present(i.txHash) ? { label: "Transaction hash", value: i.txHash.trim(), long: true } : null]),
        signOff: { lead: "Crypto in. ", accent: "Naira out." },
        helpLine: help("Questions about this exchange?", email(i)),
    });
}

function buildGiftCard(i: GiftCardInput): ReceiptConfig {
    const many = (i.quantity ?? 1) > 1;
    const sold = present(i.brand) ? `${many ? `${i.quantity} × ` : ""}${i.brand.trim()}${i.valueUsd ? ` ${formatMoney(i.valueUsd, "USD")}` : ""}` : null;

    return shell(i, {
        kind: "GIFTCARD",
        headerLabel: "Gift card receipt",
        heroLine: "Gift card sold · credited to wallet",
        highlight: sold
            ? {
                  kind: "tiles",
                  tiles: [
                      { label: "You sold", value: sold, tone: "panel" },
                      { label: "You received", value: formatMoney(i.amount, "NGN"), tone: "violet" },
                  ],
              }
            : null,
        rows: compact([
            row("Card", [i.brand, i.country].filter(present).join(" · ")),
            row("Card type", i.cardType),
            row("Quantity", many ? String(i.quantity) : null),
            row("Rate", i.rate ? `${formatMoney(i.rate, "NGN")} per $1` : null),
            row("Credited to", "NePay Naira wallet"),
            row("Fee", i.fee !== null && i.fee !== undefined ? formatMoney(i.fee, "NGN") : null),
        ]),
        signOff: { lead: "Unused cards, ", accent: "real Naira." },
        helpLine: help("Questions about this trade?", email(i)),
    });
}

function buildForeignDeposit(i: ForeignDepositInput): ReceiptConfig {
    const cur = i.foreignCurrency;
    const sender = titleCase(i.senderName);
    const to = `NePay ${cur} account`;

    return shell(i, {
        kind: "FOREIGN_DEPOSIT",
        headerLabel: "Deposit receipt",
        heroLine: `Received into your ${cur} account`,
        statusLabel: i.statusLabel ?? (i.tone === "success" ? "Received" : undefined),
        highlight: sender
            ? { kind: "transfer", from: { name: sender, sub: i.senderCountry ?? undefined }, to: { name: to, sub: lastFour(i.accountLast4) || undefined } }
            : null,
        rows: compact([
            row("Sending institution", i.institution),
            row("Transfer method", i.paymentMethod),
            row("Amount sent", formatMoney(i.amount, cur)),
            row("Exchange rate", i.rate ? `1 ${cur} = ${formatMoney(i.rate, "NGN")}` : null),
            row("Converted to", i.convertedNgn ? formatMoney(i.convertedNgn, "NGN") : null),
            row("Conversion fee", i.conversionFeeNgn !== null && i.conversionFeeNgn !== undefined ? formatMoney(i.conversionFeeNgn, "NGN") : null),
            row("Amount credited", i.creditedNgn ? formatMoney(i.creditedNgn, "NGN") : null, { emphasis: "total" }),
        ]),
        references: compact<ReceiptReference>([present(i.senderReference) ? { label: "Sender reference", value: i.senderReference.trim(), long: true } : null]),
        signOff: { lead: "Get paid ", accent: "from anywhere." },
        helpLine: help("Questions about this deposit?", email(i)),
    });
}

function buildFlight(i: FlightInput): ReceiptConfig {
    const hasRoute = !!i.from?.code && !!i.to?.code;
    const passenger = present(i.passenger) ? `${titleCase(i.passenger)}${i.extraPassengers ? ` +${i.extraPassengers}` : ""}` : null;

    return shell(i, {
        kind: "FLIGHT",
        headerLabel: "Flight receipt",
        detailsTitle: "Booking details",
        statusLabel: i.statusLabel ?? (i.tone === "success" ? "Booked" : undefined),
        heroLine: i.airline ? `Flight · ${i.airline}` : "Flight",
        dateLinePrefix: "Paid ",
        highlight: hasRoute
            ? {
                  kind: "route",
                  from: { code: i.from!.code.toUpperCase(), city: i.from!.city ?? undefined },
                  to: { code: i.to!.code.toUpperCase(), city: i.to!.city ?? undefined },
                  duration: i.duration ?? undefined,
                  departs: i.departs ? `Departs ${i.departs}` : undefined,
                  flightNo: i.flightNo ?? undefined,
              }
            : null,
        rows: compact([
            row("Booking reference (PNR)", i.pnr, { mono: true, emphasis: "royal" }),
            row("Passenger", passenger),
            row("Trip · Class", [i.trip, i.cabin].filter(present).join(" · ")),
            row("Fee", i.fee !== null && i.fee !== undefined ? formatMoney(i.fee, "NGN") : null),
        ]),
        helpLine: `This is a payment receipt, not a boarding pass. Check in with ${i.airline ?? "your airline"} before you fly.`,
    });
}

function buildGeneric(i: GenericInput): ReceiptConfig {
    const showDescription = present(i.description) && i.description.trim().toLowerCase() !== i.typeLabel.trim().toLowerCase();

    return shell(i, {
        kind: "GENERIC",
        headerLabel: "Transaction receipt",
        heroLine: i.typeLabel,
        rows: compact([
            row("Type", i.typeLabel),
            row("Details", showDescription ? i.description : null),
            ...(i.fee && i.fee > 0 ? moneyRows({ currency: i.currency ?? "NGN", amountLabel: "Amount", paid: i.amount, fee: i.fee, totalLabel: i.credit ? "Total credited" : "Total debited" }) : []),
        ]),
        helpLine: help("Questions about this transaction?", email(i)),
    });
}

/** The one entry point: facts in, a ReceiptConfig out. */
/**
 * The same transaction, as it should look once it leaves the app (a saved image, a PDF, a text share,
 * an emailed copy). In the app a customer sees the whole picture - the fee, the total debited, the
 * discount they got. Anything that goes out shows only the exact amount that moved between the two
 * parties: a ₦2,000 transfer that cost ₦2,010 reads ₦2,000, and ₦1,000 of airtime bought for ₦980
 * reads ₦1,000. Fees, totals and discounts never leave the app.
 */
export function shareable<T extends ReceiptInput>(input: T): T {
    const out: Record<string, unknown> = { ...input, share: true, fee: null };

    if ("faceAmount" in input && input.faceAmount !== null && input.faceAmount !== undefined) {
        out.amount = input.faceAmount;
        out.faceAmount = null;
        out.discount = null;
    }

    if (input.kind === "FOREIGN_DEPOSIT") {
        // The gross figure beside the net one would give the fee away.
        out.conversionFeeNgn = null;
        out.convertedNgn = null;
    }

    return out as unknown as T;
}

export function buildReceiptConfig(input: ReceiptInput): ReceiptConfig {
    switch (input.kind) {
        case "TRANSFER":
            return buildTransfer(input);
        case "DEPOSIT":
            return buildDeposit(input);
        case "ELECTRICITY":
            return buildElectricity(input);
        case "AIRTIME":
            return buildAirtime(input);
        case "DATA":
            return buildData(input);
        case "EDUCATION":
            return buildEducation(input);
        case "CABLE":
            return buildCable(input);
        case "CRYPTO":
            return buildCrypto(input);
        case "GIFTCARD":
            return buildGiftCard(input);
        case "FOREIGN_DEPOSIT":
            return buildForeignDeposit(input);
        case "FLIGHT":
            return buildFlight(input);
        default:
            return buildGeneric(input);
    }
}

/** A plain text version of any receipt, for "share as text". */
export function receiptToText(c: ReceiptConfig): string {
    const lines = [
        "NePay " + c.headerLabel,
        `${c.amount}  ${c.statusLabel}`,
        c.heroLine,
        c.dateLine,
        "",
        ...c.rows.map((r) => `${r.label}: ${r.value}`),
        "",
        ...c.references.map((r) => `${r.label}: ${r.value}`),
        "",
        `${c.signOff.lead}${c.signOff.accent}`,
        "nepay.com.ng",
    ];
    return lines.filter((l, idx, arr) => !(l === "" && arr[idx - 1] === "")).join("\n");
}
