"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useInfiniteTransactions } from "@/lib/queries/transactions";
import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { TxIcon } from "@/components/shared/tx-icon";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/shared/skeletons";
import { BaseTransaction } from "@/components/shared/transaction-row";

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

    // Fetch all transactions to find the one matching the ID
    const { data, isLoading } = useInfiniteTransactions(50);
    const [copied, setCopied] = React.useState(false);

    // Find the transaction in the loaded data
    const allTransactions = React.useMemo(() => {
        if (!data) return [];
        return data.pages.flatMap((p) => p.items);
    }, [data]);

    const transaction = allTransactions.find((tx) => tx.id === transactionId);

    const handleCopyId = () => {
        navigator.clipboard.writeText(transactionId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                    <div className="flex items-start justify-between gap-4 pb-8 border-b border-border">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="mt-1">
                                <TxIcon category={transaction.category} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-ink">{transaction.label}</h1>
                                <p className="text-sm text-muted mt-2">{transaction.meta}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className={cn("text-3xl font-bold font-sans tabular-nums", amountClass)}>
                                {isCredit ? "+" : ""}{formatNaira(transaction.amount)}
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={cn("px-4 py-3 rounded-lg text-sm font-semibold text-center", getStatusColor(transaction.status))}>
                        {getStatusLabel(transaction.status)}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                        ? format(new Date(transaction.date), "d MMMM yyyy")
                                        : "—"}
                                </p>
                                {transaction.date && (
                                    <p className="text-xs text-muted mt-1">
                                        {format(new Date(transaction.date), "h:mm a")}
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-muted uppercase mb-2">Currency</p>
                                <p className="text-sm font-semibold text-ink">NGN (Nigerian Naira)</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-border flex flex-col gap-3 sm:flex-row">
                        <Button variant="primary" fullWidth>
                            Download Receipt
                        </Button>
                        <Button variant="ghost" fullWidth className="border border-border text-ink hover:bg-gray-50">
                            Share Receipt
                        </Button>
                    </div>
                </PanelBody>
            </Panel>
        </div>
    );
}
