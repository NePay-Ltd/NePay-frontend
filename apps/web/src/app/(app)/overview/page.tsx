"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    ArrowUpRight,
    Smartphone,
    Zap,
    Gift,
    Plane,
    LayoutGrid,
    ShieldCheck,
    Lock,
    Monitor,
    ArrowRight,
    Clock,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { useOverviewSummary } from "@/lib/queries/overview";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";

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

const QUICK_ACTIONS = [
    { icon: Smartphone, label: "Airtime", href: "/services/airtime-data?tab=airtime" },
    { icon: Zap, label: "Data", href: "/services/airtime-data?tab=data" },
    { icon: Zap, label: "Electricity", href: "/services/pay-bills?provider=ikeja-electric" },
    { icon: Gift, label: "Gift cards", href: "/gift-cards" },
    { icon: Plane, label: "Flights", href: "/flights" },
    { icon: LayoutGrid, label: "All services", href: "/services" },
] as const;

export default function OverviewPage() {
    const { kycTier } = useAuth();
    const router = useRouter();
    const { data: summary, isLoading: summaryLoading } = useOverviewSummary();

    const kpiData = summary?.kpi;

    return (
        <div className="">
            
            {/* ── KYC Prompt Banner (Conditional) ──────────────────────── */}
            {kycTier !== "FULL_BVN_NIN" && (
                <div className="mb-6 sm:mb-8 flex items-center gap-3 rounded-[16px] border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm sm:gap-4 sm:px-6 sm:py-5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 sm:h-10 sm:w-10">
                        <ShieldCheck className="h-4 w-4 text-violet-700 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink sm:text-base">
                            Unlock ₦5M transfer limits
                        </p>
                        <p className="mt-0.5 hidden text-sm font-medium text-body sm:block">
                            You&apos;re 80% of the way there. Verify your BVN and NIN to unlock Tier 2.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/kyc")}
                        className="shrink-0 whitespace-nowrap font-bold text-xs bg-violet-700 text-white rounded-xl px-4 py-2 hover:bg-violet-600 transition-colors"
                    >
                        Verify now
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
                
                {/* Left column (2/3) - Main Dashboard (Hero, KPIs, Transactions) */}
                <div className="xl:col-span-2 space-y-6 sm:space-y-8">

                    {/* ── Hero balance card ─────────────────────────────────────────── */}
                    {summaryLoading ? (
                        <HeroCardSkeleton />
                    ) : summary ? (
                        <HeroCard
                            balance={summary.balance}
                            balanceUsd={summary.balanceUsd}
                            sparkline={summary.sparkline}
                            periodLabel="Last 7 days"
                        />
                    ) : null}

                    {/* ── Financial Insights (KPIs) ────────────────────────────────── */}
                    {summaryLoading ? (
                        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="rounded-[16px] border border-border bg-white p-5 shadow-sm space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-8 w-28" />
                                </div>
                            ))}
                        </div>
                    ) : kpiData ? (
                        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                            <KpiCard
                                label="Money in"
                                value={formatNaira(kpiData.moneyIn)}
                                change={{ value: 2, period: "deposits this month", customDirection: "up" }}
                            />
                            <KpiCard
                                label="Money out"
                                value={formatNaira(kpiData.moneyOut)}
                                change={{ value: -3, period: "payments this month", customDirection: "down" }}
                            />
                            <KpiCard
                                label="Net change"
                                value={`+${formatNaira(kpiData.netChange)}`}
                                change={{ value: "Across", period: "5 transactions", customDirection: "none" }}
                            />
                            <KpiCard
                                label="Pending"
                                value="₦0"
                                change={{ value: "Nothing", period: "waiting to clear", customDirection: "none" }}
                            />
                        </div>
                    ) : null}

                    {/* ── Recent Transactions ─────────────────────────────── */}
                    <Panel className="rounded-[24px]">
                        <PanelHeader
                            className="px-6 pt-6"
                            title="Recent transactions"
                            description="Your last 5 movements"
                            action={
                                <Link
                                    href="/transactions"
                                    className="flex items-center gap-1 text-sm font-bold text-violet-700 hover:text-violet-600 transition-colors"
                                >
                                    View all <ArrowRight className="h-4 w-4" />
                                </Link>
                            }
                        />
                        <PanelBody className="px-6 pb-4 pt-4">
                            {/* Table Header */}
                            <div className="grid grid-cols-[1fr_100px_100px_100px_120px] gap-4 pb-3 border-b border-border/50 text-[10px] font-bold uppercase tracking-widest text-muted hidden sm:grid">
                                <div>TRANSACTION</div>
                                <div>CATEGORY</div>
                                <div>DATE</div>
                                <div>STATUS</div>
                                <div className="text-right">AMOUNT</div>
                            </div>
                            
                            {summaryLoading ? (
                                <TableRowSkeleton rows={5} />
                            ) : summary?.recentTransactions?.length ? (
                                <div className="space-y-1 mt-2">
                                    {summary.recentTransactions.slice(0, 5).map((tx) => (
                                        <TransactionRow key={tx.id} tx={tx} variant="compact" />
                                    ))}
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

                {/* Right column (1/3) - Quick Actions & Account Health */}
                <div className="space-y-6 sm:space-y-8">
                    {/* ── Quick Actions ───────────────────────────────────── */}
                    <div className="space-y-4">
                        <h2 className="text-[15px] font-extrabold text-ink px-1">Quick actions</h2>
                        <Panel className="rounded-[24px] p-2 bg-white border border-border shadow-sm">
                            {summaryLoading ? (
                                <TileGridSkeleton count={6} className="grid-cols-2" />
                            ) : (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
                                    {QUICK_ACTIONS.map((action) => (
                                        <Tile
                                            key={action.label}
                                            icon={action.icon}
                                            label={action.label}
                                            onClick={() => router.push(action.href)}
                                        />
                                    ))}
                                </div>
                            )}
                        </Panel>
                    </div>

                    {/* ── Account Health ───────────────────────── */}
                    <div className="space-y-4">
                        <h2 className="text-[15px] font-extrabold text-ink px-1">Account health</h2>
                        <div className="rounded-[24px] border border-border bg-white shadow-sm overflow-hidden flex flex-col">
                            {/* KYC */}
                            <div className="flex items-center gap-4 p-4 border-b border-border/50 hover:bg-violet-50/50 transition-colors cursor-pointer" onClick={() => router.push("/kyc")}>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50">
                                    <ShieldCheck className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-ink">KYC verification</p>
                                    <p className="text-xs font-medium text-muted">Tier 2 · limits raised</p>
                                </div>
                                <Tag variant="ok">Verified</Tag>
                            </div>
                            
                            {/* 2FA */}
                            <div className="flex items-center gap-4 p-4 border-b border-border/50 hover:bg-violet-50/50 transition-colors cursor-pointer" onClick={() => router.push("/security")}>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50">
                                    <Lock className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-ink">Two-factor authentication</p>
                                    <p className="text-xs font-medium text-muted">Authenticator app</p>
                                </div>
                                <Tag variant="ok">On</Tag>
                            </div>
                            
                            {/* Trusted Devices */}
                            <div className="flex items-center gap-4 p-4 hover:bg-violet-50/50 transition-colors cursor-pointer" onClick={() => router.push("/security")}>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                                    <Monitor className="h-5 w-5 text-violet-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-ink">Trusted devices</p>
                                    <p className="text-xs font-medium text-muted">3 devices signed in</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted" />
                            </div>
                        </div>
                    </div>

                    {/* ── Rate Watch ───────────────────────────── */}
                    <div className="rounded-[24px] border border-border bg-white shadow-sm p-6 sm:p-7">
                        <div className="mb-6">
                            <h2 className="text-[15px] font-extrabold text-ink">Rate watch</h2>
                            <p className="text-[13px] font-medium text-muted mt-0.5">USDT → NGN, updated hourly</p>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4">
                            <span className="font-sans tabular-nums text-[28px] font-extrabold tracking-tighter text-ink leading-none">
                                ₦1,562.50
                            </span>
                            <div className="inline-flex items-center gap-0.5 rounded-md bg-green-50 px-1.5 py-0.5 text-[11px] font-bold text-green-700">
                                <ArrowUpRight className="h-3 w-3" />
                                0.8%
                            </div>
                        </div>
                        
                        <p className="text-[13px] font-medium text-muted leading-relaxed mb-6">
                            Deposits are converted at the rate shown when the network confirms your transfer.
                        </p>
                        
                        <button
                            onClick={() => router.push("/receive-crypto")}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 py-3 text-sm font-bold text-violet-700 hover:bg-violet-100 transition-colors"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Show deposit address
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
