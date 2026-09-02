"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconArrowLeft as ArrowLeft, IconAirtime as Smartphone } from "@/components/icons";;
import { toast } from "sonner";

import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { usePayAirtime, useSaveBeneficiary, useSavedBillers, useUtilityCategories, useUtilityServices } from "@/lib/queries/services";
import { UtilityPurchaseResponseDto } from "@/lib/types/api";

// New Shared UI Components
import { PhoneNetworkInput } from "@/components/services/PhoneNetworkInput";
import { RecentNumbersRow } from "@/components/services/RecentNumbersRow";
import { Switch } from "@/components/ui/switch";
import { AmountCalculator } from "@/components/services/AmountCalculator";
import { StickyPayBar } from "@/components/services/StickyPayBar";
import { PaymentSuccessScreen } from "@/components/services/PaymentSuccessScreen";

// ─── Constants ──────────────────────────────────────────────────────────────

const PRESET_AMOUNTS = [50, 100, 500, 1000, 2000, 5000];



// Network-detection prefixes are matched against the fetched service names,
// since serviceIDs (e.g. "mtn") come from the backend and aren't hardcoded.
const PREFIX_TO_NETWORK_NAME: { prefixes: string[]; match: string }[] = [
    { prefixes: ["0803", "0703", "0813", "0906", "0810", "0814", "0916"], match: "mtn" },
    { prefixes: ["0805", "0705", "0815", "0811", "0905", "0915"], match: "glo" },
    { prefixes: ["0802", "0708", "0812", "0901", "0902", "0904", "0912"], match: "airtel" },
    { prefixes: ["0809", "0818", "0817", "0909", "0908"], match: "9mobile" },
];

export default function AirtimePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialNetwork = searchParams.get("network") || undefined;
    const initialPhone = searchParams.get("phone") || "";

    const [network, setNetwork] = React.useState<string | undefined>(initialNetwork);
    const [phone, setPhone] = React.useState(initialPhone);
    const [amount, setAmount] = React.useState(0);
    const [saveBeneficiary, setSaveBeneficiary] = React.useState(true);

    // ─── Dynamic catalog ────────────────────────────────────────────────────
    const { data: categories = [] } = useUtilityCategories();
    const airtimeCategory = categories.find((c) => c.name.toLowerCase().includes("airtime"));
    const { data: networks = [], isLoading: networksLoading } = useUtilityServices(airtimeCategory?.identifier);

    // Default to MTN on load if available
    React.useEffect(() => {
        if (!network && networks.length > 0) {
            const mtn = networks.find(n => n.serviceID.toLowerCase().includes('mtn'));
            setNetwork(mtn ? mtn.serviceID : (networks[0]?.serviceID || ""));
        }
    }, [network, networks]);

    const selectedNetwork = networks.find((n) => n.serviceID === network);

    // Queries & Mutations
    const payAirtime = usePayAirtime();
    const saveBeneficiaryMutation = useSaveBeneficiary();
    const { data: savedBillers = [] } = useSavedBillers();
    const recentContacts = savedBillers
        .filter((b) => b.serviceType === "airtime")
        .map((b) => ({ name: b.billerName, id: b.identifier }));

    // ─── Transaction State ────────────────────────────────────────────────
    const [pinModalOpen, setPinModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("pin");
    const [txResult, setTxResult] = React.useState<UtilityPurchaseResponseDto | null>(null);
    const [successOpen, setSuccessOpen] = React.useState(false);

    // ─── Handlers ───────────────────────────────────────────────────────────────

    // Auto-detect network from phone prefix, matched against fetched service names
    React.useEffect(() => {
        const rule = PREFIX_TO_NETWORK_NAME.find((r) => r.prefixes.some((p) => phone.startsWith(p)));
        if (!rule) return;
        const matched = networks.find((n) => n.name.toLowerCase().includes(rule.match));
        if (matched) setNetwork(matched.serviceID);
    }, [phone, networks]);

    const minAmount = selectedNetwork?.minimium_amount ? Number(selectedNetwork.minimium_amount) : 50;
    const maxAmount = selectedNetwork?.maximum_amount ? Number(selectedNetwork.maximum_amount) : undefined;

    const handlePayClick = () => {
        if (phone.length < 10) {
            toast.error("Please enter a valid phone number");
            return;
        }
        if (amount < minAmount) {
            toast.error(`Minimum amount is ₦${minAmount}`);
            return;
        }
        if (maxAmount && amount > maxAmount) {
            toast.error(`Maximum amount is ₦${maxAmount}`);
            return;
        }
        setTxResult(null);
        setTxState("pin");
        setPinModalOpen(true);
    };

    const handlePinSubmit = (pin: string) => {
        if (!selectedNetwork) return;
        setTxState("processing");

        payAirtime.mutate(
            { phone, amountNgn: amount, network: selectedNetwork.serviceID, pin },
            {
                onSuccess: (res) => {
                    setTxResult(res);
                    if (saveBeneficiary) {
                        saveBeneficiaryMutation.mutate({
                            category: "AIRTIME",
                            provider: selectedNetwork.serviceID,
                            identifier: phone,
                            label: `${selectedNetwork.name} ${phone}`,
                            amount: amount.toString(),
                        });
                    }
                    if (res.status === "FAILED") {
                        setTxState("error");
                        return;
                    }
                    setPinModalOpen(false);
                    setSuccessOpen(true);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Recharge failed");
                    setTxState("error");
                }
            }
        );
    };

    const isValid = phone.length >= 10 && amount >= minAmount && !!selectedNetwork;

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
                        <h1 className="text-xl font-black text-ink tracking-tight">Airtime</h1>
                    </div>
                </div>

                <div className="px-2 sm:px-0 space-y-8">
                    {/* Phone Network Input & Recent */}
                    <div className="space-y-4">
                        <PhoneNetworkInput
                            phone={phone}
                            onChangePhone={setPhone}
                            providers={networks.map((n) => {
                                let label = n.name.replace(/airtime/i, '').replace(/vtu/i, '').trim();
                                let logoUrl = n.image;
                                const id = n.serviceID.toLowerCase();
                                
                                if (id.includes('mtn')) {
                                    label = 'MTN';
                                    logoUrl = '/images/providers/mtn.png';
                                } else if (id.includes('glo')) {
                                    label = 'GLO';
                                    logoUrl = '/images/providers/glo.png';
                                } else if (id.includes('airtel')) {
                                    label = 'Airtel';
                                    logoUrl = '/images/providers/airtel.png';
                                } else if (id.includes('etisalat') || id.includes('9mobile')) {
                                    label = '9mobile';
                                    logoUrl = '/images/providers/9mobile.png';
                                } else if (id.includes('foreign')) {
                                    label = 'International';
                                }
                                return { id: n.serviceID, label, color: "bg-violet-600", logoUrl };
                            })}
                            selectedProviderId={network ?? ""}
                            onChangeProvider={setNetwork}
                        />
                        <RecentNumbersRow contacts={recentContacts} onSelect={(id) => setPhone(id)} />
                        <div className="flex items-center justify-between rounded-xl bg-white p-4 border border-border">
                            <div>
                                <p className="text-sm font-bold text-ink">Save as beneficiary</p>
                                <p className="text-xs text-muted">Save this number for future recharges</p>
                            </div>
                            <Switch checked={saveBeneficiary} onCheckedChange={setSaveBeneficiary} />
                        </div>
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
                summaryText={`${selectedNetwork?.name ?? "Select network"} Airtime — ${phone || "..."}`}
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
                errorDescription={<p>{payAirtime.error?.message || txResult?.failureReason || "The network provider didn't respond in time."}</p>}
                onErrorAction={() => setPinModalOpen(false)}
            />

            <PaymentSuccessScreen
                open={successOpen}
                amount={amount}
                title={txResult?.status === "PROCESSING" ? "Airtime Processing" : "Airtime Sent!"}
                description={
                    txResult?.status === "PROCESSING" ? (
                        <p>Your recharge to <span className="font-bold">{phone}</span> is being processed. We&apos;ll update you shortly.</p>
                    ) : (
                        <p>You successfully recharged <span className="font-bold">{phone}</span> via {selectedNetwork?.name}.</p>
                    )
                }
                onHome={() => router.push("/overview")}
                onReceipt={() => router.push("/transactions")}
            />
        </>
    );
}
