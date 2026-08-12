"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, MonitorPlay, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody } from "@/components/shared/panel";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { formatNaira } from "@/lib/format";

import { useVerifySmartcard, usePayCableTv, useServiceTransactionStatus } from "@/lib/queries/services";

// ─── Constants & Schemas ──────────────────────────────────────────────────────

const PROVIDERS = [
    { id: "dstv", label: "DSTV", icon: "DSTV", color: "bg-blue-600" },
    { id: "gotv", label: "GOtv", icon: "GOTV", color: "bg-green-600" },
    { id: "startimes", label: "Startimes", icon: "ST", color: "bg-orange-600" },
];

const MOCK_TV_PLANS: Record<string, { id: string; name: string; price: number }[]> = {
    dstv: [
        { id: "padi", name: "DStv Padi", price: 2950 },
        { id: "yanga", name: "DStv Yanga", price: 4200 },
        { id: "confam", name: "DStv Confam", price: 7400 },
        { id: "compact", name: "DStv Compact", price: 12500 },
        { id: "compact_plus", name: "DStv Compact Plus", price: 19800 },
        { id: "premium", name: "DStv Premium", price: 29500 },
    ],
    gotv: [
        { id: "smallie", name: "GOtv Smallie", price: 1300 },
        { id: "jinja", name: "GOtv Jinja", price: 2700 },
        { id: "jolli", name: "GOtv Jolli", price: 3950 },
        { id: "max", name: "GOtv Max", price: 5700 },
        { id: "supa", name: "GOtv Supa", price: 7600 },
    ],
    startimes: [
        { id: "nova", name: "Nova", price: 1500 },
        { id: "basic", name: "Basic", price: 2600 },
        { id: "smart", name: "Smart", price: 3500 },
        { id: "classic", name: "Classic", price: 3800 },
        { id: "super", name: "Super", price: 6500 },
    ]
};

const FEE = 100;

const tvSchema = z.object({
    smartcard: z.string().min(5, "Minimum 5 digits required"),
    planId: z.string().min(1, "Please select a plan"),
});

type TvForm = z.infer<typeof tvSchema>;

export default function TvPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Support pre-filling
    const initialProviderId = searchParams.get("provider") || "dstv";
    const initialSmartcard = searchParams.get("meter") || ""; // We used "meter" historically for identifiers in URLs

    const [providerId, setProviderId] = React.useState(initialProviderId);
    const [resolvedName, setResolvedName] = React.useState<string | null>(null);

    // Queries & Mutations
    const verifySmartcard = useVerifySmartcard();
    const payCableTv = usePayCableTv();

    // ─── Forms ──────────────────────────────────────────────────────────────────
    const form = useForm<TvForm>({
        resolver: zodResolver(tvSchema),
        defaultValues: { smartcard: initialSmartcard, planId: "" },
    });

    const watchSmartcard = form.watch("smartcard");
    const watchPlanId = form.watch("planId");
    
    const providerPlans = MOCK_TV_PLANS[providerId] || [];
    const selectedPlan = providerPlans.find(p => p.id === watchPlanId);

    // Reset resolution and plan if user types something new or changes provider
    React.useEffect(() => {
        setResolvedName(null);
        form.setValue("planId", "", { shouldValidate: true });
    }, [watchSmartcard, providerId, form]);

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
        const isValid = await form.trigger("smartcard");
        if (!isValid) return;

        verifySmartcard.mutate(
            { provider: providerId, smartcardNumber: watchSmartcard },
            {
                onSuccess: (data) => setResolvedName(data.customerName),
                onError: () => setResolvedName(null)
            }
        );
    };

    const handleSubmit = (values: TvForm) => {
        setTxId(null);
        setTxState("confirm");
        setModalOpen(true);
    };

    const confirmTransaction = () => {
        setTxState("processing");
        if (!selectedPlan) return;

        payCableTv.mutate(
            { provider: providerId, smartcardNumber: watchSmartcard, amountNgn: selectedPlan.price },
            {
                onSuccess: (res) => setTxId(res.id),
                onError: () => setTxState("error")
            }
        );
    };

    const isVerifying = verifySmartcard.isPending;
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
                <h1 className="text-2xl font-bold text-ink">TV Subscription</h1>
            </div>

            <Panel className="rounded-[24px]">
                <PanelBody className="p-6 sm:p-8">
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                        
                        {/* Provider Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-ink">Provider</Label>
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
                                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] text-white ${prov.color}`}>{prov.icon}</span>
                                            {prov.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Smartcard & Verification */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-ink">Smartcard / IUC Number</Label>
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <Input 
                                        placeholder="Enter number..." 
                                        className="h-14 rounded-2xl pl-4 pr-12 text-lg font-bold placeholder:font-medium disabled:opacity-70 disabled:bg-gray-50"
                                        {...form.register("smartcard")}
                                        disabled={isVerifying || isVerified}
                                    />
                                    <MonitorPlay className="absolute right-4 top-4 h-5 w-5 text-muted" />
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
                                        disabled={isVerifying || watchSmartcard.length < 5}
                                        className="h-14 rounded-2xl px-6 font-bold shrink-0"
                                    >
                                        {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify"}
                                    </Button>
                                )}
                            </div>
                            
                            {/* Error Message */}
                            {form.formState.errors.smartcard && (
                                <p className="text-xs text-red-500 font-medium">{form.formState.errors.smartcard.message}</p>
                            )}
                            {verifySmartcard.isError && (
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

                        {/* Subscription Plans (Only show if verified) */}
                        <div className={`space-y-3 transition-all duration-300 ${isVerified ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                            <Label className="text-sm font-bold text-ink">Select Package</Label>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pb-2">
                                {providerPlans.map(plan => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => form.setValue("planId", plan.id, { shouldValidate: true })}
                                        className={`flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all ${
                                            watchPlanId === plan.id
                                                ? "border-violet-600 bg-violet-50"
                                                : "border-border bg-white hover:border-violet-200"
                                        }`}
                                    >
                                        <span className="font-bold text-ink">{plan.name}</span>
                                        <span className="font-sans tabular-nums text-lg font-extrabold text-violet-700 mt-1">
                                            {formatNaira(plan.price)}
                                        </span>
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
                                disabled={!isVerified || !form.formState.isValid || !selectedPlan}
                            >
                                Pay {selectedPlan ? formatNaira(selectedPlan.price + FEE) : ""} (incl. ₦{FEE} fee)
                            </Button>
                        </div>
                    </form>
                </PanelBody>
            </Panel>

            <TransactionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                state={txState}
                confirmTitle="Review Subscription"
                onConfirm={confirmTransaction}
                onCancel={() => setModalOpen(false)}
                confirmContent={
                    <div className="space-y-4 pt-2 pb-4">
                        <div className="rounded-2xl border border-border bg-gray-50 p-5 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted font-medium">Provider</span>
                                <span className="font-bold text-ink">
                                    {activeProvider.label}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted font-medium">Customer</span>
                                <span className="font-bold text-ink text-right truncate max-w-[150px]">
                                    {resolvedName}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted font-medium">Package</span>
                                <span className="font-bold text-ink">
                                    {selectedPlan?.name}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted font-medium">Smartcard No.</span>
                                <span className="font-bold text-ink">
                                    {watchSmartcard}
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-2 px-2 text-sm font-medium">
                            <div className="flex justify-between">
                                <span className="text-body">Amount</span>
                                <span className="font-mono text-ink">{formatNaira(selectedPlan?.price || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-body">Fee</span>
                                <span className="font-mono text-ink">{formatNaira(FEE)}</span>
                            </div>
                            <div className="border-t border-dashed border-border pt-3 mt-1 flex justify-between font-extrabold text-lg">
                                <span className="text-ink">Total</span>
                                <span className="font-sans tabular-nums text-violet-700">{formatNaira((selectedPlan?.price || 0) + FEE)}</span>
                            </div>
                        </div>
                    </div>
                }
                processingText={`Connecting to ${activeProvider.label}...`}
                successTitle="Subscription Active!"
                successDescription={
                    <p>Your <span className="font-bold">{activeProvider.label}</span> subscription has been successfully renewed.</p>
                }
                onSuccessAction={() => {
                    setModalOpen(false);
                    router.push("/overview");
                }}
                errorTitle="Payment Failed"
                errorDescription={<p>{txStatus?.failureReason || "The provider didn't respond in time."}</p>}
                onErrorAction={() => setModalOpen(false)}
            />
        </div>
    );
}
