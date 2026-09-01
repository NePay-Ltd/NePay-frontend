"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconChevronRight as ChevronRight } from "@/components/icons";
import { Receipt, ChevronLeft, Info } from "lucide-react";;

import { useInfiniteTransactions } from "@/lib/queries/transactions";

import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { Chip } from "@/components/shared/chip";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionRow } from "@/components/shared/transaction-row";
import { Skeleton } from "@/components/shared/skeletons";

import { formatNaira } from "@/lib/format";
import { TransactionDetailModal, type TransactionDetailData } from "@/components/shared/transaction-detail-modal";
import { BaseTransaction } from "@/components/shared/transaction-row";

const FILTERS = ["All", "Credits", "Debits"] as const;

function TransactionsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ─── URL State ────────────────────────────────────────────────────────
    const currentType = searchParams.get("type") || "All";
    const currentPageStr = searchParams.get("page") || "1";
    const currentPage = parseInt(currentPageStr, 10) || 1;

    // ─── Modal State ──────────────────────────────────────────────────────
    const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionDetailData | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // ─── Data Fetching ────────────────────────────────────────────────────
    const { 
        data, 
        isLoading, 
        isFetchingNextPage, 
        hasNextPage, 
        fetchNextPage 
    } = useInfiniteTransactions();


    // ─── Handlers ─────────────────────────────────────────────────────────
    const handleFilterClick = (type: string) => {
        const params = new URLSearchParams(searchParams);
        if (type === "All") {
            params.delete("type");
        } else {
            params.set("type", type);
        }
        router.push(`?${params.toString()}`);
    };

    const handleViewReceipt = (tx: BaseTransaction) => {
        const detailData: TransactionDetailData = {
            id: tx.id,
            label: tx.label,
            meta: tx.meta,
            amount: tx.amount,
            category: tx.category,
            status: tx.status,
            date: tx.date,
            type: tx.meta,
            direction: tx.amount > 0 ? "CREDIT" : "DEBIT",
            currency: "NGN",
                cryptoAmount: tx.cryptoAmount,
                cryptoAsset: tx.cryptoAsset,
                exchangeRate: tx.exchangeRate,
        };
        setSelectedTransaction(detailData);
        setModalOpen(true);
    };

    // Flatten pages
    const allItems = React.useMemo(() => {
        if (!data) return [];
        return data.pages.flatMap((p) => p.items);
    }, [data]);

    // Apply client-side filter since API currently doesn't support ?type=
    const filteredItems = React.useMemo(() => {
        if (currentType === "All") return allItems;
        if (currentType === "Credits") return allItems.filter(tx => tx.amount > 0);
        if (currentType === "Debits") return allItems.filter(tx => tx.amount < 0);
        return allItems;
    }, [allItems, currentType]);

    const isTrulyLoading = !mounted || isLoading;
    const isEmpty = !isTrulyLoading && filteredItems.length === 0;

    return (
        <div className="mx-auto max-w-5xl space-y-6">

            {/* Header & Dev Utility */}
                <div>
                    <h1 className="text-3xl font-bold text-ink">Transactions</h1>
                    <p className="mt-2 text-sm text-body">
                        Track and manage your transfers.
                    </p>
                </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {FILTERS.map((f) => (
                    <Chip
                        key={f}
                        active={currentType === f || (currentType.toLowerCase() === f.toLowerCase())}
                        onClick={() => handleFilterClick(f)}
                    >
                        {f}
                    </Chip>
                ))}
            </div>



            <Panel>
                {/* Unified Card List View */}
                <div className="w-full divide-y divide-border">
                    {isTrulyLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-4 flex items-center gap-4 bg-transparent">
                                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <div className="space-y-2 flex flex-col items-end">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        ))
                    ) : isEmpty ? (
                        <div className="py-16">
                            <EmptyState
                                icon={Receipt}
                                heading="No transactions yet"
                                description={currentType === "All" 
                                    ? "Your activity will show up here once you make your first transaction." 
                                    : hasNextPage
                                        ? `No ${currentType.toLowerCase()} found in recent activity.`
                                        : `No ${currentType.toLowerCase()} found.`}
                            />
                        </div>
                    ) : (
                        filteredItems.map((tx) => (
                            <TransactionRow key={tx.id} tx={tx} variant="compact" onViewReceipt={handleViewReceipt} />
                        ))
                    )}

                    {/* Load More Skeleton / Button */}
                    {isFetchingNextPage && (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={`loading-more-${i}`} className="p-4 flex items-center gap-4 bg-transparent">
                                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <div className="space-y-2 flex flex-col items-end">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {/* Footer Load More */}
                {hasNextPage && !isFetchingNextPage && (
                    <div className="p-4 flex justify-center border-t border-border">
                        <Button 
                            variant="quiet"
                            onClick={() => fetchNextPage()}
                            className="w-full sm:w-auto shadow-sm active:scale-95 transition-transform border border-border"
                        >
                            Load more transactions
                        </Button>
                    </div>
                )}
            </Panel>

            {/* Transaction Detail Modal */}
            <TransactionDetailModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                transaction={selectedTransaction}
                onViewFullDetail={(txId) => router.push(`/transactions/${txId}`)}
            />
        </div>
    );
}

export default function TransactionsPage() {
    return (
        <Suspense fallback={<div className="h-96 w-full animate-pulse bg-gray-100 rounded-xl"></div>}>
            <TransactionsContent />
        </Suspense>
    );
}
