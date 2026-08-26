/**
 * TanStack Query hooks for the overview page.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { WalletBalanceDto, ApiPaginated, LedgerEntryDto, ApiResponse } from "@/lib/types/api";
import { type OverviewSummary } from "@/lib/mock-overview";
import { mapLedgerToTransaction } from "./transactions";

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
                preferredCurrency: balanceRes.data.data.preferredCurrency,
                preferredCurrencyEquivalent:
                    preferredCurrencyEquivalent !== null ? parseFloat(preferredCurrencyEquivalent) : null,
                // STILL HARDCODED — unlike balance/balanceUsd above, these are not
                // wired to anything real. `sparkline` is six literal figures plus
                // today's real balance tacked on the end; `moneyIn`/`moneyOut`/
                // `netChange` are flat constants, not derived from this wallet's
                // actual ledger history at all. No backend analytics endpoint
                // exists yet to compute either for real — flagging rather than
                // quietly leaving it, since this sits in the same hook the
                // balanceUsd fix lives in.
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
