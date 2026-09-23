"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock3, Coins, Gift, HelpCircle, Layers, Users } from "lucide-react";

import { PodsIntroGuide } from "@/components/pods/pods-intro-guide";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { Skeleton } from "@/components/shared/skeletons";
import { Tag, type TagVariant } from "@/components/shared/tag";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatDateTime } from "@/lib/date";
import { formatByCurrency } from "@/lib/format";
import {
    usePodCashback,
    useTodayPods,
    type PodCashbackItem,
    type PodPhase,
    type PodSnapshot,
    type PodTransactionType,
} from "@/lib/queries/pods";
import { useUiStore } from "@/lib/stores/ui-store";

/** This guide's key in the ui-store's `seenGuides` map — see PodsIntroGuide. */
const PODS_GUIDE_KEY = "pods-intro";

const TYPE_META: Record<
    PodTransactionType,
    { label: string; cardLabel: string; icon: typeof Coins; cta: { label: string; href: string } }
> = {
    CRYPTO_SELL: {
        label: "Crypto sales",
        cardLabel: "Crypto sale",
        icon: Coins,
        cta: { label: "Receive crypto", href: "/receive-crypto" },
    },
    GIFT_CARD_SALE: {
        label: "Gift card sales",
        cardLabel: "Gift card sale",
        icon: Gift,
        cta: { label: "Sell a gift card", href: "/gift-cards" },
    },
};

const PHASE_META: Record<PodPhase, { label: string; variant: TagVariant }> = {
    FILLING: { label: "Filling", variant: "ok" },
    FULL: { label: "Full, being sold", variant: "warn" },
    COMPLETED: { label: "Sold", variant: "neutral" },
};

function formatCountdown(milliseconds: number): string {
    if (milliseconds <= 0) return "Closing now";
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `Closes in ${hours}h ${minutes}m` : `Closes in ${minutes}m`;
}

function plural(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** What the customer should understand about where this pod stands, including that a full pod turns later same-day sales away. */
function phaseMessage(snapshot: PodSnapshot): string {
    switch (snapshot.phase) {
        case "FILLING":
            return `${plural(Math.max(0, snapshot.targetCount - snapshot.currentCount), "more sale")} to fill today's pod.`;
        case "FULL":
            return "Today's pod is full and is being sold. Sales made from now on won't join today's pod.";
        case "COMPLETED":
            return "Today's pod has been sold. Any cashback you earned is in your wallet as a Cashback credit.";
    }
}

export default function PodsPage() {
    const today = useTodayPods();
    const [page, setPage] = React.useState(1);
    const cashback = usePodCashback(page);
    const [now, setNow] = React.useState(() => Date.now());

    // Interactive first-run guide (see PodsIntroGuide) — opens itself once,
    // ever, per the ui-store's persisted seenGuides flag, and is always
    // reachable afterwards through the help icon below. `hasSeenGuide`
    // reads localStorage-backed state that isn't available during SSR, so
    // this only ever opens client-side, post-hydration, via the effect
    // below — never as an SSR-mismatched initial render.
    const hasSeenIntro = useUiStore((state) => state.hasSeenGuide(PODS_GUIDE_KEY));
    const markIntroSeen = useUiStore((state) => state.markGuideSeen);
    const [introOpen, setIntroOpen] = React.useState(false);

    React.useEffect(() => {
        if (!hasSeenIntro) setIntroOpen(true);
        // Only ever auto-opens once, on the visit where the flag is still
        // unset — deliberately not reacting to `hasSeenIntro` flipping true,
        // which happens as a *result* of this same open/close cycle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const closeIntro = () => {
        setIntroOpen(false);
        if (!hasSeenIntro) markIntroSeen(PODS_GUIDE_KEY);
    };

    React.useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30000);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-12">
            <div className="flex animate-in items-start justify-between gap-3 fade-in slide-in-from-bottom-2 py-4 duration-500">
                <div>
                    <h1 className="text-2xl font-bold text-ink">Pods</h1>
                    <p className="mt-1 text-sm text-body">
                        Sales pool together each day, and when the batch sells for more, you share the extra.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIntroOpen(true)}
                    aria-label="How Pods work"
                    title="How Pods work"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/5"
                >
                    <HelpCircle className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            <PodsIntroGuide open={introOpen} onClose={closeIntro} />

            <HowItWorks />

            <section aria-labelledby="today-heading" className="space-y-3">
                <h2 id="today-heading" className="px-1 text-[15px] font-extrabold text-ink">
                    Today&apos;s pods
                </h2>

                {today.isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-44 w-full rounded-lg" />
                        <Skeleton className="h-44 w-full rounded-lg" />
                    </div>
                ) : today.isError ? (
                    <Panel>
                        <p className="text-sm text-red-600">Today&apos;s pods are temporarily unavailable.</p>
                    </Panel>
                ) : !today.data?.length ? (
                    <Panel>
                        <p className="text-sm text-body">There are no pods for your wallet today.</p>
                    </Panel>
                ) : (
                    <div className="space-y-3">
                        {today.data.map((snapshot, index) => (
                            <motion.div
                                key={snapshot.transactionType}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
                            >
                                <PodCard snapshot={snapshot} now={now} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            <Panel flush>
                <PanelHeader
                    className="px-5 pt-5"
                    title="Your pod cashback"
                    description="Paid to your wallet after a pod sells above your rate."
                />
                <PanelBody className="p-0">
                    <CashbackBody
                        isLoading={cashback.isLoading}
                        isError={cashback.isError}
                        data={cashback.data}
                        page={page}
                        onPageChange={setPage}
                    />
                </PanelBody>
            </Panel>
        </div>
    );
}

function HowItWorks() {
    const steps = [
        {
            title: "You're paid instantly",
            body: "Every crypto or gift card sale lands in your wallet straight away at your quoted rate. That payout is final.",
        },
        {
            title: "Sales pool together",
            body: "NePay groups the day's sales into a pod and sells the whole batch once the pod fills.",
        },
        {
            title: "Better rate? You share it",
            body: "If the batch sells for more than your rate, the difference is paid to you as cashback. If it doesn't, nothing changes. Cashback is a bonus, never guaranteed.",
        },
    ];

    return (
        <Panel>
            <PanelHeader title="How pods work" />
            <PanelBody>
                <ol className="grid gap-4 sm:grid-cols-3">
                    {steps.map((step, index) => (
                        <li key={step.title} className="flex gap-3">
                            <span
                                aria-hidden="true"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[13px] font-black text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                            >
                                {index + 1}
                            </span>
                            <div className="min-w-0">
                                <p className="font-bold text-ink">{step.title}</p>
                                <p className="mt-1 text-[13px] leading-relaxed text-body">{step.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </PanelBody>
        </Panel>
    );
}

function PodCard({ snapshot, now }: { snapshot: PodSnapshot; now: number }) {
    const meta = TYPE_META[snapshot.transactionType];
    const phase = PHASE_META[snapshot.phase];
    const Icon = meta.icon;
    const pct = snapshot.targetCount > 0 ? Math.min(100, (snapshot.currentCount / snapshot.targetCount) * 100) : 0;
    const closesIn = new Date(snapshot.cycleEndsAt).getTime() - now;

    return (
        <Panel className="overflow-hidden">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-ink">{meta.label}</h3>
                        <p className="text-[13px] text-muted">
                            {snapshot.currency} · {formatDate(snapshot.cycleDate)}
                        </p>
                    </div>
                </div>
                <Tag variant={phase.variant} dot>
                    {phase.label}
                </Tag>
            </div>

            <div className="mt-5">
                <div className="flex items-baseline justify-between gap-3">
                    <p className="font-mono text-2xl font-black text-ink">
                        {snapshot.currentCount.toLocaleString()}
                        <span className="text-base font-bold text-muted"> / {snapshot.targetCount.toLocaleString()}</span>
                    </p>
                    <p className="font-mono text-sm font-bold text-body">{Math.floor(pct)}%</p>
                </div>
                <div
                    role="progressbar"
                    aria-label={`${meta.label} pod progress`}
                    aria-valuemin={0}
                    aria-valuemax={snapshot.targetCount}
                    aria-valuenow={snapshot.currentCount}
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
                >
                    <motion.div
                        className={
                            snapshot.phase === "FILLING"
                                ? "h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                                : "h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        }
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </div>
            </div>

            <p className="mt-3 text-sm text-body">{phaseMessage(snapshot)}</p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-3 text-[13px]">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
                    {snapshot.phase !== "COMPLETED" && (
                        <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatCountdown(closesIn)}
                        </span>
                    )}
                    {snapshot.yourContributions > 0 ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-violet-700 dark:text-violet-300">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            You have {plural(snapshot.yourContributions, "sale")} in this pod
                        </span>
                    ) : (
                        snapshot.phase === "FILLING" && <span>You have no sales in this pod yet</span>
                    )}
                </div>
                {snapshot.phase === "FILLING" && (
                    <Link
                        href={meta.cta.href}
                        className="font-bold text-violet-700 transition-colors hover:text-violet-600 dark:text-violet-300"
                    >
                        {meta.cta.label} →
                    </Link>
                )}
            </div>
        </Panel>
    );
}

function CashbackBody({
    isLoading,
    isError,
    data,
    page,
    onPageChange,
}: {
    isLoading: boolean;
    isError: boolean;
    data: ReturnType<typeof usePodCashback>["data"];
    page: number;
    onPageChange: (page: number) => void;
}) {
    if (isLoading) {
        return (
            <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => (
                    <Skeleton key={item} className="h-14 w-full" />
                ))}
            </div>
        );
    }

    if (isError || !data) {
        return <p className="p-5 text-sm text-red-600">Your pod cashback is temporarily unavailable.</p>;
    }

    if (!data.items.length && data.total === 0) {
        return (
            <EmptyState
                icon={Layers}
                heading="No pod cashback yet"
                description="When a pod you're in sells above your rate, the difference is credited to your wallet and shows up here."
                className="py-10"
            />
        );
    }

    return (
        <div>
            {data.totals.length > 0 && (
                <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-border px-5 pb-4">
                    {data.totals.map((total) => (
                        <div key={total.currency}>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                Total earned{data.totals.length > 1 ? ` · ${total.currency}` : ""}
                            </p>
                            <p className="mt-1 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {formatByCurrency(total.amount, total.currency)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <ul className="divide-y divide-border">
                {data.items.map((item) => (
                    <CashbackRow key={item.id} item={item} />
                ))}
            </ul>

            {data.pages > 1 && (
                <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                    <button
                        type="button"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
                    >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Newer
                    </button>
                    <span className="text-[13px] text-muted">
                        Page {data.page} of {data.pages}
                    </span>
                    <button
                        type="button"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= data.pages}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
                    >
                        Older <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
}

function CashbackRow({ item }: { item: PodCashbackItem }) {
    const meta = TYPE_META[item.transactionType];
    const Icon = meta.icon;

    return (
        <li className="flex items-center gap-3 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">{meta.cardLabel} cashback</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                    Pod of {formatDate(item.cycleDate)}
                    {item.paidAt ? ` · paid ${formatDateTime(item.paidAt)}` : ""}
                </p>
            </div>
            <p className="shrink-0 font-mono text-[15px] font-black text-emerald-600 dark:text-emerald-400">
                +{formatByCurrency(item.cashbackAmount, item.currency)}
            </p>
        </li>
    );
}
