"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft as ArrowLeft, IconCoin as Bitcoin, IconBuilding as Landmark, IconCard as CreditCard, IconCopy as Copy } from "@/components/icons";
import { Globe } from "lucide-react";
import { AlertCircle, Loader2, FlaskConical } from "lucide-react";;
import { toast } from "sonner";

import { usePaystackCheckout } from "@/hooks/use-paystack";
import { useSimulateDeposit, useVirtualAccount, useWalletBalance } from "@/lib/queries/wallet";
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
function copyAccountNumber(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Account number copied to clipboard");
}

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
            toast.success(`Wallet credited. New balance ${formatNairaString(current)}.`);
            clearInterval(interval);
            return;
        }

        if (attempts >= 10) {
            clearInterval(interval);
            toast.info("Still processing. Check your balance shortly.");
        }
    }, 2000);
}

export default function AddMoneyPage() {
    const router = useRouter();
    const { initializePayment, isReady } = usePaystackCheckout();

    // Bank Transfer (virtual account)
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
                    toast.info("Deposit triggered. Crediting via a real sandbox transfer, this takes a few seconds.");
                    pollForCredit(balanceBefore, refetchBalance);
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Could not trigger the simulated deposit.");
                },
            },
        );
    };


    return (
        <div className="w-full space-y-6">
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
            <Panel className="relative overflow-hidden">
                <PanelBody className="p-2">
                    <div className="flex flex-col space-y-1">
                        {/* Option 1: Crypto Deposit */}
                        <div className="rounded-lg overflow-hidden">
                            <RowItem
                                icon={Bitcoin}
                                iconTint="amber"
                                title="Crypto Deposit"
                                subtitle="USDT / USDC, instant conversion"
                                showChevron
                                onClick={() => router.push("/receive-crypto")}
                                className="px-3 hover:bg-violet-050 dark:hover:bg-violet-900/10"
                            />
                        </div>

                        {/* Option 2: Bank Transfer */}
                        <div className="rounded-lg overflow-hidden">
                            <RowItem
                                icon={Landmark}
                                iconTint="blue"
                                title="Bank Transfer"
                                subtitle="Use your dedicated virtual account"
                                showChevron={!bankExpanded}
                                onClick={() => setBankExpanded(!bankExpanded)}
                                className={`px-3 transition-colors hover:bg-violet-050 dark:hover:bg-violet-900/10 ${bankExpanded ? "bg-violet-050 dark:bg-violet-900/10" : ""}`}
                            />

                            {bankExpanded && (
                                <div className="overflow-hidden bg-violet-050/50 dark:bg-violet-900/5 transition-all duration-300 ease-in-out">
                                    <div className="space-y-4 p-4 sm:p-5 sm:pl-16 border-t border-violet-100 dark:border-violet-900/20">
                                        {vaLoading ? (
                                            <div className="flex items-center gap-2 text-sm text-muted">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Fetching account details...
                                            </div>
                                        ) : vaError ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-red-600">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Failed to load virtual account.
                                                </div>
                                                <Button size="sm" variant="quiet" onClick={() => refetchVa()}>
                                                    Retry
                                                </Button>
                                            </div>
                                        ) : virtualAccount ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Bank Name</p>
                                                        <p className="text-sm font-bold text-ink">{virtualAccount.bankName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Account Name</p>
                                                        <p className="text-sm font-bold text-ink">{virtualAccount.accountName}</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">Account Number</p>
                                                    <div className="flex items-center justify-between rounded-lg border border-border bg-white dark:bg-gray-900 px-3 py-2.5">
                                                        <span className="font-mono text-lg font-bold tracking-wide text-ink">
                                                            {virtualAccount.accountNumber}
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            variant="quiet"
                                                            onClick={() => copyAccountNumber(virtualAccount.accountNumber)}
                                                        >
                                                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                            Copy
                                                        </Button>
                                                    </div>
                                                </div>

                                                <Button
                                                    fullWidth
                                                    variant="primary"
                                                    onClick={() => router.push("/transactions")}
                                                >
                                                    I&apos;ve made the transfer
                                                </Button>
                                                <p className="text-center text-[11px] text-muted">
                                                    Transfers usually arrive within 1-3 minutes.
                                                </p>
                                            </>
                                        ) : (
                                            // No "create virtual account" button here on purpose:
                                            // BVN approval auto-provisions it server-side — the
                                            // backend never stores the raw BVN, so there's no
                                            // manual-create path to call from this screen.
                                            // Matches mobile exactly.
                                            <div className="space-y-3">
                                                <p className="text-sm text-body">
                                                    You don&apos;t have a dedicated virtual account yet.
                                                </p>
                                                <div className="rounded-xl border border-violet-200 bg-violet-100 dark:border-violet-900/30 dark:bg-violet-900/10 p-3.5">
                                                    <p className="text-sm text-violet-800 dark:text-violet-300">
                                                        Your account is created automatically once your BVN verification is approved. No separate setup needed.
                                                    </p>
                                                    <Button
                                                        fullWidth
                                                        variant="primary"
                                                        className="mt-3"
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

                        {/* Option 2b: Foreign Currency Account */}
                        <div className="rounded-lg overflow-hidden">
                            <RowItem
                                icon={Globe}
                                iconTint="green"
                                title="Foreign Currency Account"
                                subtitle="USD / EUR / GBP / CAD, convert to Naira anytime"
                                showChevron
                                onClick={() => router.push("/foreign-accounts")}
                                className="px-3 hover:bg-violet-050 dark:hover:bg-violet-900/10"
                            />
                        </div>

                        {/*
                            Option 4: Simulate Deposit — test mode only. The
                            button doesn't exist at all (not just disabled)
                            unless the backend's own GET /config/test-mode
                            confirms it: `testMode` is undefined while
                            loading and false in a live build, so this only
                            ever renders `=== true`.
                        */}
                        {testMode === true && (
                            <div className="rounded-lg bg-transparent overflow-hidden">
                                <RowItem
                                    icon={FlaskConical}
                                    iconTint="amber"
                                    title="Simulate Deposit"
                                    subtitle="Test mode, credits your wallet via a real sandbox transfer"
                                    showChevron={!simulateExpanded}
                                    onClick={() => setSimulateExpanded(!simulateExpanded)}
                                    className={`px-3 transition-colors hover:bg-violet-050 dark:hover:bg-violet-900/10 ${simulateExpanded ? "bg-violet-050 dark:bg-violet-900/10" : ""}`}
                                />

                                {simulateExpanded && (
                                    <div className="overflow-hidden bg-violet-050/50 dark:bg-violet-900/5 transition-all duration-300 ease-in-out">
                                        <div className="space-y-4 p-4 sm:p-5 sm:pl-16 border-t border-violet-100 dark:border-violet-900/20">
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
