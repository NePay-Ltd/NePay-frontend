"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Loader2,
    Camera,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useGiftCardCatalog, useGiftCardQuote, useSubmitGiftCard } from "@/lib/queries/gift-cards";

import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";

/**
 * `params.brand` is actually the catalog listing's `slug` (route folder
 * kept its original name to avoid a churn-only rename) — the brand/rate/
 * image shown here always comes from the live GET /giftcards/catalog
 * entry, never a hardcoded map, so a listing admin adds shows up here
 * immediately with no code change.
 */
export default function SellGiftCardPage({ params }: { params: { brand: string } }) {
    const router = useRouter();
    const slug = params.brand;

    const { data: catalog, isLoading: catalogLoading } = useGiftCardCatalog();
    const listing = catalog?.find((item) => item.slug === slug);
    const quoteMutation = useGiftCardQuote();
    const submitMutation = useSubmitGiftCard();

    const rate = listing ? Number(listing.rate) : 0;

    const [faceValueUsd, setFaceValueUsd] = React.useState<string>("");
    const [submissionType, setSubmissionType] = React.useState<"PHYSICAL" | "ECODE">("PHYSICAL");
    const [cardCode, setCardCode] = React.useState("");
    // Live camera capture — required only for PHYSICAL; an ECODE submission never touches this.
    const [cardPhotoBase64, setCardPhotoBase64] = React.useState<string>("");
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);
    const [cameraOpen, setCameraOpen] = React.useState(false);
    const [cameraError, setCameraError] = React.useState<string | null>(null);

    const parsedValue = parseFloat(faceValueUsd) || 0;
    const payoutNgn = parsedValue * rate;

    const stopCamera = React.useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setCameraOpen(false);
    }, []);

    React.useEffect(() => stopCamera, [stopCamera]);

    const handleTabChange = (value: string) => {
        setSubmissionType(value as "PHYSICAL" | "ECODE");
        setCardPhotoBase64("");
        stopCamera();
    };

    React.useEffect(() => {
        if (cameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraOpen]);

    const openCamera = async () => {
        setCameraError(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError("Camera capture is not supported by this browser.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
            streamRef.current = stream;
            setCameraOpen(true);
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
            setCameraError("Camera access was denied or unavailable. Allow camera access to continue.");
        }
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        setCardPhotoBase64(canvas.toDataURL("image/jpeg", 0.88).split(",")[1] ?? "");
        stopCamera();
    };

    // Validation — the code is always required; the live-captured photo is
    // required only for a PHYSICAL submission, never for an ECODE one.
    const isValid =
        parsedValue > 0 &&
        cardCode.trim().length > 0 &&
        (submissionType === "ECODE" || cardPhotoBase64.length > 0);

    // Modal State
    const [modalOpen, setModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("confirm");
    const [currentQuoteId, setCurrentQuoteId] = React.useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setTxState("processing");
        setModalOpen(true);

        if (!listing) return;

        quoteMutation.mutate(
            { cardBrand: listing.brandName, faceValueUsd: parsedValue.toFixed(2), quantity: 1 },
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
        if (submissionType === "PHYSICAL" && !cardPhotoBase64) return;
        setTxState("processing");

        submitMutation.mutate({
            quoteId: currentQuoteId,
            submissionType,
            cardCode,
            ...(submissionType === "PHYSICAL" ? { cardPhotoBase64 } : {}),
            pin,
        }, {
            onSuccess: (data) => {
                setSubmittedOrderId(data.id);

                // Every submission is manual. There is no instant-success path.
                setTxState("review");
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || "Failed to submit gift card");
                setTxState("error");
            }
        });
    };

    if (catalogLoading) {
        return (
            <div className="mx-auto max-w-xl space-y-6">
                <div className="h-[400px] animate-pulse rounded-3xl bg-gray-100" />
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-muted">Brand not found.</p>
                <Button variant="ghost" onClick={() => router.push("/gift-cards")} className="mt-4">
                    Go back
                </Button>
            </div>
        );
    }

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
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={listing.cardImageUrl} alt={listing.brandName} className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-ink">{listing.brandName}</h2>
                                <p className="text-xs text-muted">{listing.countries.join(", ")} · Current Rate</p>
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

                        {/* Physical vs e-code — a physical card needs a live photo as evidence; an e-code needs only the typed code, backed by its own fraud checks instead. */}
                        <div className="space-y-3 pt-4 border-t border-border">
                            <Tabs value={submissionType} onValueChange={handleTabChange}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="PHYSICAL">Physical card</TabsTrigger>
                                    <TabsTrigger value="ECODE">E-code</TabsTrigger>
                                </TabsList>

                                <TabsContent value="PHYSICAL" className="space-y-6 mt-4">
                                    <div className="space-y-3">
                                        <Label>Card Code</Label>
                                        <textarea
                                            placeholder="Enter the code printed on the card..."
                                            className="min-h-[100px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 resize-none font-mono"
                                            value={cardCode}
                                            onChange={(e) => setCardCode(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Live Photo (required)</Label>
                                        <p className="text-xs text-body">
                                            Capture the card now with your camera. Screenshots and
                                            gallery uploads are not accepted.
                                        </p>
                                        {cardPhotoBase64 ? (
                                            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={`data:image/jpeg;base64,${cardPhotoBase64}`}
                                                    alt="Captured card"
                                                    className="h-16 w-16 rounded-md object-cover"
                                                />
                                                <div className="flex-1 text-xs text-green-700">
                                                    Photo captured. It will be reviewed alongside your code.
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setCardPhotoBase64("");
                                                    }}
                                                >
                                                    Retake
                                                </Button>
                                            </div>
                                        ) : (
                                            cameraOpen ? (
                                                <div className="space-y-3">
                                                    <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-xl bg-black object-cover" />
                                                    <div className="flex gap-3"><Button type="button" variant="primary" onClick={capturePhoto} className="flex-1"><Camera className="mr-2 h-4 w-4" />Capture photo</Button><Button type="button" variant="ghost" onClick={stopCamera}>Cancel</Button></div>
                                                </div>
                                            ) : (
                                                <button type="button" onClick={() => void openCamera()} className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/50 px-4 py-6 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100/60"><Camera className="mr-2 h-5 w-5" />Take a photo with camera</button>
                                            )
                                        )}
                                        {cameraError && <p className="text-xs text-red-600">{cameraError}</p>}
                                    </div>
                                </TabsContent>

                                <TabsContent value="ECODE" className="space-y-3 mt-4">
                                    <Label>E-code</Label>
                                    <textarea
                                        placeholder="Enter your alphanumeric e-code here..."
                                        className="min-h-[100px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 resize-none font-mono"
                                        value={cardCode}
                                        onChange={(e) => setCardCode(e.target.value)}
                                    />
                                    <p className="text-xs text-body">
                                        No photo needed — just the code above. Every e-code is checked
                                        for reuse and reviewed by our team before payout.
                                    </p>
                                </TabsContent>
                            </Tabs>
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
