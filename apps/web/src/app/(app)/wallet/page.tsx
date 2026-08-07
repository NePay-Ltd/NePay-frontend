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
import { HeroCardSkeleton, Skeleton, TableRowSkeleton } from "@/components/shared/skeletons";

export default function WalletPage() {
    const router = useRouter();

    // We reuse the overview summary for the total balance
    const { data: summary, isLoading: summaryLoading } = useOverviewSummary();
    
    // Wallet specific data
    const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useWalletStats();
    const { data: assets, isLoading: assetsLoading, isError: assetsError, refetch: refetchAssets } = useWalletAssets();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink">Wallet</h1>
                    <p className="mt-0.5 text-sm text-body">
                        Manage your funds and crypto assets.
                    </p>
                </div>
            </div>

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
                        <div key={i} className="rounded-lg border border-border bg-white p-4 shadow-sm space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-7 w-32" />
                        </div>
                    ))}
                </div>
            ) : statsError ? (
                <div className="flex items-center gap-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm">Failed to load wallet stats.</span>
                    <Button variant="quiet" size="sm" onClick={() => refetchStats()} className="ml-auto">
                        Retry
                    </Button>
                </div>
            ) : stats ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <KpiCard
                        label="Deposited this month"
                        value={formatNaira(stats.depositedThisMonth)}
                    />
                    <KpiCard
                        label="Withdrawn this month"
                        value={formatNaira(stats.withdrawnThisMonth)}
                    />
                    <KpiCard
                        label="Fees paid"
                        value={formatNaira(stats.feesPaid)}
                    />
                </div>
            ) : null}

            {/* ── Assets Table ────────────────────────────────────────────── */}
            <Panel flush>
                <PanelHeader
                    className="px-5 pt-5"
                    title="Your Assets"
                />
                <PanelBody>
                    {assetsLoading ? (
                        <div className="px-5 pb-5">
                            <TableRowSkeleton rows={3} />
                        </div>
                    ) : assetsError ? (
                        <div className="flex items-center justify-center gap-3 py-12 text-red-500">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm">Failed to load assets.</span>
                            <Button variant="quiet" size="sm" onClick={() => refetchAssets()}>
                                Retry
                            </Button>
                        </div>
                    ) : assets && assets.length > 0 ? (
                        <div className="overflow-x-auto pb-2">
                            <div className="min-w-[600px] divide-y divide-border">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                                    <div className="col-span-4">Asset</div>
                                    <div className="col-span-3">Networks</div>
                                    <div className="col-span-2 text-right">Holdings</div>
                                    <div className="col-span-2 text-right">Value (NGN)</div>
                                    <div className="col-span-1 text-right">Action</div>
                                </div>
                                {/* Rows */}
                                {assets.map((asset) => (
                                    <div
                                        key={asset.id}
                                        className="grid grid-cols-12 items-center gap-4 px-5 py-4 transition-colors hover:bg-violet-050/50"
                                    >
                                        <div className="col-span-4 flex items-center gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg text-violet-700">
                                                {asset.icon}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-ink">
                                                    {asset.name}
                                                </p>
                                                <p className="truncate text-xs text-muted">
                                                    {asset.symbol}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="col-span-3 flex flex-wrap gap-1.5">
                                            {asset.networks.map((net) => (
                                                <Tag key={net} variant="neutral" className="text-[10px] py-0 px-2 font-medium">
                                                    {net}
                                                </Tag>
                                            ))}
                                        </div>
                                        
                                        <div className="col-span-2 text-right">
                                            <p className="font-mono text-sm font-semibold text-ink">
                                                {asset.holdings.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                            </p>
                                        </div>
                                        
                                        <div className="col-span-2 text-right">
                                            <p className="font-mono text-sm font-semibold text-ink">
                                                {formatNaira(asset.valueNgn)}
                                            </p>
                                        </div>
                                        
                                        <div className="col-span-1 text-right">
                                            <Link
                                                href={`/withdraw?asset=${asset.symbol.toLowerCase()}`}
                                                className="text-sm font-semibold text-violet-600 hover:underline"
                                            >
                                                Withdraw
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-sm text-muted">You have no assets yet.</p>
                            <Button
                                variant="primary"
                                className="mt-4"
                                onClick={() => router.push("/add-money")}
                            >
                                Add Money
                            </Button>
                        </div>
                    )}
                </PanelBody>
            </Panel>
        </div>
    );
}
