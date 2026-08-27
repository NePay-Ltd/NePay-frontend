"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    Smartphone,
    Lightbulb,
    Gift,
    Plane,
    ShieldCheck,
    ArrowRight,
    Clock,
    Dices,
    Tv,
    Wifi,
    MoreHorizontal,
    ChevronRight,
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
import { TransactionDetailModal, type TransactionDetailData } from "@/components/shared/transaction-detail-modal";
import { BaseTransaction } from "@/components/shared/transaction-row";
import {
    HeroCardSkeleton,
    TableRowSkeleton,
    TileGridSkeleton,
    Skeleton,
} from "@/components/shared/skeletons";

const QUICK_ACTIONS = [
    { label: "Airtime", icon: Smartphone, href: "/services/airtime", bg: "bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/40 transition-all duration-200 cursor-pointer group", iconColor: "text-indigo-400" },
    { label: "Data", icon: Wifi, href: "/services/data", bg: "bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/40 transition-all duration-200 cursor-pointer group", iconColor: "text-blue-400" },
    { label: "Flight", icon: Plane, href: "/flights", bg: "bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/40 transition-all duration-200 cursor-pointer group", iconColor: "text-emerald-400" },
    { label: "TV", icon: Tv, href: "/services/tv", bg: "bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/40 transition-all duration-200 cursor-pointer group", iconColor: "text-rose-400" },
    { label: "Gift Card", icon: Gift, href: "/gift-cards", bg: "bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/40 transition-all duration-200 cursor-pointer group", iconColor: "text-amber-400" },
    { label: "More", icon: MoreHorizontal, href: "/services", bg: "bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/40 transition-all duration-200 cursor-pointer group", iconColor: "text-zinc-400 group-hover:text-zinc-200" },
] as const;

export default function OverviewPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { data: summary, isLoading: queryLoading } = useOverviewSummary();

    const [isMounted, setIsMounted] = React.useState(false);
    const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionDetailData | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const summaryLoading = !isMounted || queryLoading;

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

    const kpiData = summary?.kpi;

    return (
        <div className="pb-12 sm:pb-16 pt-2 sm:pt-0">
            
            {/* ── KYC Prompt Banner (Conditional) ──────────────────────── */}
            {isMounted && !user?.kycVerified && (
                <div className="mb-6 sm:mb-8 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm sm:gap-4 sm:px-6 sm:py-5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 sm:h-10 sm:w-10">
                        <ShieldCheck className="h-4 w-4 text-violet-700 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-violet-950 sm:text-base">
                            Unlock ₦5M transfer limits
                        </p>
                        <p className="mt-0.5 hidden text-sm font-medium text-violet-800 sm:block">
                            Verify your BVN to unlock full account limits — it takes under 2 minutes.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/kyc")}
                        className="shrink-0 whitespace-nowrap font-bold text-[13px] bg-violet-700 text-white rounded-full px-5 py-2.5 hover:bg-violet-600 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                    >
                        Verify now <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="space-y-6 sm:space-y-8">

                    {/* ── Hero balance card ─────────────────────────────────────────── */}
                    {summaryLoading || !summary ? (
                        <div className="w-full h-[250px] bg-white border border-border rounded-3xl animate-pulse" />
                    ) : (
                        <HeroCard
                            balance={summary.balance}
                            balanceUsd={summary.balanceUsd}
                            preferredCurrency={summary.preferredCurrency}
                            preferredCurrencyEquivalent={summary.preferredCurrencyEquivalent}
                            sparkline={summary.sparkline}
                            periodLabel="Last 7 days"
                        />
                    )}

                    {/* ── Quick Actions (ALL SCREENS) ──────────────────────── */}
                    <div className="space-y-4">
                        <h2 className="text-[15px] font-extrabold text-ink px-1">Quick actions</h2>

                        <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
                            {summaryLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <div key={i} className="w-full h-[96px] bg-white border border-border rounded-2xl animate-pulse" />
                                ))
                            ) : (
                                <>
                                    {QUICK_ACTIONS.map((action) => (
                                        <motion.button
                                            key={action.label}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => router.push(action.href)}
                                            className={cn(
                                                "w-full flex flex-col items-center justify-center rounded-3xl p-4 sm:p-5 transition-all shadow-sm",
                                                action.bg
                                            )}
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800/30 mb-2">
                                                <action.icon className={cn("w-6 h-6", action.iconColor)} stroke="currentColor" />
                                            </div>
                                            <span className="text-[13px] sm:text-[15px] font-bold leading-tight text-zinc-100 transition-colors duration-200">{action.label}</span>
                                        </motion.button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>


                    {/* ── Recent Transactions ─────────────────────────────── */}
                    <Panel className="rounded-3xl" flush>
                        <PanelHeader
                            className="px-4 pt-4 sm:px-6 sm:pt-6"
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
                        <PanelBody className="px-4 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-4">
                            {summaryLoading ? (
                                <div className="space-y-1 mt-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="p-3 flex items-center gap-4 bg-transparent rounded-xl">
                                            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-3.5 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                            <div className="space-y-2 flex flex-col items-end shrink-0">
                                                <Skeleton className="h-3.5 w-16" />
                                                <Skeleton className="h-3 w-12" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : summary?.recentTransactions?.length ? (
                                <div className="space-y-1 mt-2">
                                    {summary.recentTransactions.slice(0, 5).map((tx) => (
                                        <TransactionRow key={tx.id} tx={tx} variant="compact" onViewReceipt={handleViewReceipt} />
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

                    {/* Transaction Detail Modal */}
                    <TransactionDetailModal
                        open={modalOpen}
                        onOpenChange={setModalOpen}
                        transaction={selectedTransaction}
                        onViewFullDetail={(txId) => router.push(`/transactions/${txId}`)}
                    />
            </div>
        </div>
    );
}
