"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft as ArrowLeft, IconCoin as Bitcoin, IconBuilding as Landmark, IconCard as CreditCard, IconCopy as Copy } from "@/components/icons";
import { Globe } from "lucide-react";
import { AlertCircle, Loader2, FlaskConical } from "lucide-react";;
import { toast } from "sonner";

import { usePaystackCheckout } from "@/hooks/use-paystack";
import { useSimulateDeposit, useWalletBalance } from "@/lib/queries/wallet";
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
                    toast.info("Deposit triggered. Crediting via Korapay's webhook, this takes a few seconds.");
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
                        {process.env.NODE_ENV !== "production" && testMode === true && (
                            <div className="rounded-lg bg-transparent overflow-hidden">
                                <RowItem
                                    icon={FlaskConical}
                                    iconTint="amber"
                                    title="Simulate Deposit"
                                    subtitle="Test mode, credits your wallet via a real Korapay sandbox transfer"
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
