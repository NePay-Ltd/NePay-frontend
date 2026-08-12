"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Lightbulb, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody } from "@/components/shared/panel";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { formatNaira } from "@/lib/format";

import { useVerifyMeter, usePayElectricity, useServiceTransactionStatus } from "@/lib/queries/services";

// ─── Constants & Schemas ──────────────────────────────────────────────────────

const PROVIDERS = [
    { id: "ikeja-electric", label: "Ikeja", color: "bg-amber-500" },
    { id: "eko-electric", label: "Eko", color: "bg-yellow-500" },
    { id: "ibadan-electric", label: "Ibadan", color: "bg-orange-500" },
    { id: "abuja-electric", label: "Abuja", color: "bg-red-500" },
];

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000];
const FEE = 100;

const electricitySchema = z.object({
    meterType: z.enum(["prepaid", "postpaid"]),
    meter: z.string().min(5, "Minimum 5 digits required"),
    amount: z.number().min(500, "Minimum is ₦500").max(500000, "Maximum is ₦500,000"),
});

type ElectricityForm = z.infer<typeof electricitySchema>;

export default function ElectricityPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Support pre-filling
    const initialProviderId = searchParams.get("provider") || "ikeja-electric";
    const initialMeter = searchParams.get("meter") || ""; 

    const [providerId, setProviderId] = React.useState(initialProviderId);
    const [resolvedName, setResolvedName] = React.useState<string | null>(null);

    // Queries & Mutations
    const verifyMeter = useVerifyMeter();
    const payElectricity = usePayElectricity();

    // ─── Forms ──────────────────────────────────────────────────────────────────
    const form = useForm<ElectricityForm>({
        resolver: zodResolver(electricitySchema),
        defaultValues: { meter: initialMeter, amount: 0, meterType: "prepaid" },
    });

    const watchMeter = form.watch("meter");
    const watchAmount = form.watch("amount");
    const watchMeterType = form.watch("meterType");
    
    // Reset resolution if user types something new or changes provider
    React.useEffect(() => {
        setResolvedName(null);
    }, [watchMeter, providerId, form]);

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
        const isValid = await form.trigger("meter");
        if (!isValid) return;

        verifyMeter.mutate(
            { provider: providerId, meterNumber: watchMeter },
            {
                onSuccess: (data) => setResolvedName(data.customerName),
                onError: () => setResolvedName(null)
            }
        );
    };

    const handleSubmit = (values: ElectricityForm) => {
        setTxId(null);
        setTxState("confirm");
        setModalOpen(true);
    };

    const confirmTransaction = () => {
        setTxState("processing");

        payElectricity.mutate(
            { provider: providerId, meterNumber: watchMeter, amountNgn: watchAmount },
            {
                onSuccess: (res) => setTxId(res.id),
                onError: () => setTxState("error")
            }
        );
    };

    const isVerifying = verifyMeter.isPending;
    const isVerified = resolvedName !== null;
    const activeProvider = PROVIDERS.find(p => p.id === providerId)!;

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div className="flex items-center gap-3 px-1">
                <button
                    onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-2xl font-bold text-ink">Electricity</h1>
            </div>

            <Panel className="rounded-[24px]">
                <PanelBody className="p-6 sm:p-8">
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                        
                        {/* Provider Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-ink">Disco / Provider</Label>
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {PROVIDERS.map(prov => (
                                    <button
                                        key={prov.id}
                                        type="button"
                                        onClick={() => setProviderId(prov.id)}
                                        className={`flex-none px-5 py-2.5 rounded-full border-2 transition-all font-bold text-sm ${
                                            providerId === prov.id 
                                                ? "border-violet-600 bg-violet-50 text-violet-700" 
                                                : "border-border bg-white text-body hover:border-violet-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block h-2 w-2 rounded-full ${prov.color}`} />
                                            {prov.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Meter Type Toggle */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-ink">Meter Type</Label>
                            <div className="flex rounded-xl bg-gray-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => form.setValue("meterType", "prepaid")}
                                    className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                                        watchMeterType === "prepaid" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
                                    }`}
                                >
                                    Prepaid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => form.setValue("meterType", "postpaid")}
                                    className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                                        watchMeterType === "postpaid" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
                                    }`}
                                >
                                    Postpaid
                                </button>
                            </div>
                        </div>

                        {/* Meter & Verification */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-ink">Meter Number</Label>
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <Input 
                                        placeholder="Enter number..." 
                                        className="h-14 rounded-2xl pl-4 pr-12 text-lg font-bold placeholder:font-medium disabled:opacity-70 disabled:bg-gray-50"
                                        {...form.register("meter")}
                                        disabled={isVerifying || isVerified}
                                    />
                                    <Lightbulb className="absolute right-4 top-4 h-5 w-5 text-muted" />
                                    {isVerified && (
                                        <div className="absolute right-3 top-3.5 bg-white rounded-full">
                                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                                        </div>
                                    )}
                                </div>
                                {!isVerified && (
                                    <Button 
                                        type="button" 
                                        variant="primary"
                                        onClick={handleVerify}
                                        disabled={isVerifying || watchMeter.length < 5}
                                        className="h-14 rounded-2xl px-6 font-bold shrink-0"
                                    >
                                        {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify"}
                                    </Button>
                                )}
                            </div>
                            
                            {/* Error Message */}
                            {form.formState.errors.meter && (
                                <p className="text-xs text-red-500 font-medium">{form.formState.errors.meter.message}</p>
                            )}
                            {verifyMeter.isError && (
                                <p className="text-xs text-red-500 font-medium">Failed to verify. Please check the number and try again.</p>
                            )}

                            {/* Verification Result Message */}
                            {isVerified && (
                                <div className="mt-2 flex items-center justify-between rounded-xl bg-green-50 px-4 py-3 border border-green-200">
                                    <span className="text-sm text-green-700">Name: <span className="font-bold">{resolvedName}</span></span>
                                    <button 
                                        type="button" 
                                        className="text-xs font-bold text-green-700 hover:text-green-800 transition-colors"
                                        onClick={() => setResolvedName(null)}
                                    >
                                        Change
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Amount (Only show if verified) */}
                        <div className={`space-y-3 transition-all duration-300 ${isVerified ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                            <Label className="text-sm font-bold text-ink">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-4 font-bold text-ink">₦</span>
                                <Input 
                                    type="number"
                                    placeholder="0"
                                    className="h-14 rounded-2xl pl-8 text-lg font-bold tabular-nums"
                                    {...form.register("amount", { valueAsNumber: true })}
                                />
                            </div>
                            {form.formState.errors.amount && (
                                <p className="text-xs text-red-500 font-medium">{form.formState.errors.amount.message}</p>
                            )}
                            
                            {/* Presets */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {PRESET_AMOUNTS.map(preset => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => form.setValue("amount", preset, { shouldValidate: true })}
                                        className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all tabular-nums ${
                                            watchAmount === preset
                                                ? "bg-violet-600 text-white border-violet-600"
                                                : "bg-white text-ink border-border hover:bg-violet-50 hover:border-violet-200"
                                        }`}
                                    >
                                        {formatNaira(preset)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                fullWidth 
                                size="lg"
                                className="h-14 rounded-2xl text-base font-bold shadow-md shadow-violet-500/20"
                                disabled={!isVerified || !form.formState.isValid}
                            >
                                Pay {watchAmount > 0 ? formatNaira(watchAmount + FEE) : ""} (incl. ₦{FEE} fee)
                            </Button>
                        </div>
                    </form>
                </PanelBody>
            </Panel>

            <TransactionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                state={txState}
                confirmTitle="Review Payment"
                onConfirm={confirmTransaction}
                onCancel={() => setModalOpen(false)}
                confirmContent={
                    <div className="space-y-4 pt-2 pb-4">
                        <div className="rounded-2xl border border-border bg-gray-50 p-5 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted font-medium">Biller</span>
                                <span className="font-bold text-ink">
                                    {activeProvider.label} Electric
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted font-medium">Customer</span>
                                <span className="font-bold text-ink text-right truncate max-w-[150px]">
                                    {resolvedName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted font-medium">Meter No.</span>
                                <span className="font-bold text-ink">
                                    {watchMeter} ({watchMeterType})
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-2 px-2 text-sm font-medium">
                            <div className="flex justify-between">
                                <span className="text-body">Amount</span>
                                <span className="font-mono text-ink">{formatNaira(watchAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-body">Fee</span>
                                <span className="font-mono text-ink">{formatNaira(FEE)}</span>
                            </div>
                            <div className="border-t border-dashed border-border pt-3 mt-1 flex justify-between font-extrabold text-lg">
                                <span className="text-ink">Total</span>
                                <span className="font-sans tabular-nums text-violet-700">{formatNaira(watchAmount + FEE)}</span>
                            </div>
                        </div>
                    </div>
                }
                processingText={`Connecting to ${activeProvider.label}...`}
                successTitle="Payment Successful!"
                successDescription={
                    <p>Your electricity payment of <span className="font-bold">{formatNaira(watchAmount)}</span> was successful.</p>
                }
                onSuccessAction={() => {
                    setModalOpen(false);
                    router.push("/overview");
                }}
                errorTitle="Payment Failed"
                errorDescription={<p>{txStatus?.failureReason || "The biller didn't respond in time."}</p>}
                onErrorAction={() => setModalOpen(false)}
            />
        </div>
    );
}
