"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react";

import { useInfiniteTransactions } from "@/lib/queries/transactions";

import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { Chip } from "@/components/shared/chip";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionRow } from "@/components/shared/transaction-row";
import { Skeleton } from "@/components/shared/skeletons";
import { useOverviewSummary } from "@/lib/queries/overview";
import { formatNaira } from "@/lib/format";
import { TransactionDetailModal, type TransactionDetailData } from "@/components/shared/transaction-detail-modal";
import { BaseTransaction } from "@/components/shared/transaction-row";

const FILTERS = ["All", "Deposits", "Withdrawals", "Payments", "Gift Cards", "Flights"] as const;

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


    // ─── Data Fetching ────────────────────────────────────────────────────
    const { 
        data, 
        isLoading, 
        isFetchingNextPage, 
        hasNextPage, 
        fetchNextPage 
    } = useInfiniteTransactions();

    const { data: summary } = useOverviewSummary();
    const kpiData = summary?.kpi;

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
        const targetCategory = currentType.toLowerCase();
        // The URL params match the UI labels. E.g. "Gift Cards". 
        // Our TxCategory is 'gift-card'. Let's do a simple fuzzy match or exact map:
        const map: Record<string, string> = {
            "deposits": "deposit",
            "withdrawals": "withdrawal",
            "payments": "payment",
            "gift cards": "gift-card",
            "flights": "flight"
        };
        const cat = map[targetCategory] || targetCategory;
        return allItems.filter(tx => tx.category === cat);
    }, [allItems, currentType]);

    const isEmpty = !isLoading && filteredItems.length === 0;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            
            {/* ── KPI Summary (Horizontally Scrollable) ────────────────── */}
            {kpiData && (
                <div className="relative w-full">
                    <div className="flex w-full gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
                        {/* Fake padding block for snap start alignment if needed */}
                        <div className="snap-start snap-always min-w-[200px] shrink-0 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
                            <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400">Money in</span>
                            <span className="text-xl font-black text-ink tracking-tight mt-1">{formatNaira(kpiData.moneyIn)}</span>
                        </div>
                        <div className="snap-start snap-always min-w-[200px] shrink-0 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
                            <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400">Money out</span>
                            <span className="text-xl font-black text-ink tracking-tight mt-1">{formatNaira(kpiData.moneyOut)}</span>
                        </div>
                        <div className="snap-start snap-always min-w-[200px] shrink-0 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
                            <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400">Net change</span>
                            <span className="text-xl font-black text-ink tracking-tight mt-1">+{formatNaira(kpiData.netChange)}</span>
                        </div>
                        <div className="snap-start snap-always min-w-[200px] shrink-0 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
                            <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400">Pending</span>
                            <span className="text-xl font-black text-ink tracking-tight mt-1">₦0</span>
                        </div>
                        {/* Spacer for the fade edge */}
                        <div className="min-w-[16px] shrink-0" />
                    </div>
                    {/* Fade Mask (Right Edge) */}
                    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black to-transparent" />
                </div>
            )}

            {/* Header & Dev Utility */}
                <div>
                    <h1 className="text-3xl font-bold text-ink">Transactions</h1>
                    <p className="mt-2 text-sm text-body">
                        View and filter your complete transaction history.
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
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-4 flex items-center gap-4 bg-white">
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
                            <div key={`loading-more-${i}`} className="p-4 flex items-center gap-4 bg-white">
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
                {hasNextPage && !isFetchingNextPage && !isEmpty && (
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
