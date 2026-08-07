"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
    Check,
    Clock,
    X,
    UploadCloud,
    Search,
    Banknote,
    ArrowLeft
} from "lucide-react";

import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useGiftCardSubmissionStatus } from "@/lib/queries/gift-cards";

import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";

export default function SubmissionTrackerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { data: submission, isLoading } = useGiftCardSubmissionStatus(params.id);

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
                <p className="text-sm font-medium text-muted">Loading submission...</p>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
                <p className="text-lg font-medium text-ink">Submission not found</p>
                <Button variant="ghost" onClick={() => router.push("/gift-cards")}>
                    Back to Gift Cards
                </Button>
            </div>
        );
    }

    // Determine stepper state
    const status = submission.status;
    const isSubmitted = true; // Always true if we exist
    const isVerifying = status === "verifying" || status === "paid" || status === "rejected";
    const isPaid = status === "paid";
    const isRejected = status === "rejected";

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
                                {submission.brand} Gift Card
                            </h2>
                            <p className="mt-1 font-mono text-3xl font-bold text-ink">
                                ${submission.faceValueUsd.toFixed(2)}
                            </p>
                        </div>

                        {/* Vertical Stepper */}
                        <div className="relative pl-6 py-4">
                            {/* Connecting Line */}
                            <div className="absolute bottom-4 left-[23px] top-4 w-0.5 bg-gray-100" />

                            <div className="space-y-10 relative">
                                {/* Step 1: Submitted */}
                                <div className="relative flex gap-4">
                                    <div className={cn(
                                        "absolute -left-6 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white",
                                        isSubmitted ? "bg-violet-600 text-white" : "bg-gray-100 text-muted"
                                    )}>
                                        <UploadCloud className="h-4 w-4" />
                                    </div>
                                    <div className="pt-1">
                                        <h3 className={cn("text-sm font-semibold", isSubmitted ? "text-ink" : "text-muted")}>
                                            Card Submitted
                                        </h3>
                                        <p className="text-xs text-muted mt-1">We have received your gift card details.</p>
                                    </div>
                                </div>

                                {/* Step 2: Verifying */}
                                <div className="relative flex gap-4">
                                    <div className={cn(
                                        "absolute -left-6 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white",
                                        status === "verifying" ? "bg-amber-500 text-white" : 
                                        isVerifying ? "bg-violet-600 text-white" : "bg-gray-100 text-muted"
                                    )}>
                                        {status === "verifying" ? <Clock className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4" />}
                                    </div>
                                    <div className="pt-1">
                                        <h3 className={cn("text-sm font-semibold", isVerifying ? "text-ink" : "text-muted")}>
                                            Verifying Code
                                        </h3>
                                        <p className="text-xs text-muted mt-1">Our team is checking the balance and validity.</p>
                                    </div>
                                </div>

                                {/* Step 3: Terminal State (Paid/Rejected) */}
                                <div className="relative flex gap-4">
                                    <div className={cn(
                                        "absolute -left-6 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white",
                                        isPaid ? "bg-green-500 text-white" : 
                                        isRejected ? "bg-red-500 text-white" : "bg-gray-100 text-muted"
                                    )}>
                                        {isRejected ? <X className="h-4 w-4" /> : 
                                         isPaid ? <Check className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                                    </div>
                                    <div className="pt-1">
                                        <h3 className={cn("text-sm font-semibold", 
                                            isPaid ? "text-green-600" : 
                                            isRejected ? "text-red-600" : "text-muted"
                                        )}>
                                            {isPaid ? "Payment Sent" : isRejected ? "Card Rejected" : "Get Paid"}
                                        </h3>
                                        
                                        {isPaid && (
                                            <p className="text-xs text-muted mt-1">
                                                <span className="font-bold text-ink">{formatNaira(submission.payoutNgn)}</span> has been added to your wallet.
                                            </p>
                                        )}
                                        {isRejected && (
                                            <p className="text-xs text-red-500/80 mt-1">
                                                {submission.failureReason || "The card was invalid or already redeemed."}
                                            </p>
                                        )}
                                        {!isPaid && !isRejected && (
                                            <p className="text-xs text-muted mt-1">Cash will be added to your balance.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terminal Actions */}
                        {isPaid && (
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
