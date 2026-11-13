"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Circle, Loader2, LifeBuoy } from "lucide-react";

import { IconArrowLeft as ArrowLeft } from "@/components/icons";
import { Button } from "@/components/shared/button";
import { cn } from "@/lib/cn";
import { useCryptoDepositStatus, useOpenDepositSupport } from "@/lib/queries/crypto";
import type { CryptoDepositStage, CryptoDepositStatusDto } from "@/lib/types/api";
import { DepositBreakdown, trimAmount } from "./deposit-breakdown";

/** How long a customer who says they have sent a payment waits on "waiting" before we offer "can't see your payment?" help. */
const WAITING_HELP_AFTER_MS = 5 * 60_000;

const STEPS: Array<{ stage: CryptoDepositStage; label: string }> = [
    { stage: "awaiting_payment", label: "Waiting for your payment" },
    { stage: "detected", label: "Payment detected" },
    { stage: "confirming", label: "Confirming on the network" },
    { stage: "processing", label: "Crediting your wallet" },
    { stage: "credited", label: "Credited" },
];

const STEP_ORDER: Record<string, number> = {
    awaiting_payment: 0,
    detected: 1,
    confirming: 2,
    processing: 3,
    credited: 4,
    partial_credited: 4,
};

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

interface Headline {
    tone: "pending" | "success" | "warning" | "error";
    title: string;
    body: string;
}

function headlineFor(status: CryptoDepositStatusDto, coin: string): Headline {
    const seen = status.actuallyPaid != null ? `${trimAmount(status.actuallyPaid)} ${coin}`.trim() : null;

    switch (status.stage) {
        case "awaiting_payment":
            return {
                tone: "pending",
                title: "Waiting for your payment",
                body: "We are watching for your transfer. As soon as it shows up on the network it will appear here — you don't need to keep refreshing.",
            };
        case "detected":
            return {
                tone: "pending",
                title: "Payment detected",
                body: `We can see ${seen ?? "your payment"}. It is now being confirmed on the network.`,
            };
        case "confirming":
            return { tone: "pending", title: "Confirming on the network", body: "Your payment is on its way — this step depends on the network and usually takes a few minutes." };
        case "processing":
            return { tone: "pending", title: "Crediting your wallet", body: "Your payment is confirmed. We are adding it to your wallet now." };
        case "credited":
            return { tone: "success", title: "Deposit complete", body: "The money is in your wallet." };
        case "partial_credited":
            return {
                tone: "warning",
                title: "Partial payment credited",
                body: `You sent less than the ${trimAmount(status.expectedAmount)} ${coin} requested. What arrived has been credited to your wallet after fees.`,
            };
        case "under_review":
            return { tone: "warning", title: "We're checking your payment", body: "Your payment arrived and we are checking the amount before crediting it. This is a normal safety step." };
        case "expired":
            return { tone: "error", title: "This deposit window has closed", body: "If you sent a payment after it closed, contact support and we will trace it." };
        case "failed":
            return { tone: "error", title: "This deposit did not complete", body: "If money left your wallet, contact support with your transaction ID and we will trace it." };
        case "refunded":
            return { tone: "warning", title: "This deposit was refunded", body: "The payment was returned to you." };
    }
}

const TONE_CLASSES = {
    pending: "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900/30 dark:bg-violet-900/10 dark:text-violet-300",
    success: "border-green-200 bg-green-50 text-green-900 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-300",
    warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300",
    error: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300",
} as const;

interface DepositProgressViewProps {
    paymentId: string;
    assetCode: string;
    coinSymbol: string | null;
    onBackToAddress: () => void;
    isMobile?: boolean;
}

/**
 * The screen a customer lands on after tapping "I have made the deposit":
 * where their payment is, in plain steps, with the time each was reached —
 * and, when something is slow or missing, a one-tap route to an URGENT
 * support chat that already carries the deposit's references.
 *
 * Honest by construction: it never claims a payment was detected until the
 * server says money was actually seen, and it never claims "credited" until the
 * credit has posted. Provider-side detail is not shown to the customer.
 */
export function DepositProgressView({ paymentId, assetCode, coinSymbol, onBackToAddress, isMobile = false }: DepositProgressViewProps) {
    const { data: status } = useCryptoDepositStatus(paymentId);
    const [openedAt] = React.useState(() => Date.now());
    const [now, setNow] = React.useState(() => Date.now());

    React.useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 15_000);
        return () => clearInterval(id);
    }, []);

    const coin = coinSymbol ?? assetCode.toUpperCase();

    if (!status) {
        return (
            <div className={cn("flex items-center justify-center gap-2 py-16 text-muted", !isMobile && "h-full")}>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-semibold">Checking your deposit…</span>
            </div>
        );
    }

    const headline = headlineFor(status, coin);
    const reached = new Map(status.timeline.map((entry) => [entry.stage, entry.at]));
    const currentIndex = STEP_ORDER[status.stage] ?? 0;
    const inFlight = ["awaiting_payment", "detected", "confirming", "processing"].includes(status.stage);
    const waitedLong = status.stage === "awaiting_payment" && now - openedAt > WAITING_HELP_AFTER_MS;
    const needsHelp = status.delayed || status.stage === "under_review" || status.stage === "failed" || status.stage === "expired" || waitedLong;

    return (
        <div className={cn("mx-auto w-full", isMobile ? "pt-4" : "flex h-full flex-col")}>
            <div className={cn("mb-4 flex shrink-0 items-center gap-3", !isMobile && "px-6 pt-6")}>
                <button
                    onClick={onBackToAddress}
                    aria-label="Back to the deposit address"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-ink transition-colors hover:bg-gray-50 dark:bg-white/5 dark:hover:bg-white/10"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                    <h1 className="truncate text-xl font-black tracking-tight text-ink">Tracking your {coin} deposit</h1>
                    <p className="mt-0.5 text-sm font-medium text-muted">You can leave this screen — progress also shows on your home page.</p>
                </div>
            </div>

            <div className={cn("flex flex-1 flex-col gap-5", !isMobile && "overflow-y-auto px-6 pb-6")}>
                <div className={cn("rounded-2xl border px-5 py-4", TONE_CLASSES[headline.tone])} role="status" aria-live="polite">
                    <div className="flex items-center gap-2.5">
                        {inFlight ? (
                            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                        ) : headline.tone === "success" ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                        ) : (
                            <AlertCircle className="h-5 w-5 shrink-0" />
                        )}
                        <p className="text-base font-black">{headline.title}</p>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-relaxed">{headline.body}</p>
                </div>

                {(status.stage === "credited" || status.stage === "partial_credited") && (
                    <DepositBreakdown statusData={status} coinSymbol={coinSymbol} assetCode={assetCode} />
                )}

                <ol className="rounded-2xl border border-border bg-white p-5 dark:bg-white/5">
                    {STEPS.map((step, index) => {
                        const isFinal = index === STEPS.length - 1;
                        const stage: CryptoDepositStage = isFinal && status.stage === "partial_credited" ? "partial_credited" : step.stage;
                        const at = reached.get(stage) ?? reached.get(step.stage);
                        const done = index < currentIndex || (isFinal && (status.stage === "credited" || status.stage === "partial_credited"));
                        const current = index === currentIndex && inFlight;
                        const label = isFinal && status.stage === "partial_credited" ? "Partial payment credited" : step.label;

                        return (
                            <li key={step.stage} className="flex items-start gap-3 py-2">
                                <span className="mt-0.5 shrink-0">
                                    {done ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : current ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-gray-300 dark:text-white/20" />
                                    )}
                                </span>
                                <div className="flex flex-1 items-baseline justify-between gap-3">
                                    <span className={cn("text-sm font-bold", done || current ? "text-ink" : "text-muted")}>{label}</span>
                                    {at && (done || current) ? <span className="shrink-0 text-xs font-semibold text-muted">{formatTime(at)}</span> : null}
                                </div>
                            </li>
                        );
                    })}
                </ol>

                {status.delayed && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium leading-relaxed text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300">
                        This is taking longer than usual. Your money is not lost — if you would like us to look into it now, contact support below.
                    </div>
                )}

                {needsHelp ? <SupportHandoff paymentId={paymentId} supportReference={status.supportReference} /> : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/overview" className="flex-1">
                        <Button variant="primary" className="h-12 w-full rounded-2xl font-black">
                            Back to wallet
                        </Button>
                    </Link>
                    {status.stage === "awaiting_payment" ? (
                        <Button variant="quiet" className="h-12 flex-1 rounded-2xl font-bold" onClick={onBackToAddress}>
                            Show the address again
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

/**
 * "Contact support" for one deposit. One tap opens an URGENT chat under the
 * deposit category, already containing the deposit's references; an optional
 * transaction ID makes it faster to trace. If a chat was already opened it
 * shows its reference instead of opening another.
 */
function SupportHandoff({ paymentId, supportReference }: { paymentId: string; supportReference: string | null }) {
    const { mutate: openSupport, isPending, isError, data } = useOpenDepositSupport();
    const [hash, setHash] = React.useState("");
    const reference = data?.referenceNumber ?? supportReference;

    if (reference) {
        return (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 dark:border-violet-900/30 dark:bg-violet-900/10">
                <p className="text-sm font-bold text-violet-900 dark:text-violet-300">
                    Support has your details — reference <span className="font-black">{reference}</span>.
                </p>
                <p className="mt-1 text-sm font-medium text-violet-800 dark:text-violet-400">We will reply in your support chat.</p>
                <Link href="/support" className="mt-3 inline-block">
                    <Button variant="primary" size="sm" className="rounded-xl font-bold">
                        Open the chat
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border bg-white p-5 dark:bg-white/5">
            <div className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-violet-600" />
                <p className="text-sm font-black text-ink">Need help with this deposit?</p>
            </div>
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
                We will open an urgent chat with everything support needs already filled in. If you have your transaction ID (from your wallet or exchange), add it
                to make this faster.
            </p>
            <input
                value={hash}
                onChange={(event) => setHash(event.target.value)}
                placeholder="Transaction ID (optional)"
                maxLength={200}
                className="mt-3 w-full rounded-xl border border-border bg-gray-50 px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-violet-400 dark:bg-white/5"
            />
            {isError ? <p className="mt-2 text-sm font-semibold text-red-600">We could not open the chat. Please try again.</p> : null}
            <Button
                variant="primary"
                className="mt-3 h-11 w-full rounded-xl font-black"
                disabled={isPending}
                onClick={() => openSupport({ paymentId, transactionHash: hash })}
            >
                {isPending ? "Opening chat…" : "Talk to support now"}
            </Button>
        </div>
    );
}
