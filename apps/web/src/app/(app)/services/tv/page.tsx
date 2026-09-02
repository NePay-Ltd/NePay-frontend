"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconArrowLeft as ArrowLeft } from "@/components/icons";
import { MonitorPlay } from "lucide-react";;
import { toast } from "sonner";

import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { useVerifySmartcard, usePayCableTv, useSaveBeneficiary, useSavedBillers, useServiceTransactionStatus } from "@/lib/queries/services";

// New Shared UI Components
import { ProviderRowButton } from "@/components/services/ProviderRowButton";
import { RecentNumbersRow } from "@/components/services/RecentNumbersRow";
import { PlanGrid } from "@/components/services/PlanGrid";
import { VerificationField } from "@/components/services/VerificationField";
import { StickyPayBar } from "@/components/services/StickyPayBar";
import { PaymentSuccessScreen } from "@/components/services/PaymentSuccessScreen";
import { Switch } from "@/components/ui/switch";

// ─── Constants ──────────────────────────────────────────────────────────────

const PROVIDERS = [
    { id: "dstv", label: "DSTV", color: "bg-blue-600", logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="%230099e5" rx="20"/><text x="200" y="130" font-family="Arial, Helvetica, sans-serif" font-size="100" font-weight="900" font-style="italic" fill="%23ffffff" text-anchor="middle" letter-spacing="-2">DStv</text></svg>' },
    { id: "gotv", label: "GOtv", color: "bg-green-600", logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="%23ffffff" rx="20"/><text x="140" y="130" font-family="Arial, Helvetica, sans-serif" font-size="110" font-weight="900" font-style="italic" fill="%23e3000f" text-anchor="middle" letter-spacing="-5">GO</text><text x="270" y="130" font-family="Arial, Helvetica, sans-serif" font-size="110" font-weight="900" font-style="italic" fill="%23008c3a" text-anchor="middle" letter-spacing="-2">tv</text></svg>' },
    { id: "startimes", label: "Startimes", color: "bg-orange-600", logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="%23ffffff" rx="20"/><circle cx="100" cy="100" r="40" fill="%23f26522"/><text x="240" y="125" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="bold" fill="%23000000" text-anchor="middle">StarTimes</text></svg>' },
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

export default function TvPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Support pre-filling
    const initialProviderId = searchParams.get("provider") || "dstv";
    const initialSmartcard = searchParams.get("meter") || "";

    const [providerId, setProviderId] = React.useState(initialProviderId);
    const [smartcard, setSmartcard] = React.useState(initialSmartcard);
    const [planId, setPlanId] = React.useState("");
    const [saveBeneficiary, setSaveBeneficiary] = React.useState(true);
    
    const [resolvedName, setResolvedName] = React.useState<string | undefined>();
    const [verifyStatus, setVerifyStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

    // Queries & Mutations
    const verifySmartcard = useVerifySmartcard();
    const payCableTv = usePayCableTv();
    const saveBeneficiaryMutation = useSaveBeneficiary();
    const { data: savedBillers = [] } = useSavedBillers();
    const recentContacts = savedBillers
        .filter((b) => b.serviceType === "cable-tv")
        .map((b) => ({ name: b.billerName, id: b.identifier }));

    const providerPlans = MOCK_TV_PLANS[providerId] || [];
    const selectedPlan = providerPlans.find(p => p.id === planId);

    // Reset resolution and plan if user types something new or changes provider
    React.useEffect(() => {
        setResolvedName(undefined);
        setVerifyStatus("idle");
        setPlanId("");
    }, [smartcard, providerId]);

    // ─── Transaction State ────────────────────────────────────────────────
    const [pinModalOpen, setPinModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("pin");
    const [txId, setTxId] = React.useState<string | null>(null);
    const [successOpen, setSuccessOpen] = React.useState(false);

    const { data: txStatus } = useServiceTransactionStatus(txId);

    React.useEffect(() => {
        if (!txStatus) return;
        if (txStatus.status === "COMPLETED") {
            if (saveBeneficiary) {
                saveBeneficiaryMutation.mutate({
                    category: "CABLE",
                    provider: providerId,
                    identifier: smartcard,
                    label: `${PROVIDERS.find((provider) => provider.id === providerId)?.label || providerId} ${smartcard}`,
                    amount: selectedPlan?.price.toString(),
                });
            }
            setPinModalOpen(false);
            setSuccessOpen(true);
        }
        if (txStatus.status === "FAILED") {
            setTxState("error");
        }
    }, [txStatus]);

    // ─── Handlers ───────────────────────────────────────────────────────────────
    const handleVerify = async () => {
        if (smartcard.length < 5) return;
        setVerifyStatus("loading");

        verifySmartcard.mutate(
            { provider: providerId, smartcardNumber: smartcard },
            {
                onSuccess: (data) => {
                    setResolvedName(data.customerName);
                    setVerifyStatus("success");
                },
                onError: () => {
                    setResolvedName(undefined);
                    setVerifyStatus("error");
                }
            }
        );
    };

    const handlePayClick = () => {
        if (!selectedPlan) {
            toast.error("Please select a subscription plan");
            return;
        }
        setTxId(null);
        setTxState("pin");
        setPinModalOpen(true);
    };

    const handlePinSubmit = (pin: string) => {
        if (!selectedPlan) return;
        setTxState("processing");
        
        payCableTv.mutate(
            { provider: providerId, smartcardNumber: smartcard, amountNgn: selectedPlan.price, pin },
            {
                onSuccess: (res) => {
                    setTxId(res.id);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Payment failed");
                    setTxState("error");
                }
            }
        );
    };

    const isValid = verifyStatus === "success" && !!selectedPlan;

    // Helper to format plan for PlanGrid
    const formatPlansForGrid = (rawPlans: typeof providerPlans) => {
        return rawPlans.map((p, idx) => ({
            id: p.id,
            name: p.name,
            validity: "30 Days", // Standard for most cable tv
            price: p.price,
            recommended: idx === 3 // Mock a recommendation
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
                        <h1 className="text-2xl font-black text-ink tracking-tight">TV Subscription</h1>
                    </div>
                </div>

                <div className="px-2 sm:px-0 space-y-4">
                    {/* Provider Selection */}
                    <ProviderRowButton 
                        providers={PROVIDERS}
                        selectedId={providerId}
                        onChange={setProviderId}
                    />

                    {/* Smartcard Number & Verification */}
                    <div className="space-y-4 pt-4">
                        <VerificationField 
                            label="Smartcard / IUC Number"
                            placeholder="Enter smartcard number"
                            value={smartcard}
                            onChange={setSmartcard}
                            onVerify={handleVerify}
                            status={verifyStatus}
                            resolvedName={resolvedName}
                            errorMessage="Failed to verify smartcard"
                        />
                        
                        {/* Only show recent if we haven't typed yet or verified */}
                        {verifyStatus !== "success" && (
                            <RecentNumbersRow
                                contacts={recentContacts}
                                onSelect={(id) => setSmartcard(id)}
                            />
                        )}

                        <div className="flex items-center justify-between rounded-2xl border-2 border-border bg-white dark:bg-white/5 p-4">
                            <div>
                                <p className="text-sm font-bold text-ink">Save as beneficiary</p>
                                <p className="text-xs text-muted">Save this account for future subscriptions</p>
                            </div>
                            <Switch checked={saveBeneficiary} onCheckedChange={setSaveBeneficiary} />
                        </div>
                    </div>

                    {/* Subscription Plans */}
                    <div className={`transition-all duration-300 ${verifyStatus === "success" ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                        <PlanGrid 
                            plans={formatPlansForGrid(providerPlans)}
                            selectedId={planId}
                            onChange={setPlanId}
                        />
                    </div>
                </div>
            </div>

            <StickyPayBar 
                visible={!successOpen} 
                amount={selectedPlan?.price || 0}
                summaryText={selectedPlan ? `${selectedPlan.name} · ${resolvedName || smartcard}` : "Select a plan"}
                onPay={handlePayClick}
                disabled={!isValid}
            />

            <TransactionModal
                open={pinModalOpen}
                onOpenChange={setPinModalOpen}
                state={txState}
                onPinSubmit={handlePinSubmit}
                processingText={`Activating ${selectedPlan?.name} for ${smartcard}...`}
                errorTitle="Purchase Failed"
                errorDescription={<p>{payCableTv.error?.message || txStatus?.failureReason || "The provider didn't respond in time."}</p>}
                onErrorAction={() => setPinModalOpen(false)}
            />

            <PaymentSuccessScreen 
                open={successOpen}
                amount={selectedPlan?.price || 0}
                title="Subscription Active!"
                description={<p>You successfully renewed <span className="font-bold">{selectedPlan?.name}</span> for <span className="font-bold">{resolvedName}</span>.</p>}
                onHome={() => router.push("/overview")}
                onReceipt={() => router.push("/transactions")}
            />
        </>
    );
}
