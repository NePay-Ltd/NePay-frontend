/**
 * TanStack Query hooks for Gift Cards.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/lib/types/api";
import type { GiftCardOrderResponseDto, GiftCardQuoteResponseDto } from "@/lib/types/api";
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
    order: (id: string) => [...giftCardKeys.all, "order", id] as const,
};

// Rates/earnings shown on the /gift-cards landing page have no backing
// endpoint yet (no GET /giftcards/rates exists) — left on mock data, same
// as the landing page itself; only the quote/sell/status flow below is
// wired to the real API.
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

export function useGiftCardQuote() {
    return useMutation<GiftCardQuoteResponseDto, Error, QuotePayload>({
        mutationFn: async (payload) => {
            const res = await apiClient.post<ApiResponse<GiftCardQuoteResponseDto>>("/giftcards/quote", payload);
            return res.data.data;
        },
    });
}

interface SellPayload {
    quoteId: string;
    cardCode: string;
    pin: string;
}

/**
 * Real response is a GiftCardOrder, not a fire-and-forget receipt —
 * `status` is what tells the caller whether this resolved instantly
 * (APPROVED) or needs the honest "under review" state (PENDING_REVIEW).
 * See the sell page's own handling.
 */
export function useSubmitGiftCard() {
    return useMutation<GiftCardOrderResponseDto, Error, SellPayload>({
        mutationFn: async (payload) => {
            const res = await apiClient.post<ApiResponse<GiftCardOrderResponseDto>>("/giftcards/sell", payload);
            return res.data.data;
        },
    });
}

/**
 * The submission-tracker screen's data source — GET /giftcards/:id, the
 * caller's own order. Polls every few seconds while the order is still
 * PENDING_REVIEW so "you'll be notified once it clears" is actually true
 * rather than requiring a manual refresh; stops once a terminal status
 * (APPROVED/REJECTED) is reached.
 */
export function useGiftCardOrder(id: string | null) {
    return useQuery<GiftCardOrderResponseDto>({
        queryKey: giftCardKeys.order(id ?? ""),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<GiftCardOrderResponseDto>>(`/giftcards/${id}`);
            return res.data.data;
        },
        enabled: !!id,
        refetchInterval: (query) => (query.state.data?.status === "PENDING_REVIEW" ? 5000 : false),
    });
}
