"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Eye,
    EyeOff,
    Plus,
    ArrowUpRight,
    Smartphone,
    Zap,
    Gift,
    Plane,
    Download,
    LayoutGrid,
    ShieldCheck,
    Lock,
    Monitor,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    RefreshCw,
    Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { useAuth } from "@/lib/auth-context";
import { useOverviewSummary, useRateQuote } from "@/lib/queries/overview";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";

import { Button } from "@/components/shared/button";
import { Panel, PanelHeader, PanelBody } from "@/components/shared/panel";
import { KpiCard } from "@/components/shared/kpi-card";
import { Tile } from "@/components/shared/tile";
import { TxIcon } from "@/components/shared/tx-icon";
import { RowItem } from "@/components/shared/row-item";
import { TransactionRow } from "@/components/shared/transaction-row";
import { Tag } from "@/components/shared/tag";
import { EmptyState } from "@/components/shared/empty-state";
import { HeroCard } from "@/components/shared/hero-card";
import {
    HeroCardSkeleton,
    TableRowSkeleton,
    TileGridSkeleton,
    Skeleton,
} from "@/components/shared/skeletons";
import type { Transaction } from "@/lib/mock-overview";

// ─── Greeting helper ──────────────────────────────────────────────────────────

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

// ─── Quick Actions tiles config ───────────────────────────────────────────────

const QUICK_ACTIONS = [
    { icon: Smartphone, label: "Airtime & Data", href: "/services/airtime" },
    { icon: Zap, label: "Electricity", href: "/services/electricity" },
    { icon: Gift, label: "Gift Cards", href: "/gift-cards" },
    { icon: Plane, label: "Flights", href: "/flights" },
    { icon: ArrowUpRight, label: "Withdraw", href: "/withdraw" },
    { icon: Download, label: "Receive Crypto", href: "/receive-crypto" },
    { icon: LayoutGrid, label: "All Services", href: "/services" },
] as const;

// ─── Overview Page ────────────────────────────────────────────────────────────

export default function OverviewPage() {
    const { user, kycTier } = useAuth();
    const router = useRouter();
    const firstName = user?.name?.split(" ")[0] ?? "there";

    const { data: summary, isLoading: summaryLoading } = useOverviewSummary();
    const { data: rate, isLoading: rateLoading } = useRateQuote();

    const kpiData = summary?.kpi;
    const netPositive = (kpiData?.netChange ?? 0) >= 0;

    return (
        <div className="space-y-6">
            {/* ── Page heading ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink">
                        {getGreeting()}, {firstName} 👋
                    </h1>
                    <p className="mt-0.5 text-sm text-body">
                        Here&apos;s what&apos;s happening with your account today.
                    </p>
                </div>
            </div>

            {/* ── KYC nudge banner ─────────────────────────────────────────── */}
            {kycTier !== "FULL_BVN_NIN" && (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                        <div>
                            <p className="text-sm font-semibold text-ink">
                                Complete identity verification
                            </p>
                            <p className="text-xs text-body">
                                Verify your BVN and NIN to unlock Tier 2 limits and all features.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => router.push("/kyc")}
                        className="shrink-0"
                    >
                        Verify now
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}

            {/* ── Hero balance card ─────────────────────────────────────────── */}
            {summaryLoading ? (
                <HeroCardSkeleton />
            ) : summary ? (
                <HeroCard
                    balance={summary.balance}
                    balanceUsd={summary.balanceUsd}
                    sparkline={summary.sparkline}
                    periodLabel="7-day balance"
                />
            ) : null}

            {/* ── KPI row ──────────────────────────────────────────────────── */}
            {summaryLoading ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-lg border border-border bg-white p-4 shadow-sm space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-7 w-28" />
                        </div>
                    ))}
                </div>
            ) : kpiData ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <KpiCard
                        label="Money In"
                        value={formatNaira(kpiData.moneyIn)}
                        change={{ value: 12.4, period: "vs last month" }}
                    />
                    <KpiCard
                        label="Money Out"
                        value={formatNaira(kpiData.moneyOut)}
                        change={{ value: -3.1, period: "vs last month" }}
                    />
                    <KpiCard
                        label="Net Change"
                        value={formatNaira(kpiData.netChange)}
                        change={{ value: netPositive ? 8.2 : -8.2, period: "this month" }}
                    />
                    <KpiCard
                        label="Pending"
                        value={String(kpiData.pending)}
                        change={undefined}
                    />
                </div>
            ) : null}

            {/* ── Main grid ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Left column (2/3) */}
                <div className="space-y-6 xl:col-span-2">
                    {/* ── Recent Transactions ─────────────────────────────── */}
                    <Panel flush>
                        <PanelHeader
                            className="px-5 pt-5"
                            title="Recent Transactions"
                            action={
                                <Link
                                    href="/transactions"
                                    className="flex items-center gap-1 text-sm font-semibold text-violet-600 hover:underline"
                                >
                                    View all <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            }
                        />
                        <PanelBody className="px-5 pb-2">
                            {summaryLoading ? (
                                <TableRowSkeleton rows={5} />
                            ) : summary?.recentTransactions?.length ? (
                                summary.recentTransactions.map((tx) => (
                                    <TransactionRow key={tx.id} tx={tx} variant="compact" />
                                ))
                            ) : (
                                <EmptyState
                                    icon={Clock}
                                    heading="No transactions yet"
                                    description="Your transaction history will appear here as you start using NePay."
                                    action={{
                                        label: "Add money to get started",
                                        onClick: () => router.push("/add-money"),
                                    }}
                                    className="py-10"
                                />
                            )}
                        </PanelBody>
                    </Panel>

                    {/* ── Quick Actions ───────────────────────────────────── */}
                    <Panel>
                        <PanelHeader
                            title="Quick Actions"
                            action={
                                <Link
                                    href="/services"
                                    className="flex items-center gap-1 text-sm font-semibold text-violet-600 hover:underline"
                                >
                                    All services <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            }
                        />
                        <PanelBody>
                            {summaryLoading ? (
                                <TileGridSkeleton count={7} className="grid-cols-3 sm:grid-cols-4" />
                            ) : (
                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                    {QUICK_ACTIONS.map((action) => (
                                        <Tile
                                            key={action.label}
                                            icon={action.icon}
                                            label={action.label}
                                            onClick={() => {
                                                if (
                                                    action.href === "/services/electricity" ||
                                                    action.href === "/services"
                                                ) {
                                                    toast.info("Coming soon!", {
                                                        description: `${action.label} will be available shortly.`,
                                                    });
                                                    return;
                                                }
                                                router.push(action.href);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </PanelBody>
                    </Panel>
                </div>

                {/* Right column (1/3) */}
                <div className="space-y-6">
                    {/* ── Account Health ──────────────────────────────────── */}
                    <Panel flush>
                        <PanelHeader
                            className="px-5 pt-5"
                            title="Account Health"
                        />
                        <PanelBody className="pb-2">
                            <div className="divide-y divide-border">
                                {/* KYC */}
                                <RowItem
                                    icon={ShieldCheck}
                                    iconTint={
                                        kycTier === "FULL_BVN_NIN" ? "green" : "amber"
                                    }
                                    title="KYC Verification"
                                    subtitle={
                                        kycTier === "FULL_BVN_NIN"
                                            ? "Tier 2 — fully verified"
                                            : "Pending — BVN & NIN required"
                                    }
                                    trailing={
                                        kycTier === "FULL_BVN_NIN" ? (
                                            <Tag variant="ok" dot>Verified</Tag>
                                        ) : (
                                            <Link
                                                href="/kyc"
                                                className="text-xs font-semibold text-violet-600 hover:underline"
                                            >
                                                Complete now
                                            </Link>
                                        )
                                    }
                                    className="px-5"
                                />

                                {/* 2FA */}
                                <RowItem
                                    icon={Lock}
                                    iconTint="green"
                                    title="Two-Factor Auth"
                                    subtitle="App authenticator enabled"
                                    trailing={
                                        <div className="flex items-center gap-2">
                                            <Tag variant="ok" dot>Active</Tag>
                                            <Link
                                                href="/security"
                                                className="text-xs font-semibold text-violet-600 hover:underline"
                                            >
                                                Manage
                                            </Link>
                                        </div>
                                    }
                                    className="px-5"
                                />

                                {/* Trusted devices */}
                                <RowItem
                                    icon={Monitor}
                                    iconTint="violet"
                                    title="Trusted Devices"
                                    subtitle="2 devices authorised"
                                    trailing={
                                        <Link
                                            href="/security"
                                            className="text-xs font-semibold text-violet-600 hover:underline"
                                        >
                                            View all
                                        </Link>
                                    }
                                    className="px-5"
                                />
                            </div>
                        </PanelBody>
                    </Panel>

                    {/* ── Rate Watch ──────────────────────────────────────── */}
                    <Panel>
                        <PanelHeader
                            title="Rate Watch"
                            action={
                                !rateLoading && rate ? (
                                    <span className="flex items-center gap-1 text-xs text-muted">
                                        <RefreshCw className="h-3 w-3" />
                                        {format(new Date(rate.updatedAt), "HH:mm")}
                                    </span>
                                ) : null
                            }
                        />
                        <PanelBody>
                            {rateLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-40" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="mt-3 h-10 w-full rounded-sm" />
                                </div>
                            ) : rate ? (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                        {rate.symbol}
                                    </p>
                                    <div className="flex items-end gap-3">
                                        <p className="font-mono text-3xl font-bold text-ink">
                                            {formatNaira(rate.rate)}
                                        </p>
                                        <span
                                            className={cn(
                                                "mb-1 flex items-center gap-0.5 text-sm font-semibold",
                                                rate.changePercent >= 0
                                                    ? "text-green-500"
                                                    : "text-red-500",
                                            )}
                                        >
                                            {rate.changePercent >= 0 ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4" />
                                            )}
                                            {Math.abs(rate.changePercent).toFixed(2)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-body">
                                        Per 1 USDT · Live market rate
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        fullWidth
                                        className="mt-1"
                                        onClick={() => router.push("/receive-crypto")}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Show deposit address
                                    </Button>
                                </div>
                            ) : null}
                        </PanelBody>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
