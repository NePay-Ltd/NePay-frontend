"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react";

import { useTransactions } from "@/lib/queries/transactions";

import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { Chip } from "@/components/shared/chip";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionRow } from "@/components/shared/transaction-row";
import { Skeleton } from "@/components/shared/skeletons";
import { useOverviewSummary } from "@/lib/queries/overview";
import { formatNaira } from "@/lib/format";

const FILTERS = ["All", "Deposits", "Withdrawals", "Payments", "Gift Cards", "Flights"] as const;

function TransactionsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ─── URL State ────────────────────────────────────────────────────────
    const currentType = searchParams.get("type") || "All";
    const currentCursor = searchParams.get("cursor");

    // ─── Local State ──────────────────────────────────────────────────────
    const [forceEmpty, setForceEmpty] = React.useState(false);
    
    // We maintain a stack of previous cursors to allow going "Back".
    // Index 0 is the first page (cursor = null).
    const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([null]);

    // ─── Data Fetching ────────────────────────────────────────────────────
    const { data, isLoading, isFetching } = useTransactions(currentType, currentCursor);
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
        params.delete("cursor"); // Reset pagination
        setCursorHistory([null]); // Reset history
        router.push(`?${params.toString()}`);
    };

    const handleNextPage = () => {
        if (!data?.nextCursor) return;
        
        // Push current cursor onto history stack
        setCursorHistory((prev) => [...prev, currentCursor]);

        const params = new URLSearchParams(searchParams);
        params.set("cursor", data.nextCursor);
        router.push(`?${params.toString()}`);
    };

    const handlePrevPage = () => {
        if (cursorHistory.length <= 1) return; // Can't go back from first page

        const newHistory = [...cursorHistory];
        newHistory.pop(); // Remove the current page's origin cursor
        const prevCursor = newHistory[newHistory.length - 1];
        
        setCursorHistory(newHistory);

        const params = new URLSearchParams(searchParams);
        if (prevCursor) {
            params.set("cursor", prevCursor);
        } else {
            params.delete("cursor");
        }
        router.push(`?${params.toString()}`);
    };

    // Calculate roughly what page we are on based on the history stack
    const currentPageNumber = cursorHistory.length;

    const isEmpty = forceEmpty || (data && data.items.length === 0);
    const totalPages = Math.ceil((data?.totalCount || 0) / 20) || 1;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            
            {/* ── KPI Marquee ──────────────────────────────────────────────────────── */}
            {kpiData && (
                <div className="w-full overflow-hidden bg-violet-50 border border-violet-100 rounded-xl py-3 relative">
                    <div className="flex animate-[marquee_15s_linear_infinite] whitespace-nowrap">
                        {/* Duplicate the items twice to create an infinite scroll illusion */}
                        {[1, 2].map((set) => (
                            <div key={set} className="flex items-center gap-12 px-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-violet-600">Money in</span>
                                    <span className="text-sm font-bold text-ink">{formatNaira(kpiData.moneyIn)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-violet-600">Money out</span>
                                    <span className="text-sm font-bold text-ink">{formatNaira(kpiData.moneyOut)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-violet-600">Net change</span>
                                    <span className="text-sm font-bold text-ink">+{formatNaira(kpiData.netChange)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-violet-600">Pending</span>
                                    <span className="text-sm font-bold text-ink">₦0</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Header & Dev Utility */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-ink">Transactions</h1>
                    <p className="mt-2 text-sm text-body">
                        View and filter your complete transaction history.
                    </p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setForceEmpty(!forceEmpty)}
                    className="shrink-0"
                >
                    {forceEmpty ? "Disable Empty Preview" : "Preview Empty State"}
                </Button>
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

            {/* Main Ledger Panel */}
            <Panel>
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                        <thead>
                            <tr className="border-b border-border bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-muted">
                                <th className="px-6 py-4">Transaction</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {(isLoading || (isFetching && !data)) ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-b border-border bg-white">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-3.5 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                        <td className="px-6 py-4 flex justify-end"><Skeleton className="h-4 w-24" /></td>
                                    </tr>
                                ))
                            ) : isEmpty ? (
                                <tr>
                                    <td colSpan={5} className="py-16">
                                        <EmptyState
                                            icon={Receipt}
                                            heading="No transactions yet"
                                            description="Your activity will show up here once you make your first transaction."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                data?.items.map((tx) => (
                                    <TransactionRow key={tx.id} tx={tx} variant="table" />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination */}
                {data && !isEmpty && (
                    <div className="flex items-center justify-between border-t border-border px-6 py-4">
                        <div className="text-sm text-muted">
                            Page {currentPageNumber} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handlePrevPage}
                                disabled={cursorHistory.length <= 1}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Previous
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleNextPage}
                                disabled={!data.nextCursor}
                            >
                                Next
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Panel>
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
