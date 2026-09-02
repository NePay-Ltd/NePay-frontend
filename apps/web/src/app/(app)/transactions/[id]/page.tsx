"use client";

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
import { downloadReceipt, downloadReceiptPDF, downloadReceiptImage, shareReceipt, shareReceiptImage, type ReceiptData } from "@/lib/receipt-utils";

function getCategoryColor(category: string) {
    switch (category) {
        case "deposit": return "bg-green-100 text-green-700";
        case "withdrawal": return "bg-red-100 text-red-700";
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
                    {/* Transaction Header */}
                    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-5 sm:pb-8">
                        <div className="flex min-w-0 items-start gap-3 flex-1">
                            <div className="mt-1 shrink-0">
                                <TxIcon category={transaction.category} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl sm:text-2xl font-bold text-ink break-words">{transaction.label}</h1>
                                <p className="text-sm text-muted mt-1">{transaction.meta}</p>
                            </div>
                        </div>
                        <div className="shrink-0">
                            <p className={cn("text-2xl sm:text-3xl font-bold font-sans tabular-nums", amountClass)}>
                                {isCredit ? "+" : ""}{formatNaira(transaction.amount)}
                            </p>
                            {transaction.cryptoAmount && transaction.cryptoAsset && (
                                <p className="mt-1 text-sm font-semibold text-muted">
                                    {transaction.cryptoAmount} {transaction.cryptoAsset}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={cn("px-4 py-3 rounded-lg text-sm font-semibold text-center", getStatusColor(transaction.status))}>
                        {getStatusLabel(transaction.status)}
                    </div>

                    {/* Details Grid — single col on mobile, 2-col on sm+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-semibold text-muted uppercase mb-2">Transaction ID</p>
                                <div className="flex items-center gap-2">
                                    <code className="text-sm font-mono text-ink break-all">{transaction.id}</code>
                                    <button
                                        onClick={handleCopyId}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                                        title="Copy transaction ID"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4 text-muted" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-muted uppercase mb-2">Category</p>
                                <div className={cn("inline-flex px-3 py-1.5 rounded-lg font-semibold text-sm", getCategoryColor(transaction.category))}>
                                    {transaction.meta}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-muted uppercase mb-2">Direction</p>
                                <p className="text-sm font-semibold text-ink">
                                    {transaction.amount > 0 ? "Received" : "Sent"}
                                </p>
                            </div>

                            {transaction.cryptoAmount && transaction.cryptoAsset && (
                                <div>
                                    <p className="text-xs font-semibold text-muted uppercase mb-2">Crypto received</p>
                                    <p className="text-sm font-semibold text-ink">
                                        {transaction.cryptoAmount} {transaction.cryptoAsset}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-semibold text-muted uppercase mb-2">Amount</p>
                                <p className={cn("text-lg font-bold font-sans tabular-nums", amountClass)}>
                                    {isCredit ? "+" : ""}{formatNaira(transaction.amount)} NGN
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-muted uppercase mb-2">Date & Time</p>
                                <p className="text-sm font-semibold text-ink">
                                    {transaction.date
                                        ? formatDate(transaction.date)
                                        : "—"}
                                </p>
                                {transaction.date && (
                                    <p className="text-xs text-muted mt-1">
                                        {formatTime(transaction.date)}
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-muted uppercase mb-2">Currency</p>
                                <p className="text-sm font-semibold text-ink">NGN (Nigerian Naira)</p>
                            </div>

                            {transaction.utilityToken && transaction.category === "electricity" && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:col-span-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Electricity Token</p>
                                    <p className="mt-2 break-all font-mono text-xl font-bold tracking-widest text-ink">{transaction.utilityToken}</p>
                                </div>
                            )}
                        </div>
                    </div>

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
