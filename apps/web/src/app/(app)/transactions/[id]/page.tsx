"use client";

import { CopyTokenButton } from "@/components/shared/copy-token-button";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDate, formatTime } from "@/lib/date";
import { IconArrowLeft as ArrowLeft, IconCopy as Copy, IconCheck as Check, IconChevronDown as ChevronDown } from "@/components/icons";
import { Download, Share2, Image } from "lucide-react";;
import { useTransaction } from "@/lib/queries/transactions";
import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { TxIcon } from "@/components/shared/tx-icon";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/shared/skeletons";
import { downloadReceipt, downloadReceiptPDF, downloadReceiptImage, shareReceipt, shareReceiptImage, getReceiptRows, type ReceiptData } from "@/lib/receipt-utils";

const MONO_LABELS = new Set(["Transaction Reference", "Provider Transaction ID", "Meter No"]);

function getCategoryColor(category: string) {
    switch (category) {
        case "deposit": return "bg-green-100 text-green-700";
        case "transfer": return "bg-red-100 text-red-700";
        case "payment": return "bg-blue-100 text-blue-700";
        case "gift-card": return "bg-purple-100 text-purple-700";
        case "flight": return "bg-amber-100 text-amber-700";
        default: return "bg-gray-100 text-gray-700";
    }
}

function getStatusColor(status: "success" | "pending" | "failed") {
    switch (status) {
        case "success": return "bg-green-50 text-green-700 border border-green-200";
        case "pending": return "bg-amber-50 text-amber-700 border border-amber-200";
        case "failed": return "bg-red-50 text-red-700 border border-red-200";
    }
}

function getStatusLabel(status: "success" | "pending" | "failed") {
    switch (status) {
        case "success": return "Completed";
        case "pending": return "Pending";
        case "failed": return "Failed";
    }
}

export default function TransactionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const transactionId = params.id as string;

    // Fetched directly by id — GET /wallet/transactions/:id — not searched
    // out of whatever page of the list happens to be cached, so this works
    // for any transaction the caller owns, not just the most recent ones.
    const { data: transaction, isLoading } = useTransaction(transactionId);
    const [copied, setCopied] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [isSharing, setIsSharing] = React.useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);
    const [showShareMenu, setShowShareMenu] = React.useState(false);

    const handleCopyId = () => {
        navigator.clipboard.writeText(transactionId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getReceiptData = (): ReceiptData => {
        if (!transaction) throw new Error("No transaction data");
        return {
            id: transaction.id,
            label: transaction.label,
            amount: transaction.amount,
            status: transaction.status,
            date: transaction.date,
            type: transaction.meta,
            direction: transaction.amount > 0 ? "CREDIT" : "DEBIT",
            currency: "NGN",
            meta: transaction.meta,
            utilityToken: transaction.utilityToken,
            utilityCustomerName: transaction.utilityCustomerName,
            utilityCustomerAddress: transaction.utilityCustomerAddress,
            utilityUnits: transaction.utilityUnits,
            utilityDisco: transaction.utilityDisco,
            utilityMeterNumber: transaction.utilityMeterNumber,
            utilityMeterType: transaction.utilityMeterType,
            utilityProviderTransactionId: transaction.utilityProviderTransactionId,
            utilityTariff: transaction.utilityTariff,
        };
    };

    const handleDownloadHTML = async () => {
        if (!transaction) return;
        setIsDownloading(true);
        try {
            await downloadReceipt(getReceiptData());
        } finally {
            setIsDownloading(false);
            setShowDownloadMenu(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!transaction) return;
        setIsDownloading(true);
        try {
            await downloadReceiptPDF(getReceiptData());
        } finally {
            setIsDownloading(false);
            setShowDownloadMenu(false);
        }
    };

    const handleDownloadImage = async () => {
        if (!transaction) return;
        setIsDownloading(true);
        try {
            await downloadReceiptImage(getReceiptData());
        } finally {
            setIsDownloading(false);
            setShowDownloadMenu(false);
        }
    };

    const handleShareText = async () => {
        if (!transaction) return;
        setIsSharing(true);
        try {
            await shareReceipt(getReceiptData());
        } finally {
            setIsSharing(false);
            setShowShareMenu(false);
        }
    };

    const handleShareImage = async () => {
        if (!transaction) return;
        setIsSharing(true);
        try {
            await shareReceiptImage(getReceiptData());
        } finally {
            setIsSharing(false);
            setShowShareMenu(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Panel>
                    <PanelBody>
                        <div className="space-y-6">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    </PanelBody>
                </Panel>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="mx-auto max-w-2xl space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <Panel>
                    <PanelBody>
                        <div className="py-12 text-center">
                            <p className="text-sm text-muted">Transaction not found</p>
                        </div>
                    </PanelBody>
                </Panel>
            </div>
        );
    }

    const isCredit = transaction.amount > 0;
    const amountClass = isCredit ? "text-green-600" : "text-red-600";

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Header */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Transactions
            </button>

            <Panel>
                <PanelBody className="space-y-8">
                    {/* Receipt header — logo left, title right (same layout as the downloaded receipt) */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo.png" alt="" className="h-8 w-auto" />
                            <span className="text-2xl font-extrabold tracking-tight text-ink">NePay</span>
                        </div>
                        <span className="text-sm text-muted">Transaction Receipt</span>
                    </div>

                    {/* Amount + status */}
                    <div className="text-center pt-2">
                        <p className={cn("text-3xl sm:text-4xl font-extrabold font-sans tabular-nums", amountClass)}>
                            {formatNaira(Math.abs(transaction.amount))}
                        </p>
                        {transaction.cryptoAmount && transaction.cryptoAsset && (
                            <p className="mt-1 text-sm font-semibold text-muted">
                                {transaction.cryptoAmount} {transaction.cryptoAsset}
                            </p>
                        )}
                        <p className="mt-3 text-lg font-semibold text-ink">
                            {transaction.status === "success" ? "Successful" : getStatusLabel(transaction.status)}
                        </p>
                        {transaction.date && (
                            <p className="mt-1 text-xs text-muted">
                                {formatDate(transaction.date)} {formatTime(transaction.date)}
                            </p>
                        )}
                    </div>

                    {/* Aligned label / value rows */}
                    <div className="border-t border-border pt-2 divide-y divide-transparent">
                        {getReceiptRows(getReceiptData()).filter(([label]) => label !== "Electricity Token").map(([label, value]) => (
                            <div key={label} className="flex items-start justify-between gap-6 py-3 text-sm">
                                <span className="shrink-0 text-muted">{label}</span>
                                <span className={cn("min-w-0 text-right font-semibold text-ink break-words", MONO_LABELS.has(label) && "font-mono text-[13px]")}>
                                    {value}
                                </span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between gap-6 py-3 text-sm">
                            <span className="text-muted">Copy reference</span>
                            <button
                                onClick={handleCopyId}
                                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition-colors"
                                title="Copy transaction reference"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Fee breakdown — bundled onto this receipt, shown here only. Never included in a downloaded/shared copy — see getReceiptData above. */}
                    {!!transaction.fee && (
                        <div className="border-t border-border pt-4 space-y-2.5 text-sm">
                            <div className="flex items-center justify-between gap-6">
                                <span className="text-muted">Amount</span>
                                <span className="font-semibold text-ink">{formatNaira(Math.abs(transaction.amount))}</span>
                            </div>
                            <div className="flex items-center justify-between gap-6">
                                <span className="text-muted">Fee</span>
                                <span className="font-semibold text-ink">{formatNaira(transaction.fee)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-6 border-t border-border pt-2.5">
                                <span className="text-muted">{isCredit ? "Net Received" : "Total Debited"}</span>
                                <span className={cn("font-bold", amountClass)}>
                                    {formatNaira(isCredit ? Math.abs(transaction.amount) - transaction.fee : Math.abs(transaction.amount) + transaction.fee)}
                                </span>
                            </div>
                        </div>
                    )}

                    {transaction.utilityToken && (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-500">Electricity Token</p>
                            <p className="mt-2 break-all font-mono text-xl font-bold tracking-widest text-ink">{transaction.utilityToken}</p>
                            <CopyTokenButton token={transaction.utilityToken} className="mt-3" />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-border">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:space-y-3">
                        {/* Download Dropdown */}
                        <div className="relative sm:col-span-1">
                            <Button 
                                variant="primary" 
                                fullWidth
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                disabled={isDownloading}
                                className="justify-between"
                            >
                                <span className="flex items-center">
                                    <Download className="h-4 w-4 mr-2" />
                                    {isDownloading ? "Downloading..." : "Download"}
                                </span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                            {showDownloadMenu && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C1C1E] border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                                    <button
                                        onClick={handleDownloadHTML}
                                        disabled={isDownloading}
                                        className="w-full px-4 py-2.5 text-sm text-left text-ink dark:text-trueWhite hover:bg-gray-50 dark:hover:bg-trueWhite/10 border-b border-border disabled:opacity-50"
                                    >
                                        As HTML
                                    </button>
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={isDownloading}
                                        className="w-full px-4 py-2.5 text-sm text-left text-ink dark:text-trueWhite hover:bg-gray-50 dark:hover:bg-trueWhite/10 border-b border-border disabled:opacity-50"
                                    >
                                        As PDF
                                    </button>
                                    <button
                                        onClick={handleDownloadImage}
                                        disabled={isDownloading}
                                        className="w-full px-4 py-2.5 text-sm text-left text-ink dark:text-trueWhite hover:bg-gray-50 dark:hover:bg-trueWhite/10 disabled:opacity-50"
                                    >
                                        As Image (PNG)
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Share Dropdown */}
                        <div className="relative sm:col-span-1">
                            <Button 
                                variant="ghost" 
                                fullWidth 
                                className="border border-border text-ink dark:text-trueWhite hover:bg-gray-50 dark:hover:bg-trueWhite/10 justify-between"
                                onClick={() => setShowShareMenu(!showShareMenu)}
                                disabled={isSharing}
                            >
                                <span className="flex items-center">
                                    <Share2 className="h-4 w-4 mr-2" />
                                    {isSharing ? "Sharing..." : "Share"}
                                </span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                            {showShareMenu && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C1C1E] border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                                    <button
                                        onClick={handleShareText}
                                        disabled={isSharing}
                                        className="w-full px-4 py-2.5 text-sm text-left text-ink dark:text-trueWhite hover:bg-gray-50 dark:hover:bg-trueWhite/10 border-b border-border disabled:opacity-50"
                                    >
                                        As Text
                                    </button>
                                    <button
                                        onClick={handleShareImage}
                                        disabled={isSharing}
                                        className="w-full px-4 py-2.5 text-sm text-left text-ink dark:text-trueWhite hover:bg-gray-50 dark:hover:bg-trueWhite/10 disabled:opacity-50"
                                    >
                                        As Image
                                    </button>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                </PanelBody>
            </Panel>
        </div>
    );
}
