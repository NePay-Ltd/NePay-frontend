"use client";

import * as React from "react";

import { cn } from "@/lib/cn";
import type { CryptoDepositStatusDto } from "@/lib/types/api";

export function trimAmount(value: string | number): string {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 8 }) : String(value);
}

/**
 * Sent / Fees / Credited for a finished deposit — every figure is a stored
 * value from the deposit record, never an estimate. Only for a 'net' deposit
 * (a 'gross' one had no fee deducted from the customer, so there is nothing to
 * itemise). If no fee figure was recorded, the Fees row is omitted and just
 * Sent and Credited show.
 */
export function DepositBreakdown({
    statusData,
    coinSymbol,
    assetCode,
}: {
    statusData: CryptoDepositStatusDto;
    coinSymbol: string | null;
    assetCode: string;
}) {
    if (statusData.creditMode !== "net" || statusData.creditedAmount == null) return null;

    const unit = (currency: string | null) =>
        currency && currency.toLowerCase() !== assetCode.toLowerCase() ? currency.toUpperCase() : (coinSymbol ?? "");

    const rows: Array<{ label: string; value: string; emphasis?: boolean }> = [];

    if (statusData.actuallyPaid != null) {
        rows.push({ label: "Sent", value: `${trimAmount(statusData.actuallyPaid)} ${unit(null)}`.trim() });
    }
    if (statusData.feeTotal != null) {
        rows.push({ label: "Fees", value: `− ${trimAmount(statusData.feeTotal)} ${unit(statusData.feeCurrency)}`.trim() });
    }
    rows.push({
        label: "Credited",
        value: `${statusData.creditedAmount.toLocaleString()} ${statusData.creditedCurrency ?? ""}`.trim(),
        emphasis: true,
    });

    return (
        <dl className="w-full mt-3 rounded-2xl border border-border bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm">
            {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 py-1.5">
                    <dt className="font-semibold text-muted">{row.label}</dt>
                    <dd className={cn("text-right", row.emphasis ? "font-black text-ink" : "font-bold text-ink")}>{row.value}</dd>
                </div>
            ))}
        </dl>
    );
}
