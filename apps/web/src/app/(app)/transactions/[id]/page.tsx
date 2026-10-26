"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDate, formatTime } from "@/lib/date";
import { IconArrowLeft as ArrowLeft, IconChevronDown as ChevronDown } from "@/components/icons";
import { Download, Share2, Image } from "lucide-react";;
import { useTransaction } from "@/lib/queries/transactions";
import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { TxIcon } from "@/components/shared/tx-icon";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/shared/skeletons";
import { downloadReceipt, downloadReceiptPDF, downloadReceiptImage, shareReceipt, shareReceiptImage, type ReceiptData } from "@/lib/receipt-utils";
import { ReceiptCard } from "@/components/shared/receipt-card";
import { buildReceiptConfig } from "@/lib/receipt-config";

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
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [isSharing, setIsSharing] = React.useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);
    const [showShareMenu, setShowShareMenu] = React.useState(false);

    // On screen: the whole picture (fee, total debited, discount). Anything sent out goes through
    // receipt-utils, which reduces it to the exact amount that moved.
    const receiptInput = transaction?.receiptInput ?? null;
    const receipt = React.useMemo(() => (receiptInput ? buildReceiptConfig(receiptInput) : null), [receiptInput]);
    const getReceiptData = (): ReceiptData => {
        if (!receiptInput) throw new Error("No transaction data");
        return receiptInput;
    };

    const handleDownloadHTML = async () => {
        if (!receipt) return;
        setIsDownloading(true);
        try {
            await downloadReceipt(getReceiptData());
        } finally {
            setIsDownloading(false);
            setShowDownloadMenu(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!receipt) return;
        setIsDownloading(true);
        try {
            await downloadReceiptPDF(getReceiptData());
        } finally {
            setIsDownloading(false);
            setShowDownloadMenu(false);
        }
    };

    const handleDownloadImage = async () => {
        if (!receipt) return;
        setIsDownloading(true);
        try {
            await downloadReceiptImage(getReceiptData());
        } finally {
            setIsDownloading(false);
            setShowDownloadMenu(false);
        }
    };

    const handleShareText = async () => {
        if (!receipt) return;
        setIsSharing(true);
        try {
            await shareReceipt(getReceiptData());
        } finally {
            setIsSharing(false);
            setShowShareMenu(false);
        }
    };

    const handleShareImage = async () => {
        if (!receipt) return;
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

    if (!transaction || !receipt) {
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
                    {/* The receipt itself - the same markup the downloads are made from */}
                    {receipt && <ReceiptCard receipt={receipt} />}

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
