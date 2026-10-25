/**
 * What a NePay receipt says, per kind of transaction — in the order it is read.
 *
 * Pure and dependency-free on purpose: this exact file is mirrored in the mobile
 * app (src/lib/receipt-model.ts) so both apps print the same lines in the same
 * order. Keep them in sync. Rendering (web HTML, mobile views, emailed PDF) lives
 * elsewhere; this file only decides WHAT is shown.
 *
 * Rule for every builder: a line is included only when there is a real value for it.
 * Nothing is invented — no narration when the sender wrote none, no session ID
 * when the bank rails issued none.
 */

export interface ReceiptRow {
    label: string;
    /** The main text (a name, a number, a type). */
    value: string;
    /** A second line under the value ("Zenith Bank | 105****311", "MTN"). */
    sub?: string;
    /** Draw the value in a monospaced face — IDs, references, tokens. */
    mono?: boolean;
}

const present = (v: string | null | undefined): v is string => !!v && v.trim().length > 0;

/** Keeps a row only if it has something to say. */
function row(label: string, value: string | null | undefined, extra: Partial<ReceiptRow> = {}): ReceiptRow | null {
    return present(value) ? { label, value: value.trim(), ...extra } : null;
}

const compact = (rows: (ReceiptRow | null)[]): ReceiptRow[] => rows.filter((r): r is ReceiptRow => r !== null);

/** "1050224311" -> "105****311". Used for anything that arrives unmasked; never shows a whole account number. */
export function maskAccount(accountNumber: string): string {
    const digits = accountNumber.trim();
    if (digits.length <= 6) return digits.replace(/./g, "*");
    return `${digits.slice(0, 3)}${"*".repeat(Math.max(digits.length - 6, 4))}${digits.slice(-3)}`;
}

// ─── Withdrawal / transfer to a bank account ─────────────────────────────────────────

export interface WithdrawalReceiptInput {
    recipientName: string;
    bankName?: string | null;
    /** Already masked ("105****311") — as the server sends it. */
    accountNumberMasked: string;
    senderName: string;
    narration?: string | null;
    sessionId?: string | null;
    /** NePay's own id for this transaction. */
    transactionId: string;
    /** The transfer reference. */
    reference: string;
    isRefund?: boolean;
}

/**
 * Recipient details, sender details, type, [narration], transaction ID, [session ID], reference —
 * in exactly that order. The recipient's account sits under their name as "Bank | masked number".
 */
export function withdrawalRows(d: WithdrawalReceiptInput): ReceiptRow[] {
    const bankLine = [d.bankName, d.accountNumberMasked].filter(present).join(" | ");

    return compact([
        row("Recipient Details", d.recipientName, { sub: bankLine || undefined }),
        row("Sender Details", d.senderName),
        row("Transaction Type", d.isRefund ? "Withdrawal Refund" : "Withdrawal"),
        row("Narration", d.narration),
        row("Transaction ID", d.transactionId, { mono: true }),
        row("Session ID", d.sessionId, { mono: true }),
        row("Transaction Reference", d.reference, { mono: true }),
    ]);
}

// ─── Utilities ─────────────────────────────────────────────────────────────────────────

export type UtilityKind = "AIRTIME" | "DATA" | "ELECTRICITY" | "CABLE" | "EDUCATION";

export interface UtilityReceiptInput {
    kind: UtilityKind;
    transactionId: string;
    /** VTpass's / the purchase's own reference. */
    reference?: string | null;
    /** Phone number, meter number or smartcard number the purchase was for. */
    identifier?: string | null;
    /** The network / disco / TV provider's name ("MTN", "Ikeja Electric"). */
    providerName?: string | null;
    /** The registered customer's name where VTpass verified one (meter, smartcard). */
    customerName?: string | null;
    customerAddress?: string | null;
    /** Data bundle, TV bouquet or exam PIN type, by name. */
    planName?: string | null;
    meterType?: string | null;
    tariff?: string | null;
    units?: string | null;
    providerTransactionId?: string | null;
    /** The electricity token or exam PIN — shown in its own copyable block by the screens, kept here for text/PDF shares. */
    token?: string | null;
}

const KIND_TYPE_LABEL: Record<UtilityKind, string> = {
    AIRTIME: "Airtime Purchase",
    DATA: "Data Purchase",
    ELECTRICITY: "Electricity Purchase",
    CABLE: "Cable TV Subscription",
    EDUCATION: "Exam PIN Purchase",
};

const titleCase = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** "Recipient Details" first (who/what was paid for), then what was bought, then the IDs. */
export function utilityRows(d: UtilityReceiptInput): ReceiptRow[] {
    const recipient = (() => {
        switch (d.kind) {
            case "AIRTIME":
            case "DATA":
                return row("Recipient Details", d.identifier, { sub: d.providerName ?? undefined, mono: true });
            case "ELECTRICITY":
                return row("Recipient Details", d.customerName ?? d.identifier, {
                    sub: [d.providerName, d.customerName ? d.identifier : null].filter(present).join(" | ") || undefined,
                });
            case "CABLE":
                return row("Recipient Details", d.customerName ?? d.identifier, {
                    sub: [d.providerName, d.customerName ? d.identifier : null].filter(present).join(" | ") || undefined,
                });
            case "EDUCATION":
                return row("Service", d.providerName);
        }
    })();

    return compact([
        recipient,
        row("Address", d.kind === "ELECTRICITY" ? d.customerAddress : null),
        row("Plan", d.kind === "DATA" || d.kind === "CABLE" || d.kind === "EDUCATION" ? d.planName : null),
        row("Meter Type", d.kind === "ELECTRICITY" && d.meterType ? titleCase(d.meterType) : null),
        row("Tariff", d.kind === "ELECTRICITY" ? d.tariff : null),
        row("Units", d.kind === "ELECTRICITY" ? d.units : null),
        row("Transaction Type", KIND_TYPE_LABEL[d.kind]),
        row("Transaction ID", d.transactionId, { mono: true }),
        row("Provider Transaction ID", d.providerTransactionId, { mono: true }),
        row("Transaction Reference", d.reference, { mono: true }),
        row(d.kind === "EDUCATION" ? "PIN" : "Token", d.token, { mono: true }),
    ]);
}

// ─── Naira bank deposit (money in to the customer's NePay account) ───────────────────────

export interface BankDepositReceiptInput {
    senderName?: string | null;
    senderBankName?: string | null;
    /** Already masked ("105****311"). */
    senderAccountMasked?: string | null;
    narration?: string | null;
    sessionId?: string | null;
    recipientName: string;
    recipientBankName?: string | null;
    recipientAccountMasked?: string | null;
    transactionId: string;
    reference: string;
}

/**
 * Same order as a withdrawal — Recipient Details, Sender Details, type, [narration], IDs — so every
 * bank-to-bank receipt reads the same way. Sender lines appear only when the bank told us who sent it
 * (deposits that predate sender capture simply have no Sender Details line).
 */
export function bankDepositRows(d: BankDepositReceiptInput): ReceiptRow[] {
    const recipientLine = [d.recipientBankName, d.recipientAccountMasked].filter(present).join(" | ");
    const senderLine = [d.senderBankName, d.senderAccountMasked].filter(present).join(" | ");

    return compact([
        row("Recipient Details", d.recipientName, { sub: recipientLine || undefined }),
        present(d.senderName)
            ? row("Sender Details", d.senderName, { sub: senderLine || undefined })
            : row("Sender Details", senderLine),
        row("Transaction Type", "Bank Deposit"),
        row("Narration", d.narration),
        row("Transaction ID", d.transactionId, { mono: true }),
        row("Session ID", d.sessionId, { mono: true }),
        row("Transaction Reference", d.reference, { mono: true }),
    ]);
}

// ─── Foreign (USD / EUR / GBP) account deposit, converted to naira ──────────────────────

export interface ForeignDepositReceiptInput {
    senderName?: string | null;
    /** "ACH", "Wire", "SEPA", "Faster Payments"… */
    paymentRail?: string | null;
    narration?: string | null;
    sourceCurrency: string;
    sourceAmount?: string | null;
    usdAmount?: string | null;
    /** Naira per US dollar at conversion. */
    rateUsed?: string | null;
    recipientName: string;
    transactionId: string;
    reference: string;
}

const money = (value: string | null | undefined): string | null => {
    const n = Number(value);
    return value !== null && value !== undefined && value !== "" && Number.isFinite(n)
        ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : null;
};

/**
 * Who it came from and how it was converted: amount sent in its own currency, the USD value, and the
 * rate. Shown as "NGN" text (not the ₦ glyph) so the emailed PDF's built-in font prints it too.
 * The conversion fee is deliberately not a line here — like every receipt, fees stay on the in-app view.
 */
export function foreignDepositRows(d: ForeignDepositReceiptInput): ReceiptRow[] {
    const currency = d.sourceCurrency.toUpperCase();
    const sent = money(d.sourceAmount);
    const usd = money(d.usdAmount);
    const rate = money(d.rateUsed);

    return compact([
        row("Recipient Details", d.recipientName, { sub: `NePay ${currency} Account` }),
        row("Sender Details", d.senderName, { sub: d.paymentRail ?? undefined }),
        row("Amount Sent", sent ? `${sent} ${currency}` : null),
        row("USD Value", currency !== "USD" && usd ? `${usd} USD` : null),
        row("Exchange Rate", rate ? `1 USD = NGN ${rate}` : null),
        row("Transaction Type", "Foreign Currency Deposit"),
        row("Narration", d.narration),
        row("Transaction ID", d.transactionId, { mono: true }),
        row("Transaction Reference", d.reference, { mono: true }),
    ]);
}

// ─── Everything else (deposits, gift cards, flights, rewards, adjustments…) ──────────────────

export interface GenericReceiptInput {
    typeLabel: string;
    transactionId: string;
    /** What the ledger recorded ("Gift card sale: 1x Amazon $50"). Shown only when it adds something beyond the type. */
    description?: string | null;
    reference?: string | null;
    /** Crypto deposit extras. */
    cryptoAmount?: string | null;
    cryptoAsset?: string | null;
    exchangeRate?: string | null;
}

export function genericRows(d: GenericReceiptInput): ReceiptRow[] {
    const showDescription = present(d.description) && d.description.trim().toLowerCase() !== d.typeLabel.trim().toLowerCase();

    return compact([
        row("Details", showDescription ? d.description : null),
        d.cryptoAmount && d.cryptoAsset ? row("Crypto Received", `${d.cryptoAmount} ${d.cryptoAsset}`) : null,
        row("Exchange Rate", d.exchangeRate),
        row("Transaction Type", d.typeLabel),
        row("Transaction ID", d.transactionId, { mono: true }),
        row("Transaction Reference", d.reference, { mono: true }),
    ]);
}

// ─── The receipt's visual code ─────────────────────────────────────────────────────────────────

/**
 * A short bar pattern derived from the transaction id — the receipt's "NePay code".
 * Deterministic (same id, same bars, on web, mobile and the emailed PDF), so it works
 * as a quiet signature that is unique to the transaction and recognisably NePay.
 * It is decoration, not a scannable barcode, and carries no data.
 */
export function receiptCode(seed: string, bars = 44): number[] {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    const out: number[] = [];
    for (let i = 0; i < bars; i++) {
        h ^= h << 13;
        h >>>= 0;
        h ^= h >>> 17;
        h ^= h << 5;
        h >>>= 0;
        out.push((h % 3) + 1); // bar width 1..3
    }
    return out;
}

export const RECEIPT_STATUS_LABEL = { success: "Successful", pending: "Pending", failed: "Failed" } as const;
export type ReceiptStatus = keyof typeof RECEIPT_STATUS_LABEL;
