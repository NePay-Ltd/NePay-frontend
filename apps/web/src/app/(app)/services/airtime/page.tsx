"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Contact } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Chip } from "@/components/shared/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody } from "@/components/shared/panel";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { formatNaira } from "@/lib/format";

import { usePayAirtime, useServiceTransactionStatus } from "@/lib/queries/services";

// ─── Constants & Schemas ──────────────────────────────────────────────────────

const NETWORKS = [
    { id: "MTN", label: "MTN", color: "bg-yellow-400" },
    { id: "Glo", label: "Glo", color: "bg-green-500" },
    { id: "Airtel", label: "Airtel", color: "bg-red-500" },
    { id: "9mobile", label: "9mobile", color: "bg-emerald-800" },
];

const PRESET_AMOUNTS = [50, 100, 500, 1000, 2000];

const phoneRegex = /^0\d{10}$/;

const airtimeSchema = z.object({
    phone: z.string().regex(phoneRegex, "Must be a valid 11-digit number"),
    amount: z.number().min(50, "Minimum is ₦50").max(50000, "Maximum is ₦50,000"),
});

type AirtimeForm = z.infer<typeof airtimeSchema>;

export default function AirtimePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Support pre-filling from saved billers
    const initialNetwork = searchParams.get("network") || "MTN";
    const initialPhone = searchParams.get("phone") || "";

    const [network, setNetwork] = React.useState(initialNetwork);

    // Queries & Mutations
    const payAirtime = usePayAirtime();

    // ─── Forms ──────────────────────────────────────────────────────────────────
    const form = useForm<AirtimeForm>({
        resolver: zodResolver(airtimeSchema),
        defaultValues: { phone: initialPhone, amount: 0 },
    });

    const watchAmount = form.watch("amount");

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
    const handleSubmit = (values: AirtimeForm) => {
        setTxId(null);
        setTxState("confirm");
        setModalOpen(true);
    };

    const confirmTransaction = () => {
        setTxState("processing");
        const values = form.getValues();
        
        payAirtime.mutate(
            { phone: values.phone, amountNgn: values.amount, network },
            {
                onSuccess: (res) => setTxId(res.id),
                onError: () => setTxState("error")
            }
        );
    };

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div className="flex items-center gap-3 px-1">
                <button
                    onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-2xl font-bold text-ink">Buy Airtime</h1>
            </div>

            <Panel className="rounded-[24px]">
                <PanelBody className="p-6 sm:p-8">
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                        
                        {/* Network Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-ink">Select Network</Label>
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {NETWORKS.map(net => (
                                    <button
                                        key={net.id}
                                        type="button"
                                        onClick={() => setNetwork(net.id)}
                                        className={`flex-none px-5 py-2.5 rounded-full border-2 transition-all font-bold text-sm ${
                                            network === net.id 
                                                ? "border-violet-600 bg-violet-50 text-violet-700" 
                                                : "border-border bg-white text-body hover:border-violet-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block h-2 w-2 rounded-full ${net.color}`} />
                                            {net.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-ink">Phone Number</Label>
                            <div className="relative">
                                <Input 
                                    placeholder="080..." 
                                    maxLength={11}
                                    className="h-14 rounded-2xl pl-4 pr-12 text-lg font-bold placeholder:font-medium"
                                    {...form.register("phone")}
                                />
                                <button type="button" className="absolute right-3 top-3.5 text-violet-500 hover:text-violet-700">
                                    <Contact className="h-6 w-6" />
                                </button>
                            </div>
                            {form.formState.errors.phone && (
                                <p className="text-xs text-red-500 font-medium">{form.formState.errors.phone.message}</p>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="space-y-3">
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
                                disabled={!form.formState.isValid}
                            >
                                Pay {watchAmount > 0 ? formatNaira(watchAmount) : ""}
                            </Button>
                        </div>
                    </form>
                </PanelBody>
            </Panel>

            <TransactionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                state={txState}
                confirmTitle="Review Airtime Purchase"
                onConfirm={confirmTransaction}
                onCancel={() => setModalOpen(false)}
                confirmContent={
                    <div className="space-y-4 pt-2 pb-4">
                        <div className="rounded-2xl border border-border bg-gray-50 p-5 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted font-medium">Network</span>
                                <span className="font-bold text-ink">
                                    {network}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted font-medium">Phone Number</span>
                                <span className="font-bold text-ink">
                                    {form.getValues().phone}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between font-extrabold text-lg px-2">
                            <span>Amount</span>
                            <span className="font-sans tabular-nums text-violet-700">{formatNaira(watchAmount)}</span>
                        </div>
                    </div>
                }
                processingText={`Sending ${formatNaira(watchAmount)} airtime...`}
                successTitle="Recharge Successful!"
                successDescription={
                    <p>Your phone has been successfully recharged with <span className="font-bold">{formatNaira(watchAmount)}</span>.</p>
                }
                onSuccessAction={() => {
                    setModalOpen(false);
                    router.push("/overview");
                }}
                errorTitle="Recharge Failed"
                errorDescription={<p>{txStatus?.failureReason || "The network provider didn't respond in time."}</p>}
                onErrorAction={() => setModalOpen(false)}
            />
        </div>
    );
}
