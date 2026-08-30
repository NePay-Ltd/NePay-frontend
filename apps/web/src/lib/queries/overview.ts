/**
 * TanStack Query hooks for the overview page.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { WalletBalanceDto, ApiPaginated, LedgerEntryDto, ApiResponse } from "@/lib/types/api";
import { type TxCategory } from "@/components/shared/tx-icon";
import { mapLedgerToTransaction } from "./transactions";

export interface OverviewSummary {
    balance: number;
    balanceUsd: number | null;
    preferredCurrency: string;
    preferredCurrencyEquivalent: number | null;
    sparkline: number[];
    kpi: {
        moneyIn: number;
        moneyOut: number;
        netChange: number;
        pending: number;
    };
    recentTransactions: Transaction[];
}

export interface Transaction {
    id: string;
    label: string;
    meta: string;
    amount: number;
    category: TxCategory;
    status: "success" | "pending" | "failed";
}

export const overviewKeys = {
    all: ["overview"] as const,
    summary: () => [...overviewKeys.all, "summary"] as const,
};

export function useOverviewSummary() {
    return useQuery<OverviewSummary>({
        queryKey: overviewKeys.summary(),
        queryFn: async () => {
            // Fetch real balance and recent transactions concurrently
            const [balanceRes, txRes] = await Promise.all([
                apiClient.get<ApiResponse<WalletBalanceDto>>("/wallet"),
                apiClient.get<ApiResponse<ApiPaginated<LedgerEntryDto>>>("/wallet/transactions?page=1&limit=5")
            ]);

            const balance = parseFloat(balanceRes.data.data.availableBalance);

            // From the backend's own usdEquivalent (WalletService.getUsdEquivalent) —
            // converted using the admin's real, current USD→NGN rate, not a
            // hardcoded/stale one. null when the backend has no real rate to
            // convert with (e.g. no manual rate configured) — never guessed here.
            const usdEquivalent = balanceRes.data.data.usdEquivalent;
            const balanceUsd = usdEquivalent !== null ? parseFloat(usdEquivalent) : null;

            const preferredCurrencyEquivalent = balanceRes.data.data.preferredCurrencyEquivalent;

            return {
                balance,
                balanceUsd,
                // `?? "NGN"` guards against an older backend response that
                // predates this field entirely (undefined, not null) — the
                // exact gap that produced a literal "undefined" in the
                // headline before this fix, since `undefined !== "NGN"` and
                // `undefined !== null` both read as "yes, use it" downstream.
                preferredCurrency: balanceRes.data.data.preferredCurrency ?? "NGN",
                // `!= null` (loose) catches both null and undefined — same reasoning.
                preferredCurrencyEquivalent:
                    preferredCurrencyEquivalent != null ? parseFloat(preferredCurrencyEquivalent) : null,
                // Backend currently lacks analytics for sparkline and these specific KPIs
                sparkline: [],
                kpi: {
                    moneyIn: 0,
                    moneyOut: 0,
                    netChange: 0,
                    pending: parseFloat(balanceRes.data.data.pendingBalance) || 0,
                },
                recentTransactions: txRes.data.data.items.map(mapLedgerToTransaction),
            };
        },
        staleTime: 60_000,
        enabled: typeof window !== "undefined" && !!localStorage.getItem("nepay-auth"),
    });
}
