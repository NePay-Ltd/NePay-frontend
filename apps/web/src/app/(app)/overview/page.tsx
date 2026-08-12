"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    Smartphone,
    Zap,
    Gift,
    Plane,
    ShieldCheck,
    ArrowRight,
    Clock,
    Tv,
    Wifi,
    MoreHorizontal,
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
    { icon: Smartphone, label: "Airtime", href: "/services/airtime-data?tab=airtime", color: "text-violet-600", bg: "bg-violet-50" },
    { icon: Wifi, label: "Data", href: "/services/airtime-data?tab=data", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Zap, label: "Electricity", href: "/services/pay-bills?provider=ikeja-electric", color: "text-amber-500", bg: "bg-amber-50" },
    { icon: Plane, label: "Flights", href: "/flights", color: "text-teal-600", bg: "bg-teal-50" },
    { icon: Tv, label: "Cable TV", href: "/services/pay-bills?provider=dstv", color: "text-pink-600", bg: "bg-pink-50" },
    { icon: Gift, label: "Gift Cards", href: "/gift-cards", color: "text-green-600", bg: "bg-green-50" },
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

            <div className="space-y-6 sm:space-y-8">

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

                    {/* ── Quick Actions (ALL SCREENS) ──────────────────────── */}
                    <div className="space-y-4">
                        <h2 className="text-[15px] font-extrabold text-ink px-1">Quick actions</h2>

                        {/* Mobile: horizontal scroll */}
                        <div className="flex xl:hidden gap-3 overflow-x-auto pb-1 no-scrollbar">
                            {summaryLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <div key={i} className="flex-none w-[100px] h-[96px] bg-white border border-border rounded-[16px] animate-pulse" />
                                ))
                            ) : (
                                <>
                                    {QUICK_ACTIONS.map((action) => (
                                        <button
                                            key={action.label}
                                            onClick={() => router.push(action.href)}
                                            className="flex-none w-[100px] flex flex-col items-start gap-3 rounded-[16px] border border-border bg-white p-4 shadow-sm active:scale-95 transition-transform text-left"
                                        >
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${action.bg}`}>
                                                <action.icon className={`h-5 w-5 ${action.color}`} />
                                            </div>
                                            <span className="text-xs font-bold text-ink leading-tight">{action.label}</span>
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => router.push("/services")}
                                        className="flex-none w-[100px] flex flex-col items-start gap-3 rounded-[16px] border border-border bg-white p-4 shadow-sm active:scale-95 transition-transform text-left"
                                    >
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                                            <MoreHorizontal className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <span className="text-xs font-bold text-ink leading-tight">More</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Desktop: 7-col grid */}
                        <div className="hidden xl:grid grid-cols-7 gap-3">
                            {QUICK_ACTIONS.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => router.push(action.href)}
                                    className="flex flex-col items-start gap-3 rounded-[16px] border border-border bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all text-left"
                                >
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${action.bg}`}>
                                        <action.icon className={`h-5 w-5 ${action.color}`} />
                                    </div>
                                    <span className="text-xs font-bold text-ink leading-tight">{action.label}</span>
                                </button>
                            ))}
                            <button
                                onClick={() => router.push("/services")}
                                className="flex flex-col items-start gap-3 rounded-[16px] border border-border bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all text-left"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                                </div>
                                <span className="text-xs font-bold text-ink leading-tight">More</span>
                            </button>
                        </div>
                    </div>


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
        </div>
    );
}
