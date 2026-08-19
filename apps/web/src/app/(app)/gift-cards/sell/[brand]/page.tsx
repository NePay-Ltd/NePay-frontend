"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    UploadCloud, 
    ShoppingCart, 
    Smartphone, 
    Tag, 
    Gamepad2,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useGiftCardRates, useGiftCardQuote, useSubmitGiftCard } from "@/lib/queries/gift-cards";

import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";

const BRAND_META: Record<string, any> = {
    amazon: { label: "Amazon", icon: ShoppingCart, color: "text-orange-500", bg: "bg-orange-50" },
    itunes: { label: "iTunes / Apple", icon: Smartphone, color: "text-ink", bg: "bg-gray-100" },
    "google-play": { label: "Google Play", icon: Tag, color: "text-blue-500", bg: "bg-blue-50" },
    steam: { label: "Steam", icon: Gamepad2, color: "text-indigo-900", bg: "bg-indigo-50" },
};

export default function SellGiftCardPage({ params }: { params: { brand: string } }) {
    const router = useRouter();
    const brandId = params.brand;
    const meta = BRAND_META[brandId];

    const { data: rates = {} } = useGiftCardRates();
    const quoteMutation = useGiftCardQuote();
    const submitMutation = useSubmitGiftCard();

    const rate = rates[brandId] || 0;

    const [faceValueUsd, setFaceValueUsd] = React.useState<string>("");
    const [cardCode, setCardCode] = React.useState("");

    const parsedValue = parseFloat(faceValueUsd) || 0;
    const payoutNgn = parsedValue * rate;
    
    // Validation
    const isValid = parsedValue > 0 && cardCode.trim().length > 0;

    // Modal State
    const [modalOpen, setModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("confirm");
    const [currentQuoteId, setCurrentQuoteId] = React.useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setTxState("processing");
        setModalOpen(true);

        quoteMutation.mutate(
            { cardBrand: brandId.toUpperCase(), faceValueUsd: parsedValue.toFixed(2), quantity: 1 },
            {
                onSuccess: (data: { quoteId: string }) => {
                    setCurrentQuoteId(data.quoteId);
                    setTxState("pin");
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Failed to get quote");
                    setModalOpen(false);
                }
            }
        );
    };

    const [submittedOrderId, setSubmittedOrderId] = React.useState<string | null>(null);

    const handlePinSubmit = (pin: string) => {
        if (!currentQuoteId) return;
        setTxState("processing");

        submitMutation.mutate({ quoteId: currentQuoteId, cardCode, pin }, {
            onSuccess: (data) => {
                setSubmittedOrderId(data.id);

                if (data.status === "APPROVED") {
                    // Eligible seller, non-restricted brand — the automated path
                    // already cleared and credited the wallet. A real success.
                    setTxState("success");
                    setTimeout(() => {
                        setModalOpen(false);
                        router.push(`/gift-cards/submissions/${data.id}`);
                    }, 1500);
                } else {
                    // PENDING_REVIEW — genuinely nothing paid out yet. Never show
                    // the success checkmark for this; the "review" state is honest
                    // about what's actually happening.
                    setTxState("review");
                }
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || "Failed to submit gift card");
                setTxState("error");
            }
        });
    };

    if (!meta) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-muted">Brand not found.</p>
                <Button variant="ghost" onClick={() => router.push("/gift-cards")} className="mt-4">
                    Go back
                </Button>
            </div>
        );
    }

    const BrandIcon = meta.icon;

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-2xl font-bold text-ink">Sell Gift Card</h1>
            </div>

            <Panel>
                <PanelBody className="p-0">
                    {/* Brand Header */}
                    <div className="flex items-center justify-between border-b border-border bg-gray-50/50 p-6">
                        <div className="flex items-center gap-4">
                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", meta.bg)}>
                                <BrandIcon className={cn("h-6 w-6", meta.color)} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-ink">{meta.label}</h2>
                                <p className="text-xs text-muted">Current Rate</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-xl font-bold text-green-500">
                                {formatNaira(rate)}
                            </div>
                            <p className="text-xs text-muted">per USD</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 p-6">
                        {/* Face Value & Live Payout */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Face Value (USD)</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg text-muted">
                                        $
                                    </span>
                                    <Input 
                                        type="number"
                                        min={1}
                                        step="0.01"
                                        placeholder="0.00"
                                        className="h-14 pl-10 font-mono text-xl"
                                        value={faceValueUsd}
                                        onChange={(e) => setFaceValueUsd(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                                <span className="text-sm font-medium text-green-800">Estimated Payout</span>
                                <span className="font-mono text-2xl font-bold text-green-600">
                                    {formatNaira(payoutNgn)}
                                </span>
                            </div>
                        </div>

                        {/* Card Input */}
                        <div className="space-y-3 pt-4 border-t border-border">
                            <Label>Card Details (e-code)</Label>
                            <textarea
                                placeholder="Enter your alphanumeric e-code here..."
                                className="min-h-[120px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 resize-none font-mono"
                                value={cardCode}
                                onChange={(e) => setCardCode(e.target.value)}
                            />
                        </div>

                        <Button 
                            type="submit" 
                            variant="primary" 
                            size="lg" 
                            fullWidth 
                            disabled={!isValid || submitMutation.isPending}
                        >
                            {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit for Verification"}
                        </Button>
                    </form>
                </PanelBody>
            </Panel>

            <TransactionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                state={txState}
                // Confirm UI (skipped, goes straight to processing quote)
                confirmTitle=""
                confirmContent={<></>}
                confirmButtonLabel=""
                onConfirm={() => {}}
                onCancel={() => setModalOpen(false)}
                // PIN
                onPinSubmit={handlePinSubmit}
                // Processing UI
                processingText={txState === "processing" && currentQuoteId ? "Submitting gift card..." : "Getting best quote..."}
                // Success UI (only ever reached for an instantly-cleared, automated approval)
                successTitle="Payout Sent"
                successDescription={<p>Your card was approved automatically and the payout has been added to your wallet.</p>}
                successButtonLabel="View Submission"
                onSuccessAction={() => setModalOpen(false)}
                // Review UI — genuinely pending, no payout yet
                reviewTitle="Under Review"
                reviewDescription={
                    <p>
                        Your card is being reviewed — you&apos;ll be notified once it clears, usually under 30 minutes.
                        No payout has been sent yet.
                    </p>
                }
                reviewButtonLabel="Track Status"
                onReviewAction={() => {
                    setModalOpen(false);
                    if (submittedOrderId) router.push(`/gift-cards/submissions/${submittedOrderId}`);
                }}
                // Error UI
                errorTitle="Submission Failed"
                errorDescription={<p>{submitMutation.error?.message || "An unexpected error occurred."}</p>}
                errorButtonLabel="Try Again"
                onErrorAction={() => setModalOpen(false)}
            />
        </div>
    );
}
