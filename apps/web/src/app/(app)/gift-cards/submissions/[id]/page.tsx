"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconCheck as Check, IconClock as Clock, IconClose as X, IconSearch as Search, IconArrowLeft as ArrowLeft } from "@/components/icons";
import { ArrowDownToLine, Banknote } from "lucide-react";;

import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useGiftCardOrder } from "@/lib/queries/gift-cards";

import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";

export default function SubmissionTrackerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { data: order, isLoading } = useGiftCardOrder(params.id);

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
                <p className="text-sm font-medium text-muted">Loading submission...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
                <p className="text-lg font-medium text-ink">Submission not found</p>
                <Button variant="ghost" onClick={() => router.push("/gift-cards")}>
                    Back to Gift Cards
                </Button>
            </div>
        );
    }

    // PENDING_REVIEW/APPROVED/REJECTED — the same three states shown in
    // transaction history, never folded into a generic "processing" label:
    // this is a human review in progress, not provider latency.
    const status = order.status;
    const isPending = status === "PENDING_REVIEW";
    const isApproved = status === "APPROVED";
    const isRejected = status === "REJECTED";

    return (
        <div className="mx-auto max-w-lg space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push("/gift-cards")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-2xl font-bold text-ink">Submission Tracker</h1>
            </div>

            <Panel>
                <PanelBody className="p-8">
                    <div className="space-y-8">
                        {/* Summary Header */}
                        <div className="text-center">
                            <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
                                {order.cardBrand} Gift Card
                            </h2>
                            <p className="mt-1 font-mono text-3xl font-bold text-ink">
                                ${parseFloat(order.faceValueUsd || "0").toFixed(2)}
                            </p>
                        </div>

                        {/* Vertical Stepper */}
                        <div className="relative pl-10 py-4">
                            {/* Connecting Line — sits behind the icon circles */}
                            <div className="absolute bottom-4 left-[19px] top-4 w-0.5 bg-border" />

                            <div className="space-y-8 relative">
                                {/* Step 1: Submitted */}
                                <div className="relative flex items-start gap-4">
                                    <div className="absolute -left-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#1C1C1E] bg-violet-600 text-trueWhite">
                                        <ArrowDownToLine className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-ink">
                                            Card Submitted
                                        </h3>
                                        <p className="text-xs text-muted mt-1">We have received your gift card details.</p>
                                    </div>
                                </div>

                                {/* Step 2: Under Review */}
                                <div className="relative flex items-start gap-4">
                                    <div className={cn(
                                        "absolute -left-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#1C1C1E]",
                                        isPending ? "bg-amber-500 text-trueWhite" : "bg-violet-600 text-trueWhite"
                                    )}>
                                        {isPending ? <Clock className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-ink">
                                            {isPending ? "Under Review" : "Reviewed"}
                                        </h3>
                                        <p className="text-xs text-muted mt-1">
                                            {isPending
                                                ? "A member of our team is checking this card — usually under 30 minutes. You'll be notified once it clears."
                                                : "This card's review is complete."}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3: Terminal State (Approved / Rejected) */}
                                <div className="relative flex items-start gap-4">
                                    <div className={cn(
                                        "absolute -left-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#1C1C1E]",
                                        isApproved ? "bg-green-500 text-trueWhite" :
                                        isRejected ? "bg-red-500 text-trueWhite" : "bg-gray-100 dark:bg-gray-700 text-muted"
                                    )}>
                                        {isRejected ? <X className="h-4 w-4" /> :
                                         isApproved ? <Check className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <h3 className={cn("text-sm font-semibold",
                                            isApproved ? "text-green-600" :
                                            isRejected ? "text-red-600" : "text-muted"
                                        )}>
                                            {isApproved ? "Payout Sent" : isRejected ? "Card Rejected" : "Get Paid"}
                                        </h3>

                                        {isApproved && (
                                            <p className="text-xs text-muted mt-1">
                                                <span className="font-bold text-ink">{formatNaira(parseFloat(order.payoutAmount))}</span> has been added to your wallet.
                                            </p>
                                        )}
                                        {isRejected && (
                                            <p className="text-xs text-red-500/80 mt-1">
                                                This card could not be approved. No amount was ever added to your wallet for it.
                                            </p>
                                        )}
                                        {isPending && (
                                            <p className="text-xs text-muted mt-1">No payout yet — nothing is added to your wallet until review clears.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terminal Actions */}
                        {isApproved && (
                            <div className="pt-4 border-t border-border">
                                <Button variant="primary" fullWidth size="lg" onClick={() => router.push("/gift-cards")}>
                                    Back to Gift Cards
                                </Button>
                            </div>
                        )}
                        {isRejected && (
                            <div className="pt-4 border-t border-border">
                                <Button variant="danger" fullWidth size="lg" onClick={() => router.back()}>
                                    Try Another Card
                                </Button>
                            </div>
                        )}
                    </div>
                </PanelBody>
            </Panel>
        </div>
    );
}
