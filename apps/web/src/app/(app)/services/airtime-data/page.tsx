"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/shared/button";
import { Chip } from "@/components/shared/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody } from "@/components/shared/panel";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { formatNaira } from "@/lib/format";

import { useDataPlans, usePayAirtime, usePayData, useServiceTransactionStatus } from "@/lib/queries/services";

// ─── Constants & Schemas ──────────────────────────────────────────────────────

const NETWORKS = [
    { id: "MTN", label: "MTN", color: "bg-yellow-400" },
    { id: "Glo", label: "Glo", color: "bg-green-500" },
    { id: "Airtel", label: "Airtel", color: "bg-red-500" },
    { id: "9mobile", label: "9mobile", color: "bg-emerald-800" },
];

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

const phoneRegex = /^0\d{10}$/;

const airtimeSchema = z.object({
    phone: z.string().regex(phoneRegex, "Must be a valid 11-digit Nigerian number (e.g. 080...)"),
    amount: z.number().min(50, "Minimum is ₦50").max(50000, "Maximum is ₦50,000"),
});

const dataSchema = z.object({
    phone: z.string().regex(phoneRegex, "Must be a valid 11-digit Nigerian number (e.g. 080...)"),
    planId: z.string().min(1, "Please select a data plan"),
});

type AirtimeForm = z.infer<typeof airtimeSchema>;
type DataForm = z.infer<typeof dataSchema>;

export default function AirtimeDataPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Support pre-filling from saved billers
    const initialTab = searchParams.get("tab") === "data" ? "data" : "airtime";
    const initialNetwork = searchParams.get("network") || "MTN";
    const initialPhone = searchParams.get("phone") || "";

    const [activeTab, setActiveTab] = React.useState<"airtime" | "data">(initialTab);
    const [network, setNetwork] = React.useState(initialNetwork);

    // Queries & Mutations
    const { data: plans = [], isLoading: plansLoading } = useDataPlans(network);
    const payAirtime = usePayAirtime();
    const payData = usePayData();

    // ─── Forms ──────────────────────────────────────────────────────────────────
    const airtimeForm = useForm<AirtimeForm>({
        resolver: zodResolver(airtimeSchema),
        defaultValues: { phone: initialPhone, amount: 0 },
    });

    const dataForm = useForm<DataForm>({
        resolver: zodResolver(dataSchema),
        defaultValues: { phone: initialPhone, planId: "" },
    });

    // Automatically clear plan selection if network changes on Data tab
    React.useEffect(() => {
        dataForm.setValue("planId", "");
    }, [network, dataForm]);

    // ─── Transaction Modal State ────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("confirm");
    const [txId, setTxId] = React.useState<string | null>(null);
    const [pendingTxDetails, setPendingTxDetails] = React.useState<{ amount: number; label: string } | null>(null);

    const { data: txStatus } = useServiceTransactionStatus(txId);

    React.useEffect(() => {
        if (!txStatus) return;
        if (txStatus.status === "success") setTxState("success");
        if (txStatus.status === "failed") setTxState("error");
    }, [txStatus]);

    // ─── Handlers ───────────────────────────────────────────────────────────────
    const handleAirtimeSubmit = (values: AirtimeForm) => {
        setPendingTxDetails({ amount: values.amount, label: `Airtime to ${values.phone} (${network})` });
        setTxId(null);
        setTxState("confirm");
        setModalOpen(true);
    };

    const handleDataSubmit = (values: DataForm) => {
        const plan = plans.find(p => p.id === values.planId);
        if (!plan) return;
        
        setPendingTxDetails({ amount: plan.price, label: `${plan.name} to ${values.phone} (${network})` });
        setTxId(null);
        setTxState("confirm");
        setModalOpen(true);
    };

    const confirmTransaction = () => {
        setTxState("processing");

        if (activeTab === "airtime") {
            const values = airtimeForm.getValues();
            payAirtime.mutate(
                { phone: values.phone, amountNgn: values.amount, network },
                {
                    onSuccess: (res) => setTxId(res.id),
                    onError: () => setTxState("error")
                }
            );
        } else {
            const values = dataForm.getValues();
            const plan = plans.find(p => p.id === values.planId);
            if (!plan) return;
            
            payData.mutate(
                { phone: values.phone, planId: values.planId, network, amountNgn: plan.price },
                {
                    onSuccess: (res) => setTxId(res.id),
                    onError: () => setTxState("error")
                }
            );
        }
    };

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-2xl font-bold text-ink">Airtime & Data</h1>
            </div>

            <Panel>
                <PanelBody className="p-6">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "airtime" | "data")}>
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="airtime">Airtime</TabsTrigger>
                            <TabsTrigger value="data">Data</TabsTrigger>
                        </TabsList>

                        <div className="space-y-6">
                            {/* Network Selection (Shared) */}
                            <div className="space-y-2">
                                <Label>Network</Label>
                                <div className="flex flex-wrap gap-3">
                                    {NETWORKS.map(net => (
                                        <Chip 
                                            key={net.id}
                                            active={network === net.id}
                                            onClick={() => setNetwork(net.id)}
                                        >
                                            <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${net.color}`} />
                                            {net.label}
                                        </Chip>
                                    ))}
                                </div>
                            </div>

                            {/* ── Airtime Tab ── */}
                            <TabsContent value="airtime" className="mt-0 space-y-6 outline-none">
                                <form id="airtime-form" onSubmit={airtimeForm.handleSubmit(handleAirtimeSubmit)} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <Input 
                                            placeholder="080..." 
                                            maxLength={11}
                                            {...airtimeForm.register("phone")}
                                        />
                                        {airtimeForm.formState.errors.phone && (
                                            <p className="text-xs text-red-500">{airtimeForm.formState.errors.phone.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Amount (₦)</Label>
                                        <Input 
                                            type="number"
                                            placeholder="0"
                                            {...airtimeForm.register("amount", { valueAsNumber: true })}
                                        />
                                        {airtimeForm.formState.errors.amount && (
                                            <p className="text-xs text-red-500">{airtimeForm.formState.errors.amount.message}</p>
                                        )}
                                        
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {PRESET_AMOUNTS.map(preset => (
                                                <Chip 
                                                    key={preset}
                                                    active={airtimeForm.watch("amount") === preset}
                                                    onClick={() => airtimeForm.setValue("amount", preset, { shouldValidate: true })}
                                                >
                                                    +{formatNaira(preset)}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        type="submit" 
                                        variant="primary" 
                                        fullWidth 
                                        size="lg"
                                        disabled={!airtimeForm.formState.isValid}
                                    >
                                        Continue
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* ── Data Tab ── */}
                            <TabsContent value="data" className="mt-0 space-y-6 outline-none">
                                <form id="data-form" onSubmit={dataForm.handleSubmit(handleDataSubmit)} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <Input 
                                            placeholder="080..." 
                                            maxLength={11}
                                            {...dataForm.register("phone")}
                                        />
                                        {dataForm.formState.errors.phone && (
                                            <p className="text-xs text-red-500">{dataForm.formState.errors.phone.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Select Data Plan</Label>
                                        <div className="relative">
                                            <select
                                                className="flex h-12 w-full appearance-none rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                                                {...dataForm.register("planId")}
                                            >
                                                <option value="" disabled>Select a plan</option>
                                                {plans.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} — {formatNaira(p.price)}
                                                    </option>
                                                ))}
                                            </select>
                                            {plansLoading && (
                                                <Loader2 className="absolute right-3 top-4 h-4 w-4 animate-spin text-muted" />
                                            )}
                                        </div>
                                        {dataForm.formState.errors.planId && (
                                            <p className="text-xs text-red-500">{dataForm.formState.errors.planId.message}</p>
                                        )}
                                    </div>

                                    <Button 
                                        type="submit" 
                                        variant="primary" 
                                        fullWidth 
                                        size="lg"
                                        disabled={!dataForm.formState.isValid}
                                    >
                                        Continue
                                    </Button>
                                </form>
                            </TabsContent>
                        </div>
                    </Tabs>
                </PanelBody>
            </Panel>

            <TransactionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                state={txState}
                confirmTitle="Review Purchase"
                onConfirm={confirmTransaction}
                onCancel={() => setModalOpen(false)}
                confirmContent={
                    <div className="space-y-4 pt-2 pb-4">
                        <div className="rounded-xl border border-border bg-gray-50 p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Purchase</span>
                                <span className="font-medium text-ink text-right">
                                    {pendingTxDetails?.label}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between font-bold text-base px-1">
                            <span>Amount</span>
                            <span className="font-mono">{formatNaira(pendingTxDetails?.amount || 0)}</span>
                        </div>
                    </div>
                }
                processingText={`Processing ${activeTab} purchase...`}
                successTitle="Purchase Successful!"
                successDescription={
                    <p>Your {activeTab} purchase of <span className="font-bold">{formatNaira(pendingTxDetails?.amount || 0)}</span> was successful.</p>
                }
                onSuccessAction={() => {
                    setModalOpen(false);
                    router.push("/transactions");
                }}
                errorTitle="Purchase Failed"
                errorDescription={<p>{txStatus?.failureReason || "The upstream provider didn't respond in time."}</p>}
                onErrorAction={() => setModalOpen(false)}
            />
        </div>
    );
}
