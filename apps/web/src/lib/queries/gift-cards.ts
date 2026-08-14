/**
 * TanStack Query hooks for Gift Cards.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/lib/types/api";
import {
    mockGetGiftCardEarnings,
    mockGetGiftCardRates,
    type GiftCardEarnings,
    type GiftCardRates,
} from "@/lib/mock-gift-cards";

export const giftCardKeys = {
    all: ["gift-cards"] as const,
    earnings: () => [...giftCardKeys.all, "earnings"] as const,
    rates: () => [...giftCardKeys.all, "rates"] as const,
    status: (id: string) => [...giftCardKeys.all, "status", id] as const,
};

export function useGiftCardEarnings() {
    return useQuery<GiftCardEarnings>({
        queryKey: giftCardKeys.earnings(),
        queryFn: () => mockGetGiftCardEarnings("month"),
    });
}

export function useGiftCardRates() {
    return useQuery<GiftCardRates>({
        queryKey: giftCardKeys.rates(),
        queryFn: mockGetGiftCardRates,
        staleTime: 60 * 1000,
    });
}

interface QuotePayload {
    cardBrand: string;
    faceValueUsd: string;
    quantity: number;
}
interface QuoteResponse {
    quoteId: string;
    totalPayout: string;
    rate: string;
    expiresAt: string;
}

export function useGiftCardQuote() {
    return useMutation<QuoteResponse, Error, QuotePayload>({
        mutationFn: async (payload) => {
            const res = await apiClient.post<ApiResponse<QuoteResponse>>("/giftcards/quote", payload);
            return res.data.data;
        },
    });
}

export function useSubmitGiftCard() {
    return useMutation<{ saleId: string; creditedAmount: string; status: string }, Error, { quoteId: string; cardCode: string; pin: string }>({
        mutationFn: async (payload) => {
            const res = await apiClient.post<ApiResponse<{ saleId: string; creditedAmount: string; status: string }>>("/giftcards/sell", payload);
            return res.data.data;
        },
    });
}

export function useGiftCardSubmissionStatus(submissionId: string | null) {
    return useQuery<{ id: string; status: string; brand?: string; faceValueUsd?: string; payoutNgn?: string; failureReason?: string | null }>({
        queryKey: giftCardKeys.status(submissionId!),
        queryFn: async () => {
            // Ideally GET /gift-cards/sell/:id, but API docs don't define a polling endpoint for gift cards.
            // Simulate polling success.
            return {
                id: submissionId!,
                status: "success", 
                brand: "amazon",
                faceValueUsd: "100.00",
                payoutNgn: "120000.00",
            };
        },
        enabled: !!submissionId,
        refetchInterval: false,
    });
}
