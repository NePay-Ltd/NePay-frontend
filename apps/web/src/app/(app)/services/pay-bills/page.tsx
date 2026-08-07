"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Chip } from "@/components/shared/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody } from "@/components/shared/panel";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { formatNaira } from "@/lib/format";

import { 
    useVerifyMeter, 
    useVerifySmartcard, 
    usePayElectricity, 
    usePayCableTv, 
    useServiceTransactionStatus 
} from "@/lib/queries/services";

// ─── Constants & Schemas ──────────────────────────────────────────────────────

type Category = "electricity" | "cable-tv";

const PROVIDERS = [
    { id: "ikeja-electric", label: "Ikeja Electric", category: "electricity" as Category },
    { id: "eko-electric", label: "Eko Electric", category: "electricity" as Category },
    { id: "dstv", label: "DSTV", category: "cable-tv" as Category },
    { id: "gotv", label: "GOtv", category: "cable-tv" as Category },
    { id: "startimes", label: "Startimes", category: "cable-tv" as Category },
];

const FEE = 100;

const billSchema = z.object({
    identifier: z.string().min(5, "Minimum 5 characters required"),
    amount: z.number().min(500, "Minimum is ₦500").max(500000, "Maximum is ₦500,000"),
});

type BillForm = z.infer<typeof billSchema>;

export default function PayBillsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Support pre-filling
    const initialProviderId = searchParams.get("provider") || "ikeja-electric";
    const initialIdentifier = searchParams.get("meter") || "";

    const [providerId, setProviderId] = React.useState(initialProviderId);
    const activeProvider = PROVIDERS.find(p => p.id === providerId) || PROVIDERS[0]!;

    const [resolvedName, setResolvedName] = React.useState<string | null>(null);

    // Queries & Mutations
    const verifyMeter = useVerifyMeter();
    const verifySmartcard = useVerifySmartcard();
    const payElectricity = usePayElectricity();
    const payCableTv = usePayCableTv();

    // ─── Forms ──────────────────────────────────────────────────────────────────
    const form = useForm<BillForm>({
        resolver: zodResolver(billSchema),
        defaultValues: { identifier: initialIdentifier, amount: 0 },
    });

    const watchIdentifier = form.watch("identifier");
    const watchAmount = form.watch("amount");

    // Reset resolution if user types something new
    React.useEffect(() => {
        setResolvedName(null);
    }, [watchIdentifier, providerId]);

    // ─── Transaction Modal State ────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("confirm");
    const [txId, setTxId] = React.useState<string | null>(null);

    const { data: txStatus } = useServiceTransactionStatus(txId);

    React.useEffect(() => {
        if (!txStatus) return;
        if (txStatus.status === "success") setTxState("success");
        if (txStatus.status === "failed") setTxState("error");
    }, [txStatus]);

    // ─── Handlers ───────────────────────────────────────────────────────────────
    const handleVerify = async () => {
        const isValid = await form.trigger("identifier");
        if (!isValid) return;

        if (activeProvider.category === "electricity") {
            verifyMeter.mutate(
                { provider: activeProvider.id, meterNumber: watchIdentifier },
                {
                    onSuccess: (data) => setResolvedName(data.customerName),
                    onError: () => setResolvedName(null)
                }
            );
        } else {
            verifySmartcard.mutate(
                { provider: activeProvider.id, smartcardNumber: watchIdentifier },
                {
                    onSuccess: (data) => setResolvedName(data.customerName),
                    onError: () => setResolvedName(null)
                }
            );
        }
    };

    const handleSubmit = () => {
        setTxId(null);
        setTxState("confirm");
        setModalOpen(true);
    };

    const confirmTransaction = () => {
        setTxState("processing");

        if (activeProvider.category === "electricity") {
            payElectricity.mutate(
                { provider: activeProvider.id, meterNumber: watchIdentifier, amountNgn: watchAmount },
                {
                    onSuccess: (res) => setTxId(res.id),
                    onError: () => setTxState("error")
                }
            );
        } else {
            payCableTv.mutate(
                { provider: activeProvider.id, smartcardNumber: watchIdentifier, amountNgn: watchAmount },
                {
                    onSuccess: (res) => setTxId(res.id),
                    onError: () => setTxState("error")
                }
            );
        }
    };

    const isVerifying = verifyMeter.isPending || verifySmartcard.isPending;
    const isVerified = resolvedName !== null;
    const totalDeducted = watchAmount > 0 ? watchAmount + FEE : 0;
    const inputLabel = activeProvider.category === "electricity" ? "Meter Number" : "Smartcard Number";

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-2xl font-bold text-ink">Pay Bills</h1>
            </div>

            <Panel>
                <PanelBody className="p-6">
                    <div className="space-y-6">
                        {/* Provider Selection */}
                        <div className="space-y-2">
                            <Label>Provider</Label>
                            <div className="flex flex-wrap gap-2">
                                {PROVIDERS.map(p => (
                                    <Chip 
                                        key={p.id}
                                        active={providerId === p.id}
                                        onClick={() => setProviderId(p.id)}
                                    >
                                        {p.label}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        {/* Identifier & Verification */}
                        <div className="space-y-2">
                            <Label>{inputLabel}</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input 
                                        placeholder={`Enter ${inputLabel.toLowerCase()}`}
                                        {...form.register("identifier")}
                                        disabled={isVerifying || isVerified}
                                    />
                                    {isVerified && (
                                        <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                                    )}
                                </div>
                                {!isVerified && (
                                    <Button 
                                        type="button" 
                                        variant="quiet"
                                        onClick={handleVerify}
                                        disabled={isVerifying || watchIdentifier.length < 5}
                                    >
                                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                    </Button>
                                )}
                            </div>
                            {form.formState.errors.identifier && (
                                <p className="text-xs text-red-500">{form.formState.errors.identifier.message}</p>
                            )}
                            
                            {/* Verification Result Message */}
                            {isVerified && (
                                <div className="mt-1 flex items-center justify-between rounded bg-green-50 px-3 py-2 text-sm text-green-700">
                                    <span>Customer: <span className="font-semibold">{resolvedName}</span></span>
                                    <button 
                                        type="button" 
                                        className="text-xs font-semibold text-green-700 underline"
                                        onClick={() => setResolvedName(null)}
                                    >
                                        Change
                                    </button>
                                </div>
                            )}
                            {(verifyMeter.isError || verifySmartcard.isError) && (
                                <p className="text-xs text-red-500">Failed to verify. Please check the number and try again.</p>
                            )}
                        </div>

                        {/* Amount & Submit (Disabled until verified) */}
                        <div className={`space-y-6 transition-opacity ${isVerified ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                            <div className="space-y-2">
                                <Label>Amount (₦)</Label>
                                <Input 
                                    type="number"
                                    placeholder="0"
                                    {...form.register("amount", { valueAsNumber: true })}
                                />
                                {form.formState.errors.amount && (
                                    <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
                                )}
                            </div>

                            <Button 
                                type="button" 
                                variant="primary" 
                                fullWidth 
                                size="lg"
                                disabled={!isVerified || !form.formState.isValid}
                                onClick={form.handleSubmit(handleSubmit)}
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                </PanelBody>
            </Panel>

            <TransactionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                state={txState}
                confirmTitle="Review Bill Payment"
                onConfirm={confirmTransaction}
                onCancel={() => setModalOpen(false)}
                confirmContent={
                    <div className="space-y-4 pt-2 pb-4">
                        <div className="rounded-xl border border-border bg-gray-50 p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Biller</span>
                                <span className="font-medium text-ink text-right">
                                    {activeProvider.label}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Customer</span>
                                <span className="font-medium text-ink text-right truncate max-w-[150px]">
                                    {resolvedName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">{inputLabel}</span>
                                <span className="font-medium text-ink text-right">
                                    {watchIdentifier}
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-2 px-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-body">Amount</span>
                                <span className="font-mono text-ink">{formatNaira(watchAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-body">Fee</span>
                                <span className="font-mono text-ink">{formatNaira(FEE)}</span>
                            </div>
                            <div className="border-t border-dashed border-border pt-2 flex justify-between font-bold text-base">
                                <span className="text-ink">Total</span>
                                <span className="font-mono text-violet-700">{formatNaira(totalDeducted)}</span>
                            </div>
                        </div>
                    </div>
                }
                processingText={`Processing payment to ${activeProvider.label}...`}
                successTitle="Payment Successful!"
                successDescription={
                    <p>Your payment of <span className="font-bold">{formatNaira(watchAmount)}</span> to {activeProvider.label} was successful.</p>
                }
                onSuccessAction={() => {
                    setModalOpen(false);
                    router.push("/transactions");
                }}
                errorTitle="Payment Failed"
                errorDescription={<p>{txStatus?.failureReason || "The biller did not respond in time."}</p>}
                onErrorAction={() => setModalOpen(false)}
            />
        </div>
    );
}
