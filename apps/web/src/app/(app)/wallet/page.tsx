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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-[16px] border border-border bg-white p-5 shadow-sm space-y-2">
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
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                    <KpiCard
                        label="Money in"
                        value={formatNaira(stats.depositedThisMonth)}
                        change={{ value: "Deposited", period: "this month", customDirection: "up" }}
                    />
                    <KpiCard
                        label="Money out"
                        value={formatNaira(stats.withdrawnThisMonth)}
                        change={{ value: "Withdrawn", period: "this month", customDirection: "down" }}
                    />
                    <KpiCard
                        label="Fees paid"
                        value={formatNaira(stats.feesPaid)}
                        change={{ value: "Total fees", period: "this month", customDirection: "none" }}
                    />
                </div>
            ) : null}

            {/* ── Assets Table ────────────────────────────────────────────── */}
            <Panel className="rounded-[24px]">
                <PanelHeader
                    className="px-6 pt-6"
                    title="Your Assets"
                    description="Cryptocurrency holdings available for withdrawal or conversion."
                />
                <PanelBody className="px-6 pb-4 pt-4">
                    {assetsLoading ? (
                        <TableRowSkeleton rows={3} />
                    ) : assetsError ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-red-500 bg-red-50/50 rounded-xl">
                            <AlertCircle className="h-6 w-6 text-red-400" />
                            <span className="text-sm font-bold">Failed to load assets.</span>
                            <Button variant="quiet" size="sm" onClick={() => refetchAssets()} className="text-red-700 hover:bg-red-100 font-bold">
                                Retry
                            </Button>
                        </div>
                    ) : assets && assets.length > 0 ? (
                        <div className="overflow-x-auto pb-2">
                            <div className="min-w-[600px] divide-y divide-border/50">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-4 pb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
                                    <div className="col-span-4">ASSET</div>
                                    <div className="col-span-3">NETWORKS</div>
                                    <div className="col-span-2 text-right">HOLDINGS</div>
                                    <div className="col-span-2 text-right">VALUE (NGN)</div>
                                    <div className="col-span-1 text-right">ACTION</div>
                                </div>
                                {/* Rows */}
                                <div className="space-y-2 mt-2">
                                    {assets.map((asset) => (
                                        <div
                                            key={asset.id}
                                            className="grid grid-cols-12 items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-violet-50/50 cursor-pointer"
                                            onClick={() => router.push(`/withdraw?asset=${asset.symbol.toLowerCase()}`)}
                                        >
                                            <div className="col-span-4 flex items-center gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg text-violet-700 font-bold">
                                                    {asset.icon}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-extrabold text-ink">
                                                        {asset.name}
                                                    </p>
                                                    <p className="truncate text-[11px] font-bold text-muted uppercase tracking-wider">
                                                        {asset.symbol}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="col-span-3 flex flex-wrap gap-1.5">
                                                {asset.networks.map((net) => (
                                                    <Tag key={net} variant="neutral" className="text-[10px] py-0 px-2 font-bold uppercase tracking-wider">
                                                        {net}
                                                    </Tag>
                                                ))}
                                            </div>
                                            
                                            <div className="col-span-2 text-right">
                                                <p className="font-mono text-[13px] font-extrabold text-ink tracking-tighter">
                                                    {asset.holdings.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                </p>
                                            </div>
                                            
                                            <div className="col-span-2 text-right">
                                                <p className="font-mono text-[13px] font-extrabold text-ink tracking-tighter">
                                                    {formatNaira(asset.valueNgn)}
                                                </p>
                                            </div>
                                            
                                            <div className="col-span-1 text-right flex justify-end">
                                                <div
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white transition-colors"
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EmptyState
                            icon={RefreshCw}
                            heading="No assets yet"
                            description="Your crypto assets will appear here once you make a deposit."
                            action={{
                                label: "Add money to get started",
                                onClick: () => router.push("/add-money"),
                            }}
                            className="py-12"
                        />
                    )}
                </PanelBody>
            </Panel>
        </div>
    );
}
