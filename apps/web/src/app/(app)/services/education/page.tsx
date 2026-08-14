"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { usePayEducation, useUtilityCategories, useUtilityServices, useUtilityVariations } from "@/lib/queries/services";
import { UtilityPurchaseResponseDto } from "@/lib/types/api";

// Shared UI Components
import { ProviderSelector } from "@/components/services/ProviderSelector";
import { PlanGrid } from "@/components/services/PlanGrid";
import { StickyPayBar } from "@/components/services/StickyPayBar";
import { PaymentSuccessScreen } from "@/components/services/PaymentSuccessScreen";

export default function EducationPage() {
    const router = useRouter();

    const [examBody, setExamBody] = React.useState<string | undefined>();
    const [variationCode, setVariationCode] = React.useState("");

    // ─── Dynamic catalog ────────────────────────────────────────────────────
    const { data: categories = [] } = useUtilityCategories();
    const educationCategory = categories.find((c) => c.name.toLowerCase().includes("education"));
    const { data: examBodies = [], isLoading: examBodiesLoading } = useUtilityServices(educationCategory?.identifier);

    React.useEffect(() => {
        if (!examBody && examBodies.length > 0) {
            setExamBody(examBodies[0]?.serviceID);
        }
    }, [examBodies, examBody]);

    const selectedExamBody = examBodies.find((e) => e.serviceID === examBody);
    const { data: pinTypes = [], isLoading: pinTypesLoading } = useUtilityVariations(selectedExamBody?.serviceID);

    // Reset selected pin type when exam body changes
    React.useEffect(() => {
        setVariationCode("");
    }, [examBody]);

    const selectedPinType = pinTypes.find((p) => p.variation_code === variationCode);

    // Queries & Mutations
    const payEducation = usePayEducation();

    // ─── Transaction State ────────────────────────────────────────────────
    const [pinModalOpen, setPinModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("pin");
    const [txResult, setTxResult] = React.useState<UtilityPurchaseResponseDto | null>(null);
    const [successOpen, setSuccessOpen] = React.useState(false);

    // ─── Handlers ───────────────────────────────────────────────────────────────
    const handlePayClick = () => {
        if (!selectedPinType) {
            toast.error("Please select a PIN type");
            return;
        }
        setTxResult(null);
        setTxState("pin");
        setPinModalOpen(true);
    };

    const handlePinSubmit = (pin: string) => {
        if (!selectedPinType || !selectedExamBody) return;
        setTxState("processing");

        payEducation.mutate(
            {
                examBody: selectedExamBody.serviceID,
                variationCode: selectedPinType.variation_code,
                amountNgn: Number(selectedPinType.variation_amount),
                pin,
            },
            {
                onSuccess: (res) => {
                    setTxResult(res);
                    if (res.status === "FAILED") {
                        setTxState("error");
                        return;
                    }
                    setPinModalOpen(false);
                    setSuccessOpen(true);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Purchase failed");
                    setTxState("error");
                }
            }
        );
    };

    const isValid = !!selectedPinType;
    const selectedAmount = selectedPinType ? Number(selectedPinType.variation_amount) : 0;

    return (
        <>
            <div className="mx-auto max-w-xl space-y-8 pb-32">
                {/* Header */}
                <div className="flex items-center gap-3 px-2 sm:px-0">
                    <button
                        onClick={() => router.back()}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-ink hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                        <h1 className="text-2xl font-black text-ink tracking-tight">Education</h1>
                    </div>
                </div>

                <div className="px-2 sm:px-0 space-y-8">
                    {/* Exam Body Selection */}
                    <ProviderSelector
                        providers={examBodies.map((e) => ({ id: e.serviceID, label: e.name, color: "bg-indigo-600", logoUrl: e.image }))}
                        selectedId={examBody ?? ""}
                        onChange={setExamBody}
                    />
                    {examBodiesLoading && (
                        <p className="-mt-6 px-1 text-xs font-medium text-muted">Loading exam bodies…</p>
                    )}

                    {/* PIN Type Selection */}
                    <PlanGrid
                        plans={pinTypes.map((p) => ({ id: p.variation_code, name: p.name, price: Number(p.variation_amount) }))}
                        selectedId={variationCode}
                        onChange={setVariationCode}
                        isLoading={pinTypesLoading}
                    />
                </div>
            </div>

            <StickyPayBar
                visible={!successOpen}
                amount={selectedAmount}
                summaryText={selectedPinType ? `${selectedExamBody?.name} · ${selectedPinType.name}` : "Select a PIN type"}
                onPay={handlePayClick}
                disabled={!isValid}
            />

            <TransactionModal
                open={pinModalOpen}
                onOpenChange={setPinModalOpen}
                state={txState}
                onPinSubmit={handlePinSubmit}
                processingText={`Purchasing ${selectedPinType?.name}...`}
                errorTitle="Purchase Failed"
                errorDescription={<p>{payEducation.error?.message || txResult?.failureReason || "The provider didn't respond in time."}</p>}
                onErrorAction={() => setPinModalOpen(false)}
            />

            <PaymentSuccessScreen
                open={successOpen}
                amount={selectedAmount}
                title={txResult?.status === "PROCESSING" ? "PIN Purchase Processing" : "PIN Purchased!"}
                description={
                    txResult?.status === "PROCESSING" ? (
                        <p>Your <span className="font-bold">{selectedPinType?.name}</span> purchase is being processed.</p>
                    ) : (
                        <p>You successfully purchased a <span className="font-bold">{selectedPinType?.name}</span>.</p>
                    )
                }
                onHome={() => router.push("/overview")}
                onReceipt={() => router.push("/transactions")}
            />
        </>
    );
}
