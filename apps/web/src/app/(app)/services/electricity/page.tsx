"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { toast } from "sonner";

import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { useVerifyMeter, usePayElectricity, useServiceTransactionStatus } from "@/lib/queries/services";

// New Shared UI Components
import { ProviderSelector } from "@/components/services/ProviderSelector";
import { RecentNumbersRow } from "@/components/services/RecentNumbersRow";
import { AmountCalculator } from "@/components/services/AmountCalculator";
import { VerificationField } from "@/components/services/VerificationField";
import { StickyPayBar } from "@/components/services/StickyPayBar";
import { PaymentSuccessScreen } from "@/components/services/PaymentSuccessScreen";

// ─── Constants ──────────────────────────────────────────────────────────────

const PROVIDERS = [
    { id: "ikeja-electric", label: "Ikeja", color: "bg-amber-500", logoUrl: "/images/providers/ikeja.svg" },
    { id: "eko-electric", label: "Eko", color: "bg-yellow-500", logoUrl: "/images/providers/eko.svg" },
    { id: "ibadan-electric", label: "Ibadan", color: "bg-orange-500", logoUrl: "/images/providers/ibadan.svg" },
    { id: "abuja-electric", label: "Abuja", color: "bg-red-500", logoUrl: "/images/providers/abuja.svg" },
];

const PRESET_AMOUNTS = [2000, 5000, 10000, 20000];

const MOCK_RECENT_CONTACTS = [
    { name: "Home Prepaid", id: "01011234567" },
    { name: "Office", id: "04298765432" },
];

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

    const [resolvedName, setResolvedName] = React.useState<string | undefined>();
    const [verificationToken, setVerificationToken] = React.useState<string | undefined>();
    const [verifyStatus, setVerifyStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

    // Queries & Mutations
    const verifyMeter = useVerifyMeter();
    const payElectricity = usePayElectricity();

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
        setTxState("pin");
        setPinModalOpen(true);
    };

    const handlePinSubmit = (pin: string) => {
        if (!verificationToken) {
            toast.error("Please verify the meter number again");
            setTxState("error");
            return;
        }
        setTxState("processing");

        payElectricity.mutate(
            { disco: providerId, meterNumber: meter, meterType, verificationToken, amountNgn: amount, pin },
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                            <Lightbulb className="h-4 w-4" />
                        </div>
                        <h1 className="text-2xl font-black text-ink tracking-tight">Electricity</h1>
                    </div>
                </div>

                <div className="px-2 sm:px-0 space-y-8">
                    {/* Provider Selection */}
                    <ProviderSelector 
                        providers={PROVIDERS}
                        selectedId={providerId}
                        onChange={setProviderId}
                    />

                    {/* Meter Type Toggle */}
                    <div className="flex rounded-xl bg-gray-100 p-1">
                        <button
                            type="button"
                            onClick={() => setMeterType("prepaid")}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                                meterType === "prepaid" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
                            }`}
                        >
                            Prepaid
                        </button>
                        <button
                            type="button"
                            onClick={() => setMeterType("postpaid")}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                                meterType === "postpaid" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
                            }`}
                        >
                            Postpaid
                        </button>
                    </div>

                    {/* Meter Number & Verification */}
                    <div className="space-y-4">
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
                                contacts={MOCK_RECENT_CONTACTS} 
                                onSelect={(id) => setMeter(id)} 
                            />
                        )}
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
                        {meterType === 'prepaid' && (
                            <div className="bg-gray-50 border border-border rounded-xl p-4 mt-4">
                                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Your Token</p>
                                <p className="font-mono text-xl font-bold tracking-widest text-ink">
                                    {Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString().match(/.{1,4}/g)?.join('-')}
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
