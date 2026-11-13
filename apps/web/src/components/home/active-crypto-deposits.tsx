"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { useActiveCryptoDeposits } from "@/lib/queries/crypto";
import type { CryptoDepositStage } from "@/lib/types/api";

const LABEL: Partial<Record<CryptoDepositStage, string>> = {
    awaiting_payment: "Waiting for your payment",
    detected: "Payment detected",
    confirming: "Confirming on the network",
    processing: "Crediting your wallet",
};

/**
 * "Deposit in progress" — so a customer who left the deposit screen can still
 * see their crypto deposit is moving, and get back to its progress in one tap.
 * Draws nothing when there is nothing in flight (almost always).
 */
export function ActiveCryptoDeposits() {
    const { data } = useActiveCryptoDeposits();

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3">
            {data.map((deposit) => (
                <Link
                    key={deposit.paymentId}
                    href={`/receive-crypto/progress?paymentId=${encodeURIComponent(deposit.paymentId)}&asset=${encodeURIComponent(deposit.asset)}`}
                    className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 transition-colors hover:bg-violet-100 dark:border-violet-900/30 dark:bg-violet-900/10"
                >
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-600" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-violet-900 dark:text-violet-200">
                            Deposit in progress · {deposit.asset.toUpperCase()}
                        </p>
                        <p className="truncate text-xs font-semibold text-violet-800 dark:text-violet-400">
                            {LABEL[deposit.stage] ?? "Processing"}
                            {deposit.delayed ? " — taking longer than usual" : ""}
                        </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-violet-700 dark:text-violet-300">View</span>
                </Link>
            ))}
        </div>
    );
}
