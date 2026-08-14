"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Wifi } from "lucide-react";
import { toast } from "sonner";

import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { useDataPlans, usePayData, useServiceTransactionStatus } from "@/lib/queries/services";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// New Shared UI Components
import { ProviderSelector } from "@/components/services/ProviderSelector";
import { RecentNumbersRow } from "@/components/services/RecentNumbersRow";
import { PlanGrid } from "@/components/services/PlanGrid";
import { StickyPayBar } from "@/components/services/StickyPayBar";
import { PaymentSuccessScreen } from "@/components/services/PaymentSuccessScreen";

// ─── Constants ──────────────────────────────────────────────────────────────

const NETWORKS = [
    { id: "MTN", label: "MTN", color: "bg-yellow-400", logoUrl: "/images/providers/mtn.svg" },
    { id: "Glo", label: "Glo", color: "bg-green-500", logoUrl: "/images/providers/glo.svg" },
    { id: "Airtel", label: "Airtel", color: "bg-red-500", logoUrl: "/images/providers/airtel.svg" },
    { id: "T2 Mobile", label: "T2 Mobile", color: "bg-blue-600", logoUrl: "/images/providers/t2.svg" },
    { id: "Vitel", label: "Vitel", color: "bg-purple-600", logoUrl: "/images/providers/vitel.svg" },
];

const MOCK_RECENT_CONTACTS = [
    { name: "My Router", id: "08031234567" },
    { name: "Dad", id: "07069876543" },
];

export default function DataPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Support pre-filling
    const initialNetwork = searchParams.get("network") || "MTN";
    const initialPhone = searchParams.get("phone") || "";

    const [network, setNetwork] = React.useState(initialNetwork);
    const [phone, setPhone] = React.useState(initialPhone);
    const [planId, setPlanId] = React.useState("");
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

    // Reset plan when network changes
    React.useEffect(() => {
        setPlanId("");
    }, [network]);

    const selectedPlan = plans.find(p => p.id === planId);

    // ─── Transaction State ────────────────────────────────────────────────
    const [pinModalOpen, setPinModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("pin");
    const [txId, setTxId] = React.useState<string | null>(null);
    const [successOpen, setSuccessOpen] = React.useState(false);

    const { data: txStatus } = useServiceTransactionStatus(txId);

    React.useEffect(() => {
        if (!txStatus) return;
        if (txStatus.status === "COMPLETED") {
            setPinModalOpen(false);
            setSuccessOpen(true);
        }
        if (txStatus.status === "FAILED") {
            setTxState("error");
        }
    }, [txStatus]);

    // ─── Handlers ───────────────────────────────────────────────────────────────
    React.useEffect(() => {
        if (phone.startsWith("0803") || phone.startsWith("0703") || phone.startsWith("0813")) setNetwork("MTN");
        else if (phone.startsWith("0805") || phone.startsWith("0705") || phone.startsWith("0815")) setNetwork("Glo");
        else if (phone.startsWith("0802") || phone.startsWith("0708") || phone.startsWith("0812")) setNetwork("Airtel");
        else if (phone.startsWith("0809") || phone.startsWith("0818") || phone.startsWith("0909")) setNetwork("9mobile");
    }, [phone]);

    const handlePayClick = () => {
        if (phone.length < 10) {
            toast.error("Please enter a valid phone number");
            return;
        }
        if (!selectedPlan) {
            toast.error("Please select a data plan");
            return;
        }
        setTxId(null);
        setTxState("pin");
        setPinModalOpen(true);
    };

    const handlePinSubmit = (pin: string) => {
        if (!selectedPlan) return;
        setTxState("processing");
        
        payData.mutate(
            { phone, planId, amountNgn: selectedPlan.price, network, pin },
            {
                onSuccess: (res) => {
                    setTxId(res.id);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Purchase failed");
                    setTxState("error");
                }
            }
        );
    };

    const isValid = phone.length >= 10 && !!selectedPlan;

    // Helper to format plan for PlanGrid
    const formatPlansForGrid = (rawPlans: typeof plans) => {
        return rawPlans.map((p, idx) => ({
            id: p.id,
            name: p.name,
            validity: `${p.validityDays} Day${p.validityDays > 1 ? 's' : ''}`,
            price: p.price,
            recommended: idx === 1 // Mock a recommendation for the UI
        }));
    };

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
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                            <Wifi className="h-4 w-4" />
                        </div>
                        <h1 className="text-2xl font-black text-ink tracking-tight">Buy Data</h1>
                    </div>
                </div>

                <div className="px-2 sm:px-0 space-y-8">
                    {/* Provider Selection */}
                    <ProviderSelector 
                        providers={NETWORKS}
                        selectedId={network}
                        onChange={setNetwork}
                    />

                    {/* Phone Number & Recent */}
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={phone}
                                maxLength={11}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                className="w-full h-16 rounded-2xl border-2 border-border bg-white px-5 text-xl font-bold tracking-wide outline-none focus:border-violet-600 transition-colors"
                            />
                            {phone.length >= 4 && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 border border-green-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">{network} detected</span>
                                </div>
                            )}
                        </div>
                        <RecentNumbersRow 
                            contacts={MOCK_RECENT_CONTACTS} 
                            onSelect={(id) => setPhone(id)} 
                        />
                    </div>

                    {/* Data Plans Tabs & Grid */}
                    <div className="space-y-4">
                        <Tabs value={validityTab} onValueChange={(v) => setValidityTab(v as any)}>
                            <TabsList className="grid w-full grid-cols-3 mb-4 h-12 rounded-xl p-1 bg-gray-100">
                                <TabsTrigger value="daily" className="rounded-lg font-bold">Daily</TabsTrigger>
                                <TabsTrigger value="weekly" className="rounded-lg font-bold">Weekly</TabsTrigger>
                                <TabsTrigger value="monthly" className="rounded-lg font-bold">Monthly</TabsTrigger>
                            </TabsList>
                            <TabsContent value="daily" className="mt-0 outline-none">
                                <PlanGrid 
                                    plans={formatPlansForGrid(dailyPlans)}
                                    selectedId={planId}
                                    onChange={setPlanId}
                                    isLoading={plansLoading}
                                />
                            </TabsContent>
                            <TabsContent value="weekly" className="mt-0 outline-none">
                                <PlanGrid 
                                    plans={formatPlansForGrid(weeklyPlans)}
                                    selectedId={planId}
                                    onChange={setPlanId}
                                    isLoading={plansLoading}
                                />
                            </TabsContent>
                            <TabsContent value="monthly" className="mt-0 outline-none">
                                <PlanGrid 
                                    plans={formatPlansForGrid(monthlyPlans)}
                                    selectedId={planId}
                                    onChange={setPlanId}
                                    isLoading={plansLoading}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            <StickyPayBar 
                visible={!successOpen} 
                amount={selectedPlan?.price || 0}
                summaryText={selectedPlan ? `${selectedPlan.name} · ${network} Data` : "Select a plan"}
                onPay={handlePayClick}
                disabled={!isValid}
            />

            <TransactionModal
                open={pinModalOpen}
                onOpenChange={setPinModalOpen}
                state={txState}
                onPinSubmit={handlePinSubmit}
                processingText={`Sending ${selectedPlan?.name} data to ${phone}...`}
                errorTitle="Purchase Failed"
                errorDescription={<p>{payData.error?.message || txStatus?.failureReason || "The network provider didn't respond in time."}</p>}
                onErrorAction={() => setPinModalOpen(false)}
            />

            <PaymentSuccessScreen 
                open={successOpen}
                amount={selectedPlan?.price || 0}
                title="Data Sent!"
                description={<p>You successfully sent the <span className="font-bold">{selectedPlan?.name}</span> plan to <span className="font-bold">{phone}</span>.</p>}
                onHome={() => router.push("/overview")}
                onReceipt={() => router.push("/transactions")}
            />
        </>
    );
}
