"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconClose as X, IconCopy as Copy } from "@/components/icons";
import { Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { useTransaction } from "@/lib/queries/transactions";
import { shareReceiptImage } from "@/lib/receipt-utils";
import { buildReceiptConfig, truncateMiddle, SUPPORT_EMAIL_DEFAULT, type ReceiptConfig, type ReceiptInput } from "@/lib/receipt-config";
import { highlightHtml, RECEIPT_CSS } from "@/lib/receipt-markup";
import type { TxCategory } from "./tx-icon";

export interface TransactionDetailData {
    id: string;
    label: string;
    meta: string;
    amount: number;
    category: TxCategory;
    status: "success" | "pending" | "failed";
    date?: string;
    type: string;
    direction: string;
    currency: string;
    cryptoAmount?: string;
    cryptoAsset?: string;
    exchangeRate?: string;
    fee?: number;
}

interface TransactionDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: TransactionDetailData | null;
    onViewFullDetail?: (transactionId: string) => void;
}

const TONE = {
    success: { bg: "#DCFCE7", fg: "#166534" },
    pending: { bg: "#FEF3C7", fg: "#92400E" },
    failed: { bg: "#FEE2E2", fg: "#991B1B" },
} as const;

/** What the sheet shows before the type's own detail has loaded (or if it can't): the ledger basics, in plain language. */
function basicsInput(t: TransactionDetailData): ReceiptInput {
    return {
        kind: "GENERIC",
        id: t.id,
        reference: t.id,
        tone: t.status,
        amount: Math.abs(t.amount),
        date: t.date,
        fee: t.fee ?? null,
        typeLabel: t.type,
        description: t.label,
        credit: t.amount > 0,
    };
}

/**
 * The condensed transaction summary: the same ReceiptConfig as the full receipt, shown as a
 * bottom sheet - highlight block, every receipt row, and the reference (truncated in the
 * middle, with a copy button). Plain language only; "View full receipt" opens the whole thing.
 */
export function TransactionDetailModal({ open, onOpenChange, transaction, onViewFullDetail }: TransactionDetailModalProps) {
    // The list row only has the basics; the type's own detail (recipient, sender, token...) is fetched when the sheet opens.
    const { data: fullTransaction } = useTransaction(open ? transaction?.id ?? null : null);
    const [isSharing, setIsSharing] = React.useState(false);

    // The sheet shows everything; "Share receipt" sends only the exact amount that moved (see receipt-utils).
    const input = React.useMemo<ReceiptInput | null>(() => {
        if (!transaction) return null;
        return fullTransaction?.receiptInput ?? basicsInput(transaction);
    }, [transaction, fullTransaction]);
    const config = React.useMemo<ReceiptConfig | null>(() => (input ? buildReceiptConfig(input) : null), [input]);

    if (!transaction || !config || !input) return null;

    const tone = TONE[config.tone];
    const reference = config.references[0]?.value ?? config.id;

    const copy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success("Copied");
        } catch {
            toast.error("Couldn't copy - select the text and copy it instead");
        }
    };

    const share = async () => {
        setIsSharing(true);
        try {
            await shareReceiptImage(input);
        } finally {
            setIsSharing(false);
        }
    };

    const reportHref = `mailto:${SUPPORT_EMAIL_DEFAULT}?subject=${encodeURIComponent(`Issue with transaction ${reference}`)}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                hideCloseButton
                className="w-full max-w-sm p-0 overflow-hidden bg-white dark:bg-[#1C1C1E] border border-border sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl shadow-xl
                    fixed sm:top-1/2 bottom-0 sm:bottom-auto left-1/2 -translate-x-1/2 sm:-translate-y-1/2 translate-y-0 sm:translate-y-[-50%]
                    max-h-[92dvh] flex flex-col"
            >
                <DialogClose className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-muted hover:bg-gray-100 dark:hover:bg-trueWhite/10 transition-colors focus:outline-none">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>

                {/* The summary is always the light NePay design, like the receipt it summarises. */}
                <div className="overflow-y-auto bg-white px-5 pb-6 pt-6 text-[#14092E] sm:px-6">
                    <style>{RECEIPT_CSS}</style>

                    <div className="flex items-center gap-2.5 pr-8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="NePay logo" className="h-[30px] w-[30px]" />
                        <span className="text-[18px] font-extrabold tracking-[-0.5px]">NePay</span>
                        <span className="ml-auto text-[10.5px] font-bold uppercase tracking-[1.6px] text-[#5B4F78]">{config.headerLabel}</span>
                    </div>

                    <div className="mt-5 flex flex-col items-center gap-2 text-center">
                        <span
                            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold"
                            style={{ background: tone.bg, color: tone.fg }}
                        >
                            <span className="h-2 w-2 rounded-full" style={{ background: tone.fg }} />
                            {config.statusLabel}
                        </span>
                        <p className="text-[34px] font-extrabold leading-[1.1] tracking-[-1.2px]">{config.amount}</p>
                        <p className="text-[14px] font-semibold text-[#3B2470]">{config.heroLine}</p>
                        {config.dateLine && <p className="font-mono text-[12px] text-[#5B4F78]">{config.dateLine}</p>}
                    </div>

                    {config.statusMessage && (
                        <div className="mt-4 rounded-[14px] px-4 py-3 text-left" style={{ background: tone.bg, color: tone.fg }}>
                            <p className="text-[14px] font-bold">{config.statusMessage.title}</p>
                            <p className="mt-1 text-[13px] leading-[1.5]">{config.statusMessage.body}</p>
                        </div>
                    )}

                    {config.highlight && (
                        <div
                            className="receipt rc-flat mt-4 text-center"
                            // Every value is escaped by the generator (lib/receipt-markup.ts).
                            dangerouslySetInnerHTML={{ __html: highlightHtml(config.highlight, false) }}
                        />
                    )}

                    {config.rows.length > 0 && (
                        <div className="mt-4 border-t border-dashed border-[#DCD3F7] pt-3">
                            <p className="pb-1 text-[11px] font-bold uppercase tracking-[1.6px] text-[#5B4F78]">{config.detailsTitle}</p>
                            {config.rows.map((r) => (
                                <div key={r.label} className="flex justify-between gap-4 border-b border-[#F0EBFA] py-2.5 text-[14px] last:border-b-0">
                                    <span className="shrink-0 text-[#5B4F78]">{r.label}</span>
                                    <span
                                        className={cn(
                                            "min-w-0 break-words text-right font-semibold",
                                            r.mono && "font-mono text-[13px]",
                                            r.emphasis === "royal" && "font-bold text-[#5B21B6]",
                                            r.emphasis === "total" && "font-extrabold",
                                        )}
                                    >
                                        {r.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {config.references.length > 0 && (
                        <div className="mt-3 space-y-2.5 rounded-[14px] bg-[#F8F6FC] px-4 py-3">
                            {config.references.map((r) => (
                                <div key={r.label} className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[10.5px] font-bold uppercase tracking-[1.6px] text-[#5B4F78]">{r.label}</p>
                                        <p className="truncate font-mono text-[13px]">{truncateMiddle(r.value)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => copy(r.value)}
                                        className="shrink-0 rounded-full bg-[#EEE7FF] p-2 text-[#5B21B6] transition-colors hover:bg-[#E2D6FF]"
                                        title={`Copy ${r.label.toLowerCase()}`}
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        <span className="sr-only">Copy {r.label}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-5 space-y-2.5">
                        <button
                            onClick={() => {
                                onViewFullDetail?.(transaction.id);
                                onOpenChange(false);
                            }}
                            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-trueWhite transition-all hover:bg-violet-700 active:scale-[0.98]"
                        >
                            View full receipt
                        </button>
                        <button
                            onClick={share}
                            disabled={isSharing}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DCD3F7] py-2.5 text-sm font-semibold text-[#14092E] transition-colors hover:bg-[#F8F6FC] disabled:opacity-60"
                        >
                            <Share2 className="h-4 w-4" />
                            {isSharing ? "Preparing..." : "Share receipt"}
                        </button>
                        <a
                            href={reportHref}
                            className="block w-full py-2 text-center text-[13px] font-semibold text-[#5B21B6] hover:underline"
                        >
                            Report an issue
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
