/**
 * TanStack Query hooks for Gift Cards.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ApiPaginated, ApiResponse } from "@/lib/types/api";
import type { GiftCardOrderResponseDto, GiftCardQuoteResponseDto, GiftCardSubmissionType } from "@/lib/types/api";
import { GIFT_CARD_BRAND_CODES } from "@/lib/gift-card-brands";

export interface GiftCardEarnings {
    totalNgn: number;
    cardsSold: number;
}

export type GiftCardRates = Record<string, number>;

export const giftCardKeys = {
    all: ["gift-cards"] as const,
    earnings: () => [...giftCardKeys.all, "earnings"] as const,
    rates: () => [...giftCardKeys.all, "rates"] as const,
    order: (id: string) => [...giftCardKeys.all, "order", id] as const,
    history: (page: number) => [...giftCardKeys.all, "history", page] as const,
};

/**
 * The caller's own APPROVED gift card sales this month — real data off
 * GET /giftcards/earnings, no mock. `totalNgn`/`cardsSold` used to be a
 * fixed mock value shown to every seller regardless of their actual
 * activity.
 */
export function useGiftCardEarnings() {
    return useQuery<GiftCardEarnings>({
        queryKey: giftCardKeys.earnings(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ totalNgn: string; cardsSold: number }>>(
                "/giftcards/earnings",
                { params: { period: "month" } },
            );
            return { totalNgn: parseFloat(res.data.data.totalNgn), cardsSold: res.data.data.cardsSold };
        },
    });
}

/**
 * Per-brand payout rate off GET /giftcards/rates, keyed by this app's
 * slug (amazon, itunes, google-play, steam) via GIFT_CARD_BRAND_CODES —
 * the backend returns its own canonical codes (AMAZON, GOOGLE_PLAY, ...).
 * A preview only; POST /giftcards/quote is the figure that actually binds.
 */
export function useGiftCardRates() {
    return useQuery<GiftCardRates>({
        queryKey: giftCardKeys.rates(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<Record<string, string>>>("/giftcards/rates");
            const rates: GiftCardRates = {};
            for (const [slug, code] of Object.entries(GIFT_CARD_BRAND_CODES)) {
                if (res.data.data[code] !== undefined) {
                    rates[slug] = parseFloat(res.data.data[code]);
                }
            }
            return rates;
        },
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
    submissionType: GiftCardSubmissionType;
    /** Typed by the seller — required, never OCR-derived. */
    cardCode: string;
    /** Base64 of the LIVE camera capture — required only when submissionType is PHYSICAL. Omitted entirely for ECODE. */
    cardPhotoBase64?: string;
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

/**
 * The one place a seller can see every gift card order they've ever placed
 * — including PENDING_REVIEW and REJECTED orders, which never get a ledger
 * entry and so never appear on the generic /transactions page. GET
 * /giftcards/history, real API, no mock.
 */
export function useGiftCardHistory(page = 1, limit = 20) {
    return useQuery<ApiPaginated<GiftCardOrderResponseDto>>({
        queryKey: giftCardKeys.history(page),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ApiPaginated<GiftCardOrderResponseDto>>>(
                "/giftcards/history",
                { params: { page, limit } },
            );
            return res.data.data;
        },
    });
}
