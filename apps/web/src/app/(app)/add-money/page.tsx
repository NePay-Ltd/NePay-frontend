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
    Loader2
} from "lucide-react";
import { toast } from "sonner";

import { usePaystackCheckout } from "@/hooks/use-paystack";
import { useVirtualAccount, useCreateVirtualAccount } from "@/lib/queries/wallet";
import type { VerificationType } from "@/lib/types/api";

import { Button } from "@/components/shared/button";
import { RowItem } from "@/components/shared/row-item";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";

function stripNonDigits(value: string): string {
    return value.replace(/\D/g, "");
}

export default function AddMoneyPage() {
    const router = useRouter();
    const { initializePayment, isReady } = usePaystackCheckout();

    // Virtual account state
    const [bankExpanded, setBankExpanded] = React.useState(false);

    const { data: virtualAccount, isLoading: vaLoading, error: vaError, refetch: refetchVa } = useVirtualAccount();
    const { mutate: createVirtualAccount, isPending: creatingVa, error: createVaError } = useCreateVirtualAccount();

    // Korapay's virtual-account request needs the already-verified identity number.
    const identityType: VerificationType = "BVN";
    const [identityNumber, setIdentityNumber] = React.useState("");

    const kycRequired = (createVaError as any)?.response?.status === 409;
    const canSubmitVa = identityNumber.length === 11;

    const handleCreateVirtualAccount = () => {
        createVirtualAccount(
            { identityType, identityNumber },
            {
                onError: (err: any) => {
                    if (err.response?.status !== 409) {
                        toast.error(err.response?.data?.message || "Could not create virtual account.");
                    }
                },
            },
        );
    };

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
                                                        You don&apos;t have a dedicated virtual account yet. Verify your identity again to create one.
                                                    </p>

                                                    {kycRequired ? (
                                                        <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                                                            <p className="text-sm text-amber-700">
                                                                {(createVaError as any)?.response?.data?.message ??
                                                                    "Complete KYC verification before creating a virtual account."}
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                variant="quiet"
                                                                onClick={() => router.push("/kyc")}
                                                            >
                                                                Complete KYC
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Field label={identityType}>
                                                                <Input
                                                                    inputMode="numeric"
                                                                    placeholder={`Enter your ${identityType}`}
                                                                    maxLength={11}
                                                                    value={identityNumber}
                                                                    onChange={(e) =>
                                                                        setIdentityNumber(stripNonDigits(e.target.value).slice(0, 11))
                                                                    }
                                                                    autoComplete="off"
                                                                    className="font-mono tracking-widest"
                                                                />
                                                            </Field>

                                                            <Button
                                                                variant="primary"
                                                                loading={creatingVa}
                                                                disabled={!canSubmitVa}
                                                                onClick={handleCreateVirtualAccount}
                                                            >
                                                                Create Virtual Account
                                                            </Button>
                                                        </>
                                                    )}
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
                    </div>
                </PanelBody>
            </Panel>
        </div>
    );
}
