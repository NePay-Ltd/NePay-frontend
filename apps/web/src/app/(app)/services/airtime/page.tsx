"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { usePayAirtime, useServiceTransactionStatus } from "@/lib/queries/services";

// New Shared UI Components
import { ProviderSelector } from "@/components/services/ProviderSelector";
import { RecentNumbersRow } from "@/components/services/RecentNumbersRow";
import { AmountCalculator } from "@/components/services/AmountCalculator";
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

const PRESET_AMOUNTS = [50, 100, 500, 1000, 2000, 5000];

// Mock recent contacts for UI refactor
const MOCK_RECENT_CONTACTS = [
    { name: "My MTN", id: "08031234567" },
    { name: "Mom", id: "07069876543" },
    { name: "John Doe", id: "08101239876" },
];

export default function AirtimePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Support pre-filling
    const initialNetwork = searchParams.get("network") || "MTN";
    const initialPhone = searchParams.get("phone") || "";

    const [network, setNetwork] = React.useState(initialNetwork);
    const [phone, setPhone] = React.useState(initialPhone);
    const [amount, setAmount] = React.useState(0);

    // Queries & Mutations
    const payAirtime = usePayAirtime();

    // ─── Transaction State ────────────────────────────────────────────────
    const [pinModalOpen, setPinModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("pin");
    const [txId, setTxId] = React.useState<string | null>(null);
    const [successOpen, setSuccessOpen] = React.useState(false);

    const { data: txStatus } = useServiceTransactionStatus(txId);

    React.useEffect(() => {
        if (!txStatus) return;
        if (txStatus.status === "COMPLETED") {
            setPinModalOpen(false); // Close pin modal
            setSuccessOpen(true);   // Open full screen success
        }
        if (txStatus.status === "FAILED") {
            setTxState("error");
        }
    }, [txStatus]);

    // ─── Handlers ───────────────────────────────────────────────────────────────
    
    // Auto-detect network prefix (simple mock logic)
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
        if (amount < 50) {
            toast.error("Minimum amount is ₦50");
            return;
        }
        setTxId(null);
        setTxState("pin");
        setPinModalOpen(true);
    };

    const handlePinSubmit = (pin: string) => {
        setTxState("processing");
        
        payAirtime.mutate(
            { phone, amountNgn: amount, network, pin },
            {
                onSuccess: (res) => {
                    setTxId(res.id);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Recharge failed");
                    setTxState("error");
                }
            }
        );
    };

    const isValid = phone.length >= 10 && amount >= 50;

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
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                            <Smartphone className="h-4 w-4" />
                        </div>
                        <h1 className="text-2xl font-black text-ink tracking-tight">Airtime</h1>
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
                            {/* Auto-detected badge */}
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

                    {/* Amount Calculator */}
                    <AmountCalculator 
                        amount={amount}
                        onChange={setAmount}
                        presets={PRESET_AMOUNTS}
                    />
                </div>
            </div>

            <StickyPayBar 
                visible={!successOpen} // Hide bar if success screen is up
                amount={amount}
                summaryText={`${network} Airtime — ${phone || "..."}`}
                onPay={handlePayClick}
                disabled={!isValid}
            />

            <TransactionModal
                open={pinModalOpen}
                onOpenChange={setPinModalOpen}
                state={txState}
                onPinSubmit={handlePinSubmit}
                processingText={`Sending ₦${amount} airtime to ${phone}...`}
                errorTitle="Recharge Failed"
                errorDescription={<p>{payAirtime.error?.message || txStatus?.failureReason || "The network provider didn't respond in time."}</p>}
                onErrorAction={() => setPinModalOpen(false)}
            />

            <PaymentSuccessScreen 
                open={successOpen}
                amount={amount}
                title="Airtime Sent!"
                description={<p>You successfully recharged <span className="font-bold">{phone}</span> via {network}.</p>}
                onHome={() => router.push("/overview")}
                onReceipt={() => router.push("/transactions")}
            />
        </>
    );
}
