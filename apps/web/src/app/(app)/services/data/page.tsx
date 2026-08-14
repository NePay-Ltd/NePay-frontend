"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Wifi } from "lucide-react";
import { toast } from "sonner";

import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { usePayData, useUtilityCategories, useUtilityServices, useUtilityVariations } from "@/lib/queries/services";
import { UtilityPurchaseResponseDto } from "@/lib/types/api";

// New Shared UI Components
import { ProviderSelector } from "@/components/services/ProviderSelector";
import { RecentNumbersRow } from "@/components/services/RecentNumbersRow";
import { PlanGrid } from "@/components/services/PlanGrid";
import { StickyPayBar } from "@/components/services/StickyPayBar";
import { PaymentSuccessScreen } from "@/components/services/PaymentSuccessScreen";

// ─── Constants ──────────────────────────────────────────────────────────────

const MOCK_RECENT_CONTACTS = [
    { name: "My Router", id: "08031234567" },
    { name: "Dad", id: "07069876543" },
];

// Network-detection prefixes are matched against fetched service names,
// since serviceIDs (e.g. "mtn") come from the backend and aren't hardcoded.
const PREFIX_TO_NETWORK_NAME: { prefixes: string[]; match: string }[] = [
    { prefixes: ["0803", "0703", "0813", "0906", "0810", "0814", "0916"], match: "mtn" },
    { prefixes: ["0805", "0705", "0815", "0811", "0905", "0915"], match: "glo" },
    { prefixes: ["0802", "0708", "0812", "0901", "0902", "0904", "0912"], match: "airtel" },
    { prefixes: ["0809", "0818", "0817", "0909", "0908"], match: "9mobile" },
];

export default function DataPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialNetwork = searchParams.get("network") || undefined;
    const initialPhone = searchParams.get("phone") || "";

    const [network, setNetwork] = React.useState<string | undefined>(initialNetwork);
    const [phone, setPhone] = React.useState(initialPhone);
    const [variationCode, setVariationCode] = React.useState("");

    // ─── Dynamic catalog ────────────────────────────────────────────────────
    const { data: categories = [] } = useUtilityCategories();
    const dataCategory = categories.find((c) => c.name.toLowerCase().includes("data"));
    const { data: networks = [], isLoading: networksLoading } = useUtilityServices(dataCategory?.identifier);

    React.useEffect(() => {
        if (!network && networks.length > 0) {
            setNetwork(networks[0]?.serviceID);
        }
    }, [networks, network]);

    const selectedNetwork = networks.find((n) => n.serviceID === network);
    const { data: plans = [], isLoading: plansLoading } = useUtilityVariations(selectedNetwork?.serviceID);

    // Queries & Mutations
    const payData = usePayData();

    // Reset plan when network changes
    React.useEffect(() => {
        setVariationCode("");
    }, [network]);

    const selectedPlan = plans.find((p) => p.variation_code === variationCode);

    // ─── Transaction State ────────────────────────────────────────────────
    const [pinModalOpen, setPinModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("pin");
    const [txResult, setTxResult] = React.useState<UtilityPurchaseResponseDto | null>(null);
    const [successOpen, setSuccessOpen] = React.useState(false);

    // ─── Handlers ───────────────────────────────────────────────────────────────
    React.useEffect(() => {
        const rule = PREFIX_TO_NETWORK_NAME.find((r) => r.prefixes.some((p) => phone.startsWith(p)));
        if (!rule) return;
        const matched = networks.find((n) => n.name.toLowerCase().includes(rule.match));
        if (matched) setNetwork(matched.serviceID);
    }, [phone, networks]);

    const handlePayClick = () => {
        if (phone.length < 10) {
            toast.error("Please enter a valid phone number");
            return;
        }
        if (!selectedPlan) {
            toast.error("Please select a data plan");
            return;
        }
        setTxResult(null);
        setTxState("pin");
        setPinModalOpen(true);
    };

    const handlePinSubmit = (pin: string) => {
        if (!selectedPlan || !selectedNetwork) return;
        setTxState("processing");

        payData.mutate(
            {
                phone,
                variationCode: selectedPlan.variation_code,
                amountNgn: Number(selectedPlan.variation_amount),
                network: selectedNetwork.serviceID,
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

    const isValid = phone.length >= 10 && !!selectedPlan;
    const selectedAmount = selectedPlan ? Number(selectedPlan.variation_amount) : 0;

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
                        providers={networks.map((n) => ({ id: n.serviceID, label: n.name, color: "bg-blue-600", logoUrl: n.image }))}
                        selectedId={network ?? ""}
                        onChange={setNetwork}
                    />
                    {networksLoading && (
                        <p className="-mt-6 px-1 text-xs font-medium text-muted">Loading networks…</p>
                    )}

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
                            {phone.length >= 4 && selectedNetwork && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 border border-green-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">{selectedNetwork.name} detected</span>
                                </div>
                            )}
                        </div>
                        <RecentNumbersRow
                            contacts={MOCK_RECENT_CONTACTS}
                            onSelect={(id) => setPhone(id)}
                        />
                    </div>

                    {/* Data Plans */}
                    <PlanGrid
                        plans={plans.map((p) => ({ id: p.variation_code, name: p.name, price: Number(p.variation_amount) }))}
                        selectedId={variationCode}
                        onChange={setVariationCode}
                        isLoading={plansLoading}
                    />
                </div>
            </div>

            <StickyPayBar
                visible={!successOpen}
                amount={selectedAmount}
                summaryText={selectedPlan ? `${selectedPlan.name} · ${selectedNetwork?.name} Data` : "Select a plan"}
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
                errorDescription={<p>{payData.error?.message || txResult?.failureReason || "The network provider didn't respond in time."}</p>}
                onErrorAction={() => setPinModalOpen(false)}
            />

            <PaymentSuccessScreen
                open={successOpen}
                amount={selectedAmount}
                title={txResult?.status === "PROCESSING" ? "Data Purchase Processing" : "Data Sent!"}
                description={
                    txResult?.status === "PROCESSING" ? (
                        <p>Your <span className="font-bold">{selectedPlan?.name}</span> plan for <span className="font-bold">{phone}</span> is being processed.</p>
                    ) : (
                        <p>You successfully sent the <span className="font-bold">{selectedPlan?.name}</span> plan to <span className="font-bold">{phone}</span>.</p>
                    )
                }
                onHome={() => router.push("/overview")}
                onReceipt={() => router.push("/transactions")}
            />
        </>
    );
}
