"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconArrowLeft as ArrowLeft } from "@/components/icons";
import { MonitorPlay } from "lucide-react";;
import { toast } from "sonner";

import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { useVerifySmartcard, usePayCableTv, useSaveBeneficiary, useSavedBillers, useServiceTransactionStatus, useUtilityCategories, useUtilityServices, useUtilityVariations } from "@/lib/queries/services";

// New Shared UI Components
import { ProviderRowButton } from "@/components/services/ProviderRowButton";
import { RecentNumbersRow } from "@/components/services/RecentNumbersRow";
import { PlanGrid } from "@/components/services/PlanGrid";
import { VerificationField } from "@/components/services/VerificationField";
import { StickyPayBar } from "@/components/services/StickyPayBar";
import { PaymentSuccessScreen } from "@/components/services/PaymentSuccessScreen";
import { Switch } from "@/components/ui/switch";

// ─── Constants ──────────────────────────────────────────────────────────────

// A rotating fallback palette — VTpass doesn't send brand colors, only a
// logo (`n.image`), so this only ever shows if a provider's image fails to
// load. The previous hardcoded 3-provider list (with fabricated data: URI
// SVG logos, and — separately — a MOCK_TV_PLANS table of fake bouquet
// names/prices/codes that didn't match VTpass's real variation codes at
// all) has been replaced by the real catalog fetched from
// GET /utilities/services?category=tv-subscription and
// GET /utilities/variations?serviceId=<provider>.
const FALLBACK_COLORS = ["bg-blue-600", "bg-green-600", "bg-orange-600", "bg-violet-600"];

export default function TvPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Support pre-filling
    const initialProviderId = searchParams.get("provider") || undefined;
    const initialSmartcard = searchParams.get("meter") || "";

    const [providerId, setProviderId] = React.useState<string | undefined>(initialProviderId);
    const [smartcard, setSmartcard] = React.useState(initialSmartcard);
    const [variationCode, setVariationCode] = React.useState("");
    const [saveBeneficiary, setSaveBeneficiary] = React.useState(true);

    const [resolvedName, setResolvedName] = React.useState<string | undefined>();
    const [verificationToken, setVerificationToken] = React.useState<string | undefined>();
    const [verifyStatus, setVerifyStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

    // ─── Dynamic catalog — every real TV provider VTpass actually offers,
    // and each provider's own real bouquets/prices, not fabricated ones.
    const { data: categories = [] } = useUtilityCategories();
    const tvCategory = categories.find((c) => c.name.toLowerCase().includes("tv"));
    const { data: services = [], isLoading: providersLoading } = useUtilityServices(tvCategory?.identifier);
    const providers = services.map((s, i) => ({
        id: s.serviceID,
        label: s.name,
        color: FALLBACK_COLORS[i % FALLBACK_COLORS.length] ?? FALLBACK_COLORS[0]!,
        logoUrl: s.image,
    }));

    React.useEffect(() => {
        const firstProvider = providers[0];
        if (!providerId && firstProvider) {
            setProviderId(firstProvider.id);
        }
    }, [providerId, providers]);

    const activeProvider = providers.find((p) => p.id === providerId);
    const { data: plans = [], isLoading: plansLoading } = useUtilityVariations(activeProvider?.id);
    const selectedPlan = plans.find((p) => p.variation_code === variationCode);

    // Queries & Mutations
    const verifySmartcard = useVerifySmartcard();
    const payCableTv = usePayCableTv();
    const saveBeneficiaryMutation = useSaveBeneficiary();
    const { data: savedBillers = [] } = useSavedBillers();
    const recentContacts = savedBillers
        .filter((b) => b.serviceType === "cable-tv")
        .map((b) => ({ name: b.billerName, id: b.identifier }));

    // Reset resolution and plan if user types something new or changes provider
    React.useEffect(() => {
        setResolvedName(undefined);
        setVerificationToken(undefined);
        setVerifyStatus("idle");
        setVariationCode("");
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
                    provider: providerId ?? "",
                    identifier: smartcard,
                    label: `${activeProvider?.label ?? "TV"} ${smartcard}`,
                    amount: selectedPlan?.variation_amount,
                }, {
                    onError: () => {
                        toast.error("Payment went through, but we couldn't save this as a beneficiary for next time.");
                    },
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
        if (smartcard.length < 5 || !providerId) return;
        setVerifyStatus("loading");

        verifySmartcard.mutate(
            { provider: providerId, smartcardNumber: smartcard },
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
        if (!selectedPlan) {
            toast.error("Please select a subscription plan");
            return;
        }
        setTxId(null);
        setTxState("pin");
        setPinModalOpen(true);
    };

    const handlePinSubmit = (pin: string) => {
        if (!selectedPlan || !providerId) return;
        if (!verificationToken) {
            toast.error("We couldn't find that smartcard number. Double-check your digits?");
            setTxState("error");
            return;
        }
        setTxState("processing");

        payCableTv.mutate(
            {
                provider: providerId,
                smartcardNumber: smartcard,
                variationCode: selectedPlan.variation_code,
                verificationToken,
                amountNgn: Number(selectedPlan.variation_amount),
                pin,
            },
            {
                onSuccess: (res) => {
                    if (res.status === "COMPLETED") {
                        if (saveBeneficiary) {
                            saveBeneficiaryMutation.mutate({
                                category: "CABLE",
                                provider: providerId,
                                identifier: smartcard,
                                label: `${activeProvider?.label ?? "TV"} ${smartcard}`,
                                amount: selectedPlan.variation_amount,
                            }, {
                                onError: () => {
                                    toast.error("Payment went through, but we couldn't save this as a beneficiary for next time.");
                                },
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

    const isValid = verifyStatus === "success" && !!verificationToken && !!selectedPlan;
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
                        <h1 className="text-2xl font-black text-ink tracking-tight">TV Subscription</h1>
                    </div>
                </div>

                <div className="px-2 sm:px-0 space-y-4">
                    {/* Provider Selection */}
                    {providersLoading ? (
                        <div className="h-[68px] rounded-2xl border-2 border-border bg-white dark:bg-white/5 animate-pulse" />
                    ) : (
                        <ProviderRowButton
                            providers={providers}
                            selectedId={providerId ?? ""}
                            onChange={setProviderId}
                        />
                    )}

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
                            plans={plans.map((p) => ({ id: p.variation_code, name: p.name, price: Number(p.variation_amount) }))}
                            selectedId={variationCode}
                            onChange={setVariationCode}
                            isLoading={plansLoading}
                        />
                    </div>
                </div>
            </div>

            <StickyPayBar
                visible={!successOpen}
                amount={selectedAmount}
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
                amount={selectedAmount}
                title="Subscription Active!"
                description={<p>You successfully renewed <span className="font-bold">{selectedPlan?.name}</span> for <span className="font-bold">{resolvedName || smartcard}</span>.</p>}
                onHome={() => router.push("/overview")}
                onReceipt={() => router.push(txId ? `/transactions/${txId}` : "/transactions")}
            />
        </>
    );
}
