/**
 * TanStack Query hooks for Gift Cards.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import {
    mockGetGiftCardEarnings,
    mockGetGiftCardRates,
    mockSubmitGiftCard,
    mockGetGiftCardSubmissionStatus,
    type GiftCardEarnings,
    type GiftCardRates,
    type GiftCardSubmissionResponse,
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
        staleTime: 60 * 1000, // Rates can be cached for a minute
    });
}

export function useSubmitGiftCard() {
    return useMutation<{ id: string }, Error, FormData>({
        mutationFn: mockSubmitGiftCard,
    });
}

export function useGiftCardSubmissionStatus(submissionId: string | null) {
    return useQuery<GiftCardSubmissionResponse>({
        queryKey: giftCardKeys.status(submissionId!),
        queryFn: () => mockGetGiftCardSubmissionStatus(submissionId!),
        enabled: !!submissionId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status === "paid" || status === "rejected") {
                return false; // Stop polling
            }
            return 3000; // Poll every 3s while submitted/verifying
        },
    });
}
