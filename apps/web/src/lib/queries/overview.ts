/**
 * TanStack Query hooks for the overview page.
 *
 * Each hook wraps a mock fetch function. To integrate with the real backend,
 * replace the queryFn body with `api.get<T>(path)` — no component changes needed.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { WalletBalanceDto, ApiPaginated, LedgerEntryDto, ApiResponse } from "@/lib/types/api";
import { fetchRateQuote, type OverviewSummary, type RateQuote } from "@/lib/mock-overview";
import { mapLedgerToTransaction } from "./transactions";

export const overviewKeys = {
    all: ["overview"] as const,
    summary: () => [...overviewKeys.all, "summary"] as const,
    rate: () => [...overviewKeys.all, "rate"] as const,
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
            
            // For now, hardcode exchange rate for balanceUsd (or use a mock)
            const balanceUsd = balance / 1565.50;

            return {
                balance,
                balanceUsd,
                // Mock sparkline and KPI since backend lacks analytics endpoints currently
                sparkline: [340_000, 355_200, 348_900, 362_100, 370_500, 378_200, balance],
                kpi: {
                    moneyIn: 142_500,
                    moneyOut: 97_800,
                    netChange: 44_700,
                    pending: parseFloat(balanceRes.data.data.pendingBalance) || 0,
                },
                recentTransactions: txRes.data.data.items.map(mapLedgerToTransaction),
            };
        },
        staleTime: 60_000,
        enabled: typeof window !== "undefined" && !!localStorage.getItem("nepay-auth"),
    });
}

export function useRateQuote() {
    return useQuery<RateQuote>({
        queryKey: overviewKeys.rate(),
        queryFn: fetchRateQuote,
        staleTime: 30_000,
        refetchInterval: 60_000,
    });
}
