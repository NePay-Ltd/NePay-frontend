"use client";

import * as React from "react";
import { format } from "date-fns";
import { X, Copy, Check, Download, Share2, ChevronDown, AlertTriangle, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { TxIcon, type TxCategory } from "./tx-icon";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";
import { downloadReceipt, shareReceipt, downloadReceiptPDF, downloadReceiptImage, shareReceiptImage, type ReceiptData } from "@/lib/receipt-utils";

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
}

interface TransactionDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: TransactionDetailData | null;
    onViewFullDetail?: (transactionId: string) => void;
}

type StatusKey = "success" | "pending" | "failed";

const STATUS_CONFIG: Record<StatusKey, {
    label: string;
    statusLine: string;
    icon: React.ElementType;
    /** Outermost faint glow ring */
    outerRing: string;
    /** Middle semi-transparent ring */
    midRing: string;
    /** Inner solid filled circle */
    innerCircle: string;
    /** Icon color inside the circle */
    iconColor: string;
    amountColor: string;
}> = {
    success: {
        label: "Completed",
        statusLine: "Transaction Successful",
        icon: Check,
        outerRing: "bg-green-500/10",
        midRing: "bg-green-500/20",
        innerCircle: "bg-green-500",
        iconColor: "text-trueWhite",
        amountColor: "text-ink dark:text-trueWhite",
    },
    pending: {
        label: "Pending",
        statusLine: "Transaction Pending",
        icon: Clock,
        outerRing: "bg-amber-500/10",
        midRing: "bg-amber-500/20",
        innerCircle: "bg-amber-500",
        iconColor: "text-trueWhite",
        amountColor: "text-ink dark:text-trueWhite",
    },
    failed: {
        label: "Failed",
        statusLine: "Transaction Failed",
        icon: AlertTriangle,
        outerRing: "bg-red-500/10",
        midRing: "bg-red-500/20",
        innerCircle: "bg-red-500",
        iconColor: "text-trueWhite",
        amountColor: "text-ink dark:text-trueWhite",
    },
};

export function TransactionDetailModal({
    open,
    onOpenChange,
    transaction,
    onViewFullDetail,
}: TransactionDetailModalProps) {
    const [copied, setCopied] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [isSharing, setIsSharing] = React.useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);
    const [showShareMenu, setShowShareMenu] = React.useState(false);

    const handleCopyId = () => {
        if (transaction?.id) {
            navigator.clipboard.writeText(transaction.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getReceiptData = (): ReceiptData => {
        if (!transaction) throw new Error("No transaction data");
        return {
            id: transaction.id,
            label: transaction.label,
            amount: transaction.amount,
            status: transaction.status,
            date: transaction.date,
            type: transaction.type,
            direction: transaction.direction,
            currency: transaction.currency,
            meta: transaction.meta,
        };
    };

    const handleDownloadHTML = async () => {
        if (!transaction) return;
        setIsDownloading(true);
        try { await downloadReceipt(getReceiptData()); }
        finally { setIsDownloading(false); setShowDownloadMenu(false); }
    };
    const handleDownloadPDF = async () => {
        if (!transaction) return;
        setIsDownloading(true);
        try { await downloadReceiptPDF(getReceiptData()); }
        finally { setIsDownloading(false); setShowDownloadMenu(false); }
    };
    const handleDownloadImage = async () => {
        if (!transaction) return;
        setIsDownloading(true);
        try { await downloadReceiptImage(getReceiptData()); }
        finally { setIsDownloading(false); setShowDownloadMenu(false); }
    };
    const handleShareText = async () => {
        if (!transaction) return;
        setIsSharing(true);
        try { await shareReceipt(getReceiptData()); }
        finally { setIsSharing(false); setShowShareMenu(false); }
    };
    const handleShareImage = async () => {
        if (!transaction) return;
        setIsSharing(true);
        try { await shareReceiptImage(getReceiptData()); }
        finally { setIsSharing(false); setShowShareMenu(false); }
    };

    if (!transaction) return null;

    const isCredit = transaction.amount > 0;
    const cfg = STATUS_CONFIG[transaction.status];
    const StatusIcon = cfg.icon;
    const absAmount = formatNaira(Math.abs(transaction.amount));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                hideCloseButton
                className="w-full max-w-sm p-0 overflow-hidden bg-white dark:bg-[#1C1C1E] border border-border sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl shadow-xl
                    fixed sm:top-1/2 bottom-0 sm:bottom-auto left-1/2 -translate-x-1/2 sm:-translate-y-1/2 translate-y-0 sm:translate-y-[-50%]
                    max-h-[92dvh] flex flex-col"
            >
                {/* ── Close button ── */}
                <DialogClose className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-muted hover:bg-gray-100 dark:hover:bg-trueWhite/10 transition-colors focus:outline-none">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>

                <div className="px-5 pb-6 pt-7 sm:px-6 sm:pb-8 sm:pt-8 flex flex-col items-center text-center overflow-y-auto">
                    {/* ── Status icon — double-ring glow ── */}
                    <div className={cn("flex h-24 w-24 items-center justify-center rounded-full mb-5", cfg.outerRing)}>
                        <div className={cn("flex h-[72px] w-[72px] items-center justify-center rounded-full", cfg.midRing)}>
                            <div className={cn("flex h-14 w-14 items-center justify-center rounded-full shadow-lg", cfg.innerCircle)}>
                                <StatusIcon className={cn("h-7 w-7", cfg.iconColor)} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* ── Status label ── */}
                    <p className="text-sm font-semibold text-muted mb-1">{cfg.statusLine}</p>

                    {/* ── Amount ── */}
                    <p className={cn("text-3xl font-bold tabular-nums mb-1", cfg.amountColor)}>
                        {isCredit ? "+" : "−"}{absAmount}
                    </p>

                    {/* ── Description ── */}
                    <p className="text-xs text-muted truncate max-w-[240px]">{transaction.label}</p>

                    {/* ── Divider ── */}
                    <div className="w-full border-t border-dashed border-border my-5" />

                    {/* ── Details rows ── */}
                    <div className="w-full space-y-3.5 text-left">
                        <ReceiptRow label="Transaction ID">
                            <div className="flex items-center gap-1.5">
                                <code className="text-xs font-mono text-ink dark:text-trueWhite">
                                    {transaction.id.slice(0, 10)}...{transaction.id.slice(-4)}
                                </code>
                                <button
                                    onClick={handleCopyId}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-trueWhite/10 transition-colors"
                                    title="Copy ID"
                                >
                                    {copied
                                        ? <Check className="h-3.5 w-3.5 text-green-500" />
                                        : <Copy className="h-3.5 w-3.5 text-muted" />
                                    }
                                </button>
                            </div>
                        </ReceiptRow>

                        <ReceiptRow label="Type">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                                {transaction.type.replace(/_/g, " ")}
                            </span>
                        </ReceiptRow>

                        <ReceiptRow label="Direction">
                            <span className={cn(
                                "flex items-center gap-1 text-xs font-semibold",
                                isCredit ? "text-green-600" : "text-red-500"
                            )}>
                                {isCredit
                                    ? <ArrowDownLeft className="h-3.5 w-3.5" />
                                    : <ArrowUpRight className="h-3.5 w-3.5" />
                                }
                                {transaction.direction === "CREDIT" ? "Received" : "Sent"}
                            </span>
                        </ReceiptRow>

                        <ReceiptRow label="Currency">
                            <span className="text-sm font-semibold text-ink dark:text-trueWhite">{transaction.currency}</span>
                        </ReceiptRow>

                        {transaction.cryptoAmount && transaction.cryptoAsset && (
                            <ReceiptRow label="Crypto received">
                                <span className="text-sm font-semibold text-ink dark:text-trueWhite">
                                    {transaction.cryptoAmount} {transaction.cryptoAsset}
                                </span>
                            </ReceiptRow>
                        )}

                        <ReceiptRow label="Date & Time">
                            <span className="text-sm font-semibold text-ink dark:text-trueWhite">
                                {transaction.date
                                    ? format(new Date(transaction.date), "d MMM yyyy, h:mm a")
                                    : "—"}
                            </span>
                        </ReceiptRow>
                    </div>

                    {/* ── Divider ── */}
                    <div className="w-full border-t border-border my-5" />

                    {/* ── View Full Receipt ── */}
                    <button
                        onClick={() => {
                            onViewFullDetail?.(transaction.id);
                            onOpenChange(false);
                        }}
                        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-trueWhite font-semibold text-sm transition-all mb-3"
                    >
                        View Full Receipt
                    </button>

                    {/* ── Download + Share side by side ── */}
                    <div className="w-full grid grid-cols-2 gap-3">
                        {/* Download dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowDownloadMenu(!showDownloadMenu); setShowShareMenu(false); }}
                                disabled={isDownloading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold text-ink dark:text-trueWhite hover:bg-gray-50 dark:hover:bg-trueWhite/10 transition-colors disabled:opacity-60"
                            >
                                <Download className="h-4 w-4" />
                                {isDownloading ? "..." : "Download"}
                            </button>
                            {showDownloadMenu && (
                                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-[#2C2C2E] border border-border rounded-xl shadow-xl z-50 overflow-hidden text-left">
                                    {[
                                        { label: "As HTML", action: handleDownloadHTML },
                                        { label: "As PDF", action: handleDownloadPDF },
                                        { label: "As Image (PNG)", action: handleDownloadImage },
                                    ].map((item, i, arr) => (
                                        <button
                                            key={item.label}
                                            onClick={item.action}
                                            disabled={isDownloading}
                                            className={cn(
                                                "w-full px-3 py-2.5 text-sm text-ink dark:text-trueWhite hover:bg-gray-50 dark:hover:bg-trueWhite/10 disabled:opacity-50 transition-colors",
                                                i < arr.length - 1 && "border-b border-border"
                                            )}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Share dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowShareMenu(!showShareMenu); setShowDownloadMenu(false); }}
                                disabled={isSharing}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold text-ink dark:text-trueWhite hover:bg-gray-50 dark:hover:bg-trueWhite/10 transition-colors disabled:opacity-60"
                            >
                                <Share2 className="h-4 w-4" />
                                {isSharing ? "..." : "Share"}
                            </button>
                            {showShareMenu && (
                                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-[#1C1C1E] border border-border rounded-xl shadow-xl z-50 overflow-hidden text-left">
                                    {[
                                        { label: "As Text", action: handleShareText },
                                        { label: "As Image", action: handleShareImage },
                                    ].map((item, i, arr) => (
                                        <button
                                            key={item.label}
                                            onClick={item.action}
                                            disabled={isSharing}
                                            className={cn(
                                                "w-full px-3 py-2.5 text-sm text-ink dark:text-trueWhite hover:bg-gray-50 dark:hover:bg-trueWhite/10 disabled:opacity-50 transition-colors",
                                                i < arr.length - 1 && "border-b border-border"
                                            )}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ReceiptRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{label}</span>
            <div>{children}</div>
        </div>
    );
}
