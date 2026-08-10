"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

import { useOverviewSummary } from "@/lib/queries/overview";
import { useWalletAssets, useWalletStats } from "@/lib/queries/wallet";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";

import { HeroCard } from "@/components/shared/hero-card";
import { Panel, PanelHeader, PanelBody } from "@/components/shared/panel";
import { KpiCard } from "@/components/shared/kpi-card";
import { Tag } from "@/components/shared/tag";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { HeroCardSkeleton, Skeleton, TableRowSkeleton } from "@/components/shared/skeletons";

export default function WalletPage() {
    const router = useRouter();

    // We reuse the overview summary for the total balance
    const { data: summary, isLoading: summaryLoading } = useOverviewSummary();
    
    // Wallet specific data
    const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useWalletStats();
    const { data: assets, isLoading: assetsLoading, isError: assetsError, refetch: refetchAssets } = useWalletAssets();

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* ── Hero Balance Card (30-day sparkline) ────────────────────── */}
            {summaryLoading || statsLoading ? (
                <HeroCardSkeleton />
            ) : summary && stats ? (
                <HeroCard
                    balance={summary.balance}
                    balanceUsd={summary.balanceUsd}
                    sparkline={stats.sparkline30Day}
                    periodLabel="30-day balance"
                />
            ) : null}

            {/* ── Stats Strip ─────────────────────────────────────────────── */}
            {statsLoading ? (
                <div className="flex overflow-hidden gap-4 pb-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="shrink-0 w-[240px] rounded-[16px] border border-border bg-white p-5 shadow-sm space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-7 w-32" />
                        </div>
                    ))}
                </div>
            ) : statsError ? (
                <div className="flex items-center gap-4 rounded-[16px] border border-red-500/20 bg-red-500/5 p-4 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-bold">Failed to load wallet stats.</span>
                    <Button variant="quiet" size="sm" onClick={() => refetchStats()} className="ml-auto font-bold text-red-700 hover:bg-red-500/10">
                        Retry
                    </Button>
                </div>
            ) : stats ? (
                <div className="relative w-full overflow-hidden flex items-center -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full">
                    {/* Fading edges for mobile */}
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none sm:hidden" />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none sm:hidden" />
                    
                    <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-4 py-1">
                        {[...Array(4)].map((_, i) => (
                            <React.Fragment key={i}>
                                <div className="w-[220px] shrink-0">
                                    <KpiCard
                                        label="Money in"
                                        value={formatNaira(stats.depositedThisMonth)}
                                        change={{ value: "Deposited", period: "this month", customDirection: "up" }}
                                    />
                                </div>
                                <div className="w-[220px] shrink-0">
                                    <KpiCard
                                        label="Money out"
                                        value={formatNaira(stats.withdrawnThisMonth)}
                                        change={{ value: "Withdrawn", period: "this month", customDirection: "down" }}
                                    />
                                </div>
                                <div className="w-[220px] shrink-0">
                                    <KpiCard
                                        label="Fees paid"
                                        value={formatNaira(stats.feesPaid)}
                                        change={{ value: "Total fees", period: "this month", customDirection: "none" }}
                                    />
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            ) : null}

        </div>
    );
}
