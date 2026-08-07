"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
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
    AlertCircle
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

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

const QUICK_ACTIONS = [
    { icon: Smartphone, label: "Airtime & Data", href: "/services/airtime" },
    { icon: Zap, label: "Electricity", href: "/services/electricity" },
    { icon: Gift, label: "Gift Cards", href: "/gift-cards" },
    { icon: Plane, label: "Flights", href: "/flights" },
    { icon: ArrowUpRight, label: "Withdraw", href: "/withdraw" },
    { icon: Download, label: "Receive Crypto", href: "/receive-crypto" },
    { icon: LayoutGrid, label: "All Services", href: "/services" },
] as const;

export default function OverviewPage() {
    const { user, kycTier } = useAuth();
    const router = useRouter();
    const firstName = user?.name?.split(" ")[0] ?? "there";

    const { data: summary, isLoading: summaryLoading } = useOverviewSummary();
    const { data: rate, isLoading: rateLoading } = useRateQuote();

    const kpiData = summary?.kpi;
    const netPositive = (kpiData?.netChange ?? 0) >= 0;

    return (
        <div className="space-y-5 pb-12 sm:space-y-8">
            {/* ── Page heading ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 sm:gap-5">
                <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white shadow-md sm:h-16 sm:w-16 sm:border-4 sm:shadow-lg">
                    <Image
                        src="/images/avatar.png"
                        alt="Profile Avatar"
                        fill
                        className="object-cover"
                    />
                </div>
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-3xl">
                        {firstName ? `Good morning, ${firstName} 👋` : "Good morning."}
                    </h1>
                    {/* Subtitle: hidden on mobile — too wordy for a glance */}
                    <p className="mt-0.5 hidden text-sm font-medium text-body sm:block">
                        Here&apos;s your financial snapshot for today.
                    </p>
                </div>
            </div>

            {/* ── KYC Prompt Banner ────────────────────────────────────── */}
            {kycTier !== "FULL_BVN_NIN" && (
                <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm sm:rounded-2xl sm:gap-4 sm:px-6 sm:py-5">
                    {/* Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 sm:h-10 sm:w-10">
                        <ShieldCheck className="h-4 w-4 text-violet-700 sm:h-5 sm:w-5" />
                    </div>

                    {/* Text — description hidden on mobile */}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink sm:text-base">
                            Unlock ₦5M transfer limits
                        </p>
                        <p className="mt-0.5 hidden text-sm font-medium text-body sm:block">
                            You&apos;re 80% of the way there. Verify your BVN and NIN to unlock Tier 2.
                        </p>
                    </div>

                    {/* CTA — compact on mobile, normal on sm+ */}
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push("/kyc")}
                        className="shrink-0 whitespace-nowrap font-bold text-xs sm:text-sm sm:px-4"
                    >
                        Verify now
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
                    periodLabel="30-day trend"
                />
            ) : null}

            {/* ── Financial Insights (KPIs) ────────────────────────────────── */}
            {summaryLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-8 w-28" />
                        </div>
                    ))}
                </div>
            ) : kpiData ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                    <KpiCard
                        label="Deposits"
                        value={formatNaira(kpiData.moneyIn)}
                        change={{ value: 12, period: "vs last month" }}
                    />
                    <KpiCard
                        label="Spending"
                        value={formatNaira(kpiData.moneyOut)}
                        change={{ value: -3, period: "vs last month" }}
                    />
                    <KpiCard
                        label="Cash Flow"
                        value={formatNaira(kpiData.netChange)}
                        change={{ value: netPositive ? "Positive" : "Negative", period: "This month" }}
                    />
                    <KpiCard
                        label="Pending"
                        value={String(kpiData.pending)}
                        change={{ value: "3 items", period: "Need attention" }}
                    />
                </div>
            ) : null}

            {/* ── Main grid ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                {/* Left column (2/3) */}
                <div className="space-y-8 xl:col-span-2">
                    
                    {/* ── Quick Actions ───────────────────────────────────── */}
                    <Panel>
                        <PanelHeader
                            title="Primary Actions"
                            action={
                                <Link
                                    href="/services"
                                    className="flex items-center gap-1 text-sm font-bold text-violet-700 hover:text-violet-600 transition-colors"
                                >
                                    View catalog <ArrowRight className="h-4 w-4" />
                                </Link>
                            }
                        />
                        <PanelBody className="pt-2">
                            {summaryLoading ? (
                                <TileGridSkeleton count={7} className="grid-cols-4" />
                            ) : (
                                /* Horizontal scroll on mobile for quick access */
                                <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                                    <div className="flex gap-3 sm:grid sm:grid-cols-4 sm:gap-3">
                                        {QUICK_ACTIONS.map((action) => (
                                            <Tile
                                                key={action.label}
                                                icon={action.icon}
                                                label={action.label}
                                                className="min-w-[72px] sm:min-w-0"
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
                                </div>
                            )}
                        </PanelBody>
                    </Panel>

                    {/* ── Recent Transactions ─────────────────────────────── */}
                    <Panel flush>
                        <PanelHeader
                            className="px-6 pt-6"
                            title="Recent Activity"
                            action={
                                <Link
                                    href="/transactions"
                                    className="flex items-center gap-1 text-sm font-bold text-violet-700 hover:text-violet-600 transition-colors"
                                >
                                    See all <ArrowRight className="h-4 w-4" />
                                </Link>
                            }
                        />
                        <PanelBody className="px-6 pb-4 pt-2">
                            {summaryLoading ? (
                                <TableRowSkeleton rows={5} />
                            ) : summary?.recentTransactions?.length ? (
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted py-2">Today</h3>
                                    {summary.recentTransactions.slice(0, 3).map((tx) => (
                                        <TransactionRow key={tx.id} tx={tx} variant="compact" />
                                    ))}
                                    {summary.recentTransactions.length > 3 && (
                                        <>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted py-2 mt-4">Yesterday</h3>
                                            {summary.recentTransactions.slice(3).map((tx) => (
                                                <TransactionRow key={tx.id} tx={tx} variant="compact" />
                                            ))}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Clock}
                                    heading="No transactions yet"
                                    description="Your transaction history will appear here as you start using NePay."
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

                {/* Right column (1/3) — hidden on mobile, visible on lg+ */}
                <div className="hidden lg:block lg:space-y-8">
                    {/* ── Account Security Progress ───────────────────────── */}
                    <Panel>
                        <PanelHeader
                            title="Account Security"
                            action={
                                <Link href="/security" className="text-sm font-bold text-violet-700 hover:text-violet-600 transition-colors">
                                    Settings
                                </Link>
                            }
                        />
                        <PanelBody className="space-y-5">
                            {/* Visual Progress item */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-ink flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-green-500" />
                                        Two-Factor Auth
                                    </span>
                                    <Tag variant="ok" dot>Enabled</Tag>
                                </div>
                                <p className="text-xs font-medium text-body">
                                    Your account is protected by an authenticator app.
                                </p>
                            </div>

                            <div className="h-px bg-border/50" />

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-ink flex items-center gap-2">
                                        <Monitor className="h-4 w-4 text-violet-500" />
                                        Trusted Devices
                                    </span>
                                    <span className="text-xs font-bold text-muted">1 Active</span>
                                </div>
                                <p className="text-xs font-medium text-body">
                                    Review devices that have access to your account.
                                </p>
                            </div>
                        </PanelBody>
                    </Panel>

                    {/* ── Market Insights (Rate Watch) ────────────────────── */}
                    <Panel>
                        <PanelHeader
                            title="Market Rate"
                            action={
                                !rateLoading && rate ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-muted">
                                        <RefreshCw className="h-3 w-3" />
                                        {format(new Date(rate.updatedAt), "HH:mm")}
                                    </span>
                                ) : null
                            }
                        />
                        <PanelBody className="pt-2">
                            {rateLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-40" />
                                </div>
                            ) : rate ? (
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">
                                                1 {rate.symbol} equals
                                            </p>
                                            <p className="font-sans tabular-nums text-4xl font-extrabold text-ink tracking-tighter">
                                                {formatNaira(rate.rate)}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                "mb-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold",
                                                rate.changePercent >= 0
                                                    ? "bg-green-50 text-green-600"
                                                    : "bg-red-50 text-red-600",
                                            )}
                                        >
                                            {rate.changePercent >= 0 ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3" />
                                            )}
                                            {Math.abs(rate.changePercent).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="font-bold w-full"
                                            onClick={() => router.push("/receive-crypto")}
                                        >
                                            Buy {rate.symbol}
                                        </Button>
                                        <Button
                                            variant="quiet"
                                            size="sm"
                                            className="font-bold w-full"
                                        >
                                            Sell {rate.symbol}
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </PanelBody>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
