"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bitcoin,
    Landmark,
    CreditCard,
    Copy,
    AlertCircle,
    Loader2,
    FlaskConical
} from "lucide-react";
import { toast } from "sonner";

import { usePaystackCheckout } from "@/hooks/use-paystack";
import { useVirtualAccount, useSimulateDeposit, useWalletBalance } from "@/lib/queries/wallet";
import { useTestMode } from "@/lib/queries/config";
import { formatNaira, formatNairaString } from "@/lib/format";

import { Button } from "@/components/shared/button";
import { RowItem } from "@/components/shared/row-item";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Field } from "@/components/shared/field";
import { Chip } from "@/components/shared/chip";
import { Input } from "@/components/ui/input";

const SIMULATE_PRESETS = [5000, 20000, 100000];

/**
 * The simulated deposit credits the wallet asynchronously, via Korapay's
 * real webhook — not this request's own response. Polls the balance every
 * 2s for up to 20s, comparing against the pre-trigger balance, so the UI
 * confirms the real credit as soon as it lands rather than leaving the
 * user staring at a stale balance and guessing whether it worked.
 */
function pollForCredit(
    balanceBefore: number,
    refetchBalance: () => Promise<{ data?: { availableBalance: string } }>,
): void {
    let attempts = 0;
    const interval = setInterval(async () => {
        attempts += 1;
        const { data } = await refetchBalance();
        const current = data ? Number(data.availableBalance) : balanceBefore;

        if (current > balanceBefore) {
            toast.success(`Wallet credited — new balance ${formatNairaString(current)}.`);
            clearInterval(interval);
            return;
        }

        if (attempts >= 10) {
            clearInterval(interval);
            toast.info("Still processing — check your balance shortly.");
        }
    }, 2000);
}

export default function AddMoneyPage() {
    const router = useRouter();
    const { initializePayment, isReady } = usePaystackCheckout();

    // Virtual account state
    const [bankExpanded, setBankExpanded] = React.useState(false);

    const { data: virtualAccount, isLoading: vaLoading, error: vaError, refetch: refetchVa } = useVirtualAccount();

    // Simulate Deposit (test mode only) — the button itself doesn't exist
    // unless the backend confirms test mode, not just a client-side guess.
    const { data: testMode } = useTestMode();
    const [simulateExpanded, setSimulateExpanded] = React.useState(false);
    const [simulateAmount, setSimulateAmount] = React.useState<number | "">(SIMULATE_PRESETS[0] ?? "");
    const { data: walletBalance, refetch: refetchBalance } = useWalletBalance();
    const { mutate: simulateDeposit, isPending: simulating } = useSimulateDeposit();

    const handleSimulateDeposit = () => {
        if (!simulateAmount || simulateAmount <= 0) return;

        const balanceBefore = Number(walletBalance?.availableBalance ?? 0);

        simulateDeposit(
            { amount: simulateAmount.toFixed(2) },
            {
                onSuccess: () => {
                    toast.info("Deposit triggered — crediting via Korapay's webhook, this takes a few seconds.");
                    pollForCredit(balanceBefore, refetchBalance);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Could not trigger the simulated deposit.");
                },
            },
        );
    };

    // There is no "create virtual account" step here on purpose: BVN approval
    // auto-provisions it server-side (see the backend's BvnVerifiedListener),
    // so this page only ever displays the already-existing account. If GET
    // /wallet/virtual-account returns none yet, the only missing piece is KYC
    // — direct the user there rather than re-asking for a BVN the backend
    // already verified (it never stores the raw number, so it cannot re-issue
    // an account from this screen anyway).

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Account number copied!");
    };

    const handleDebitCard = () => {
        if (!isReady) {
            toast.error("Payment gateway is still loading.");
            return;
        }
        // Demo: default to a fixed amount for the prototype
        initializePayment({
            amount: 50000,
            email: "demo@nepay.com", // Normally from user context
            onSuccess: (reference) => {
                toast.success(`Payment successful! Ref: ${reference}`);
                router.push("/wallet");
            },
            onClose: () => {
                toast.info("Payment cancelled.");
            }
        });
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* ── Page Header ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-ink">Add Money</h1>
                    <p className="mt-0.5 text-sm text-body">
                        Choose how you want to fund your account.
                    </p>
                </div>
            </div>

            {/* ── Options Panel ──────────────────────────────────────────── */}
            <Panel>
                <PanelBody className="p-2">
                    <div className="flex flex-col space-y-1">
                        {/* Option 1: Crypto Deposit */}
                        <RowItem
                            icon={Bitcoin}
                            iconTint="amber"
                            title="Crypto Deposit"
                            subtitle="USDT / USDC — instant conversion"
                            showChevron
                            onClick={() => router.push("/receive-crypto")}
                            className="rounded-lg px-3 hover:bg-violet-050"
                        />

                        {/* Option 2: Bank Transfer */}
                        <div className="rounded-lg bg-white overflow-hidden">
                            <RowItem
                                icon={Landmark}
                                iconTint="blue"
                                title="Bank Transfer"
                                subtitle="Use your dedicated virtual account"
                                showChevron={!bankExpanded}
                                onClick={() => setBankExpanded(!bankExpanded)}
                                className={`px-3 transition-colors hover:bg-violet-050 ${bankExpanded ? "bg-violet-050" : ""}`}
                            />
                            
                            {bankExpanded && (
                                    <div className="overflow-hidden bg-violet-050/50 transition-all duration-300 ease-in-out">
                                        <div className="p-5 pl-16 border-t border-violet-100">
                                            {vaLoading ? (
                                                <div className="flex items-center gap-2 text-sm text-muted">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Fetching account details...
                                                </div>
                                            ) : vaError ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-red-500">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <span className="text-sm">Failed to load virtual account.</span>
                                                    </div>
                                                    <Button size="sm" variant="quiet" onClick={() => refetchVa()}>Retry</Button>
                                                </div>
                                            ) : virtualAccount ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-muted">Bank Name</p>
                                                            <p className="font-semibold text-ink">{virtualAccount.bankName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted">Account Name</p>
                                                            <p className="font-semibold text-ink">{virtualAccount.accountName}</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-xs text-muted">Account Number</p>
                                                            <div className="mt-1 flex items-center justify-between rounded-md border border-border bg-white px-3 py-2">
                                                                <span className="font-mono text-lg font-bold tracking-wider text-ink">
                                                                    {virtualAccount.accountNumber}
                                                                </span>
                                                                <Button
                                                                    variant="quiet"
                                                                    size="sm"
                                                                    className="h-8 px-2 text-violet-600"
                                                                    onClick={() => handleCopy(virtualAccount.accountNumber)}
                                                                >
                                                                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                                    Copy
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="pt-2">
                                                        <Button
                                                            fullWidth
                                                            variant="primary"
                                                            onClick={() => router.push("/transactions?type=deposits")}
                                                        >
                                                            I&apos;ve made the transfer
                                                        </Button>
                                                        <p className="mt-3 text-center text-xs text-body">
                                                            Transfers usually arrive within 1-3 minutes.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <p className="text-sm text-body">
                                                        You don&apos;t have a dedicated virtual account yet.
                                                    </p>

                                                    <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5">
                                                        <p className="text-sm text-violet-800">
                                                            Your account is created automatically once your
                                                            BVN verification is approved — no separate
                                                            setup needed.
                                                        </p>
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => router.push("/kyc")}
                                                        >
                                                            Complete BVN verification
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Option 3: Debit Card */}
                        <RowItem
                            icon={CreditCard}
                            iconTint="violet"
                            title="Debit Card"
                            subtitle="Fund instantly with any Nigerian card"
                            showChevron
                            onClick={handleDebitCard}
                            className="rounded-lg px-3 hover:bg-violet-050"
                        />

                        {/*
                            Option 4: Simulate Deposit — test mode only. The
                            button doesn't exist at all (not just disabled)
                            unless the backend's own GET /config/test-mode
                            confirms it: `testMode` is undefined while
                            loading and false in a live build, so this only
                            ever renders `=== true`.
                        */}
                        {testMode === true && (
                            <div className="rounded-lg bg-white overflow-hidden">
                                <RowItem
                                    icon={FlaskConical}
                                    iconTint="amber"
                                    title="Simulate Deposit"
                                    subtitle="Test mode — credits your wallet via a real Korapay sandbox transfer"
                                    showChevron={!simulateExpanded}
                                    onClick={() => setSimulateExpanded(!simulateExpanded)}
                                    className={`px-3 transition-colors hover:bg-violet-050 ${simulateExpanded ? "bg-violet-050" : ""}`}
                                />

                                {simulateExpanded && (
                                    <div className="overflow-hidden bg-violet-050/50 transition-all duration-300 ease-in-out">
                                        <div className="space-y-4 p-5 pl-16 border-t border-violet-100">
                                            <Field label="Amount">
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base text-muted">
                                                        ₦
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        className="pl-9 font-mono"
                                                        placeholder="0.00"
                                                        min={0}
                                                        value={simulateAmount}
                                                        onChange={(e) =>
                                                            setSimulateAmount(e.target.value === "" ? "" : Number(e.target.value))
                                                        }
                                                    />
                                                </div>
                                            </Field>

                                            <div className="flex flex-wrap gap-2">
                                                {SIMULATE_PRESETS.map((preset) => (
                                                    <Chip
                                                        key={preset}
                                                        active={simulateAmount === preset}
                                                        onClick={() => setSimulateAmount(preset)}
                                                    >
                                                        {formatNaira(preset)}
                                                    </Chip>
                                                ))}
                                            </div>

                                            <Button
                                                fullWidth
                                                variant="primary"
                                                loading={simulating}
                                                disabled={!simulateAmount || simulateAmount <= 0}
                                                onClick={handleSimulateDeposit}
                                            >
                                                Simulate Deposit (Test Mode)
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </PanelBody>
            </Panel>
        </div>
    );
}
