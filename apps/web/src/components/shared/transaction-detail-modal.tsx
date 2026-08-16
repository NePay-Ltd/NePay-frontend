"use client";

import * as React from "react";
import { format } from "date-fns";
import { X, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/shared/button";
import { TxIcon, type TxCategory } from "./tx-icon";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";

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
}

interface TransactionDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: TransactionDetailData | null;
    onViewFullDetail?: (transactionId: string) => void;
}

function getCategoryColor(category: TxCategory) {
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
        case "success": return "text-green-600 bg-green-50";
        case "pending": return "text-amber-600 bg-amber-50";
        case "failed": return "text-red-600 bg-red-50";
    }
}

function getStatusLabel(status: "success" | "pending" | "failed") {
    switch (status) {
        case "success": return "Completed";
        case "pending": return "Pending";
        case "failed": return "Failed";
    }
}

export function TransactionDetailModal({ open, onOpenChange, transaction, onViewFullDetail }: TransactionDetailModalProps) {
    const [copied, setCopied] = React.useState(false);

    const handleCopyId = () => {
        if (transaction?.id) {
            navigator.clipboard.writeText(transaction.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!transaction) return null;

    const isCredit = transaction.amount > 0;
    const amountClass = isCredit ? "text-green-600" : "text-red-600";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white border border-border">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-lg font-bold text-ink">Transaction Receipt</DialogTitle>
                    <DialogClose className="rounded-full hover:bg-gray-100 transition-colors">
                        <X className="h-5 w-5" />
                    </DialogClose>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Transaction Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                            <TxIcon category={transaction.category} className="mt-1" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-ink truncate">{transaction.label}</p>
                                <p className="text-xs text-muted truncate mt-0.5">{transaction.meta}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className={cn("text-lg font-bold font-sans tabular-nums", amountClass)}>
                                {isCredit ? "+" : ""}{formatNaira(transaction.amount)}
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={cn("px-3 py-2 rounded-lg text-sm font-medium text-center", getStatusColor(transaction.status))}>
                        {getStatusLabel(transaction.status)}
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-3 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted">Transaction ID</span>
                            <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-ink">{transaction.id.slice(0, 8)}...{transaction.id.slice(-4)}</code>
                                <button
                                    onClick={handleCopyId}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
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

                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted">Type</span>
                            <span className={cn("text-xs font-semibold px-2 py-1 rounded-md", getCategoryColor(transaction.category))}>
                                {transaction.type.replace(/_/g, " ")}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted">Direction</span>
                            <span className="text-xs font-semibold text-ink">
                                {transaction.direction === "CREDIT" ? "Received" : "Sent"}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted">Currency</span>
                            <span className="text-xs font-semibold text-ink">{transaction.currency}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted">Date & Time</span>
                            <span className="text-xs font-semibold text-ink">
                                {transaction.date ? format(new Date(transaction.date), "d MMM yyyy · h:mm a") : "—"}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="space-y-2">
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => {
                                onViewFullDetail?.(transaction.id);
                                onOpenChange(false);
                            }}
                        >
                            View Full Receipt
                        </Button>
                        <Button
                            variant="ghost"
                            fullWidth
                            onClick={() => onOpenChange(false)}
                            className="border border-border text-ink hover:bg-gray-50"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
