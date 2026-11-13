"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DepositProgressView } from "@/components/flows/receive-crypto/deposit-progress-view";
import { RequireKyc } from "@/components/shared/require-kyc";
import { useCryptoCurrencies } from "@/lib/queries/crypto";

/**
 * Standalone tracking page for one crypto deposit — where the home page's
 * "Deposit in progress" card leads. The same progress view the deposit flow
 * opens after "I have made the deposit", addressable by payment id so progress
 * can be reopened from anywhere.
 */
function ProgressContent() {
    const router = useRouter();
    const params = useSearchParams();
    const paymentId = params.get("paymentId");
    const assetCode = params.get("asset") ?? "";
    const { data: currencies } = useCryptoCurrencies();
    const coinSymbol = currencies?.find((currency) => currency.code === assetCode)?.coin ?? null;

    if (!paymentId) {
        router.replace("/receive-crypto");
        return null;
    }

    return (
        <RequireKyc>
            <div className="mx-auto w-full max-w-2xl px-4 py-6">
                <DepositProgressView
                    paymentId={paymentId}
                    assetCode={assetCode}
                    coinSymbol={coinSymbol}
                    onBackToAddress={() => router.push("/receive-crypto")}
                    isMobile
                />
            </div>
        </RequireKyc>
    );
}

export default function DepositProgressPage() {
    return (
        <React.Suspense fallback={null}>
            <ProgressContent />
        </React.Suspense>
    );
}
