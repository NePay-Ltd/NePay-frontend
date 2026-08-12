"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Contact, Loader2 } from "lucide-react";

import { Button } from "@/components/shared/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody } from "@/components/shared/panel";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { formatNaira } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useDataPlans, usePayData, useServiceTransactionStatus } from "@/lib/queries/services";

// ─── Constants & Schemas ──────────────────────────────────────────────────────

const NETWORKS = [
    { id: "MTN", label: "MTN", color: "bg-yellow-400" },
    { id: "Glo", label: "Glo", color: "bg-green-500" },
    { id: "Airtel", label: "Airtel", color: "bg-red-500" },
    { id: "9mobile", label: "9mobile", color: "bg-emerald-800" },
];

const phoneRegex = /^0\d{10}$/;

const dataSchema = z.object({
    phone: z.string().regex(phoneRegex, "Must be a valid 11-digit number"),
    planId: z.string().min(1, "Please select a plan"),
});

type DataForm = z.infer<typeof dataSchema>;

export default function DataPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Support pre-filling
    const initialNetwork = searchParams.get("network") || "MTN";
    const initialPhone = searchParams.get("phone") || "";

    const [network, setNetwork] = React.useState(initialNetwork);
    const [validityTab, setValidityTab] = React.useState<"daily" | "weekly" | "monthly">("monthly");

    // Queries & Mutations
    const { data: plans = [], isLoading: plansLoading } = useDataPlans(network);
    const payData = usePayData();

    // Group plans
    const dailyPlans = plans.filter(p => p.validityDays <= 1);
    const weeklyPlans = plans.filter(p => p.validityDays > 1 && p.validityDays <= 7);
    const monthlyPlans = plans.filter(p => p.validityDays > 7);

    // Auto switch tabs if a category has no plans
    React.useEffect(() => {
        if (!plansLoading && plans.length > 0) {
            if (validityTab === "monthly" && monthlyPlans.length === 0) setValidityTab("weekly");
            if (validityTab === "weekly" && weeklyPlans.length === 0) setValidityTab("daily");
        }
    }, [plans, plansLoading, validityTab]); // eslint-disable-line

    // ─── Forms ──────────────────────────────────────────────────────────────────
    const form = useForm<DataForm>({
        resolver: zodResolver(dataSchema),
        defaultValues: { phone: initialPhone, planId: "" },
    });

    const watchPlanId = form.watch("planId");
    const selectedPlan = plans.find(p => p.id === watchPlanId);

    // Reset plan when network changes
    React.useEffect(() => {
        form.setValue("planId", "", { shouldValidate: true });
    }, [network, form]);

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
    const handleSubmit = (values: DataForm) => {
        setTxId(null);
        setTxState("confirm");
        setModalOpen(true);
    };

    const confirmTransaction = () => {
        setTxState("processing");
        const values = form.getValues();
        if (!selectedPlan) return;
        
        payData.mutate(
            { phone: values.phone, planId: values.planId, amountNgn: selectedPlan.price, network },
            {
                onSuccess: (res) => setTxId(res.id),
                onError: () => setTxState("error")
            }
        );
    };

    const renderPlanList = (planList: typeof plans) => {
        if (plansLoading) {
            return (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted" />
                </div>
            );
        }

        if (planList.length === 0) {
            return <div className="text-center py-10 text-muted font-medium text-sm">No plans available for this category.</div>;
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {planList.map(plan => (
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
                        <div className="flex justify-between w-full mt-2 items-center">
                            <span className="font-sans tabular-nums text-lg font-extrabold text-violet-700">
                                {formatNaira(plan.price)}
                            </span>
                            <span className="text-xs font-medium text-muted bg-gray-100 px-2 py-1 rounded-md">
                                {plan.validityDays} Day{plan.validityDays > 1 ? "s" : ""}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
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
                <h1 className="text-2xl font-bold text-ink">Buy Data</h1>
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

                        {/* Data Plans Tabs */}
                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-ink">Select Plan</Label>
                            <Tabs value={validityTab} onValueChange={(v) => setValidityTab(v as any)}>
                                <TabsList className="grid w-full grid-cols-3 mb-4 h-12 rounded-xl p-1">
                                    <TabsTrigger value="daily" className="rounded-lg font-bold">Daily</TabsTrigger>
                                    <TabsTrigger value="weekly" className="rounded-lg font-bold">Weekly</TabsTrigger>
                                    <TabsTrigger value="monthly" className="rounded-lg font-bold">Monthly</TabsTrigger>
                                </TabsList>
                                <TabsContent value="daily" className="mt-0 outline-none">
                                    {renderPlanList(dailyPlans)}
                                </TabsContent>
                                <TabsContent value="weekly" className="mt-0 outline-none">
                                    {renderPlanList(weeklyPlans)}
                                </TabsContent>
                                <TabsContent value="monthly" className="mt-0 outline-none">
                                    {renderPlanList(monthlyPlans)}
                                </TabsContent>
                            </Tabs>
                        </div>
                        
                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                fullWidth 
                                size="lg"
                                className="h-14 rounded-2xl text-base font-bold shadow-md shadow-violet-500/20"
                                disabled={!form.formState.isValid || !selectedPlan}
                            >
                                Pay {selectedPlan ? formatNaira(selectedPlan.price) : ""}
                            </Button>
                        </div>
                    </form>
                </PanelBody>
            </Panel>

            <TransactionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                state={txState}
                confirmTitle="Review Data Purchase"
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
                            <div className="flex justify-between text-sm">
                                <span className="text-muted font-medium">Plan</span>
                                <span className="font-bold text-ink">
                                    {selectedPlan?.name}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between font-extrabold text-lg px-2">
                            <span>Amount</span>
                            <span className="font-sans tabular-nums text-violet-700">{formatNaira(selectedPlan?.price || 0)}</span>
                        </div>
                    </div>
                }
                processingText={`Sending ${selectedPlan?.name} data...`}
                successTitle="Data Sent Successfully!"
                successDescription={
                    <p>Your phone has been credited with <span className="font-bold">{selectedPlan?.name}</span> data.</p>
                }
                onSuccessAction={() => {
                    setModalOpen(false);
                    router.push("/overview");
                }}
                errorTitle="Purchase Failed"
                errorDescription={<p>{txStatus?.failureReason || "The network provider didn't respond in time."}</p>}
                onErrorAction={() => setModalOpen(false)}
            />
        </div>
    );
}
