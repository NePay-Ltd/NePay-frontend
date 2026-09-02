"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconArrowLeft as ArrowLeft } from "@/components/icons";
import { Lightbulb, Check } from "lucide-react";
import { toast } from "sonner";

import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { useVerifyMeter, usePayElectricity, useSaveBeneficiary, useSavedBillers, useServiceTransactionStatus } from "@/lib/queries/services";

// New Shared UI Components
import { ProviderRowButton } from "@/components/services/ProviderRowButton";
import { RecentNumbersRow } from "@/components/services/RecentNumbersRow";
import { AmountCalculator } from "@/components/services/AmountCalculator";
import { VerificationField } from "@/components/services/VerificationField";
import { StickyPayBar } from "@/components/services/StickyPayBar";
import { PaymentSuccessScreen } from "@/components/services/PaymentSuccessScreen";
import { Switch } from "@/components/ui/switch";

// ─── Constants ──────────────────────────────────────────────────────────────

const PROVIDERS = [
    { id: "ikeja-electric", label: "Ikeja", color: "bg-amber-500", logoUrl: "/images/providers/ikeja.svg" },
    { id: "eko-electric", label: "Eko", color: "bg-yellow-500", logoUrl: "/images/providers/eko.svg" },
    { id: "ibadan-electric", label: "Ibadan", color: "bg-orange-500", logoUrl: "/images/providers/ibadan.svg" },
    { id: "abuja-electric", label: "Abuja", color: "bg-red-500", logoUrl: "/images/providers/abuja.svg" },
];

const PRESET_AMOUNTS = [2000, 5000, 10000, 20000];

export default function ElectricityPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Support pre-filling
    const initialProviderId = searchParams.get("provider") || "ikeja-electric";
    const initialMeter = searchParams.get("meter") || ""; 

    const [providerId, setProviderId] = React.useState(initialProviderId);
    const [meterType, setMeterType] = React.useState<"prepaid" | "postpaid">("prepaid");
    const [meter, setMeter] = React.useState(initialMeter);
    const [amount, setAmount] = React.useState(0);
    const [saveBeneficiary, setSaveBeneficiary] = React.useState(true);

    const [resolvedName, setResolvedName] = React.useState<string | undefined>();
    const [verificationToken, setVerificationToken] = React.useState<string | undefined>();
    const [verifyStatus, setVerifyStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

    // Queries & Mutations
    const verifyMeter = useVerifyMeter();
    const payElectricity = usePayElectricity();
    const saveBeneficiaryMutation = useSaveBeneficiary();
    const { data: savedBillers = [] } = useSavedBillers();
    const recentContacts = savedBillers
        .filter((b) => b.serviceType === "electricity")
        .map((b) => ({ name: b.billerName, id: b.identifier }));

    // Reset resolution if user types something new or changes provider
    React.useEffect(() => {
        setResolvedName(undefined);
        setVerificationToken(undefined);
        setVerifyStatus("idle");
    }, [meter, providerId, meterType]);

    // ─── Transaction State ────────────────────────────────────────────────
    const [pinModalOpen, setPinModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("pin");
    const [txId, setTxId] = React.useState<string | null>(null);
    // The provider token is returned by the purchase endpoint and refreshed
    // from the persisted purchase while an asynchronous payment resolves.
    const [purchaseToken, setPurchaseToken] = React.useState<string | null>(null);
    const [successOpen, setSuccessOpen] = React.useState(false);

    const { data: txStatus } = useServiceTransactionStatus(txId);

    React.useEffect(() => {
        if (!txStatus) return;
        if (txStatus.token) setPurchaseToken(txStatus.token);
        if (txStatus.status === "COMPLETED") {
            if (saveBeneficiary) {
                saveBeneficiaryMutation.mutate({
                    category: "ELECTRICITY",
                    provider: providerId,
                    identifier: meter,
                    label: `${activeProvider.label} ${meter}`,
                    amount: amount.toString(),
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
        if (meter.length < 5) return;
        setVerifyStatus("loading");

        verifyMeter.mutate(
            { disco: providerId, meterNumber: meter, meterType },
            {
                onSuccess: (data) => {
                    setResolvedName(data.customerName ?? undefined);
                    setVerificationToken(data.verificationToken);
                    setVerifyStatus("success");
                },
                onError: () => {
                    setResolvedName(undefined);
                    setVerificationToken(undefined);
                    setVerifyStatus("error");
                }
            }
        );
    };

    const handlePayClick = () => {
        if (amount < 500) {
            toast.error("Minimum amount is ₦500");
            return;
        }
        setTxId(null);
        setPurchaseToken(null);
        setTxState("pin");
        setPinModalOpen(true);
    };

    const handlePinSubmit = (pin: string) => {
        if (!verificationToken) {
            toast.error("We couldn't find that meter number. Double-check your digits?");
            setTxState("error");
            return;
        }
        setTxState("processing");

        payElectricity.mutate(
            { disco: providerId, meterNumber: meter, meterType, verificationToken, amountNgn: amount, pin },
            {
                onSuccess: (res) => {
                    setPurchaseToken(res.token);
                    if (res.status === "COMPLETED") {
                        if (saveBeneficiary) {
                            saveBeneficiaryMutation.mutate({
                                category: "ELECTRICITY",
                                provider: providerId,
                                identifier: meter,
                                label: `${activeProvider.label} ${meter}`,
                                amount: amount.toString(),
                            });
                        }
                        setPinModalOpen(false);
                        setSuccessOpen(true);
                        return;
                    }
                    setTxId(res.id);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Payment failed");
                    setTxState("error");
                }
            }
        );
    };

    const isValid = verifyStatus === "success" && !!verificationToken && amount >= 500;
    const activeProvider = PROVIDERS.find(p => p.id === providerId)!;

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
                        <h1 className="text-2xl font-black text-ink tracking-tight">Electricity</h1>
                    </div>
                </div>

                <div className="px-2 sm:px-0 space-y-4">
                    {/* Provider Selection */}
                    <ProviderRowButton 
                        providers={PROVIDERS}
                        selectedId={providerId}
                        onChange={setProviderId}
                    />

                    {/* Meter Type Toggle */}
                    <div className="flex rounded-2xl border-2 border-border p-1 bg-white dark:bg-white/5">
                        <button
                            type="button"
                            onClick={() => setMeterType("prepaid")}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                                meterType === "prepaid" ? "bg-emerald-600 text-white shadow-sm" : "text-muted hover:bg-gray-50 dark:hover:bg-white/5"
                            }`}
                        >
                            Prepaid
                            {meterType === "prepaid" && (
                                <span className="absolute bottom-1.5 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
                                    <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={4} />
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMeterType("postpaid")}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all relative ${
                                meterType === "postpaid" ? "bg-emerald-600 text-white shadow-sm" : "text-muted hover:bg-gray-50 dark:hover:bg-white/5"
                            }`}
                        >
                            Postpaid
                            {meterType === "postpaid" && (
                                <span className="absolute bottom-1.5 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
                                    <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={4} />
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Meter Number & Verification */}
                    <div className="space-y-4 pt-4">
                        <VerificationField 
                            label={`${meterType === 'prepaid' ? 'Prepaid' : 'Postpaid'} Meter Number`}
                            placeholder="Enter meter number"
                            value={meter}
                            onChange={(val) => setMeter(val.replace(/\D/g, ''))}
                            onVerify={handleVerify}
                            status={verifyStatus}
                            resolvedName={resolvedName}
                            errorMessage="Failed to verify meter number"
                        />
                        
                        {/* Only show recent if we haven't typed yet or verified */}
                        {verifyStatus !== "success" && (
                            <RecentNumbersRow
                                contacts={recentContacts}
                                onSelect={(id) => setMeter(id)}
                            />
                        )}

                        <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
                            <div>
                                <p className="text-sm font-bold text-ink">Save as beneficiary</p>
                                <p className="text-xs text-muted">Save this meter for future payments</p>
                            </div>
                            <Switch checked={saveBeneficiary} onCheckedChange={setSaveBeneficiary} />
                        </div>
                    </div>

                    {/* Amount Calculator (Only show if verified) */}
                    <div className={`transition-all duration-300 ${verifyStatus === "success" ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                        <AmountCalculator 
                            amount={amount}
                            onChange={setAmount}
                            presets={PRESET_AMOUNTS}
                        />
                    </div>
                </div>
            </div>

            <StickyPayBar 
                visible={!successOpen} 
                amount={amount}
                summaryText={resolvedName ? `${activeProvider.label} · ${resolvedName}` : "Enter meter details"}
                onPay={handlePayClick}
                disabled={!isValid}
            />

            <TransactionModal
                open={pinModalOpen}
                onOpenChange={setPinModalOpen}
                state={txState}
                onPinSubmit={handlePinSubmit}
                processingText={`Purchasing ₦${amount} token for ${meter}...`}
                errorTitle="Purchase Failed"
                errorDescription={<p>{payElectricity.error?.message || txStatus?.failureReason || "The provider didn't respond in time."}</p>}
                onErrorAction={() => setPinModalOpen(false)}
            />

            <PaymentSuccessScreen 
                open={successOpen}
                amount={amount}
                title="Token Purchased!"
                description={
                    <div className="space-y-2">
                        <p>You successfully purchased electricity for <span className="font-bold">{resolvedName}</span>.</p>
                        {purchaseToken && (
                            <div className="bg-gray-50 border border-border rounded-xl p-4 mt-4">
                                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Your Token</p>
                                <p className="font-mono text-xl font-bold tracking-widest text-ink">
                                    {purchaseToken}
                                </p>
                            </div>
                        )}
                    </div>
                }
                onHome={() => router.push("/overview")}
                onReceipt={() => router.push("/transactions")}
            />
        </>
    );
}
