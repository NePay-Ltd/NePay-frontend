/**
 * TanStack Query hooks for aggregation pods, customer side.
 *
 * Two reads only: today's pool progress and cashback already paid. There is
 * deliberately no "expected cashback" anywhere. The backend never exposes a
 * pending figure (see PodsService.getCustomerTodaySnapshots), so nothing here
 * could show one even by accident.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiPaginated, ApiResponse } from "@/lib/types/api";

export type PodTransactionType = "CRYPTO_SELL" | "GIFT_CARD_SALE";

/** FILLING = accepting sales; FULL = target reached, batch being sold (later same-day sales don't join); COMPLETED = sold and settled. */
export type PodPhase = "FILLING" | "FULL" | "COMPLETED";

export interface PodSnapshot {
    transactionType: PodTransactionType;
    currency: string;
    /** "YYYY-MM-DD", Africa/Lagos. */
    cycleDate: string;
    /** ISO timestamp for when this day's pod closes (next Lagos midnight). */
    cycleEndsAt: string;
    phase: PodPhase;
    currentCount: number;
    targetCount: number;
    /** How many of the caller's own sales are in this pod. */
    yourContributions: number;
}

export interface PodCashbackItem {
    id: string;
    podId: string;
    transactionType: PodTransactionType;
    currency: string;
    cycleDate: string;
    cashbackAmount: string;
    paidAt: string | null;
}

export interface PodCashbackHistory extends ApiPaginated<PodCashbackItem> {
    /** Lifetime cashback actually paid, per currency. */
    totals: Array<{ currency: string; amount: string }>;
}

export const podKeys = {
    all: ["pods"] as const,
    today: () => [...podKeys.all, "today"] as const,
    cashback: (page: number) => [...podKeys.all, "cashback", page] as const,
};

export function useTodayPods() {
    return useQuery<PodSnapshot[]>({
        queryKey: podKeys.today(),
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<PodSnapshot[]>>("/pods/today");
            return response.data.data;
        },
        // Pool progress moves as other customers transact, so a gentle poll is worth it.
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });
}

export function usePodCashback(page: number, limit = 10) {
    return useQuery<PodCashbackHistory>({
        queryKey: podKeys.cashback(page),
        queryFn: async () => {
            const response = await apiClient.get<ApiResponse<PodCashbackHistory>>(
                `/pods/cashback?page=${page}&limit=${limit}`,
            );
            return response.data.data;
        },
        // Keep the previous page on screen while the next loads, so the list doesn't flash empty.
        placeholderData: (previousData) => previousData,
    });
}
