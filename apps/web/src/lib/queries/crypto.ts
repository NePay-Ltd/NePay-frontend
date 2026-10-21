/**
 * TanStack Query hooks for the Crypto section.
 */

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { walletKeys } from "@/lib/queries/wallet";
import {
    ApiResponse,
    CryptoCurrencyDto,
    CryptoMinAmountDto,
    CryptoDepositAddressDto,
    CryptoDepositStatusDto,
    CryptoFeeEstimateDto,
    CryptoPricesDto,
} from "@/lib/types/api";

const TERMINAL_STATUSES = ["finished", "failed", "expired", "refunded", "partially_paid"];

export const cryptoKeys = {
    all: ["crypto"] as const,
    currencies: () => [...cryptoKeys.all, "currencies"] as const,
    prices: () => [...cryptoKeys.all, "prices"] as const,
    minAmount: (currency: string) => [...cryptoKeys.all, "min-amount", currency] as const,
    feeEstimate: (currency: string) => [...cryptoKeys.all, "fee-estimate", currency] as const,
    depositStatus: (paymentId: string) => [...cryptoKeys.all, "deposit-status", paymentId] as const,
};

export function useCryptoCurrencies() {
    return useQuery<CryptoCurrencyDto[]>({
        queryKey: cryptoKeys.currencies(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ currencies: CryptoCurrencyDto[] }>>("/crypto/currencies");
            return res.data.data.currencies;
        },
        staleTime: Infinity,
    });
}

/** Real, live prices for all enabled coins where CoinGecko has an unambiguous listing — never mock/placeholder data. 30s staleTime mirrors the backend's own rate cache. */
export function useCryptoPrices() {
    return useQuery<CryptoPricesDto>({
        queryKey: cryptoKeys.prices(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<CryptoPricesDto>>("/crypto/prices");
            return res.data.data;
        },
        staleTime: 30_000,
    });
}

export function useCryptoMinAmount(currency: string | null) {
    return useQuery<CryptoMinAmountDto>({
        queryKey: cryptoKeys.minAmount(currency ?? ""),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<CryptoMinAmountDto>>("/crypto/min-amount", {
                params: { asset: currency },
            });
            return res.data.data;
        },
        enabled: !!currency,
    });
}

/** The pre-deposit fee ESTIMATE — a range at most, never a quote. A failed lookup is simply "no estimate": the screen falls back to its generic notice and nothing is blocked. */
export function useCryptoFeeEstimate(currency: string | null) {
    return useQuery<CryptoFeeEstimateDto>({
        queryKey: cryptoKeys.feeEstimate(currency ?? ""),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<CryptoFeeEstimateDto>>("/crypto/fee-estimate", {
                params: { asset: currency },
            });
            return res.data.data;
        },
        enabled: !!currency,
        staleTime: 60_000,
        retry: false,
    });
}

export function useGenerateDepositAddress() {
    return useMutation<CryptoDepositAddressDto, Error, { currency: string }>({
        mutationFn: async ({ currency }) => {
            const res = await apiClient.get<ApiResponse<CryptoDepositAddressDto>>("/crypto/deposits/address", {
                params: { asset: currency },
            });
            return res.data.data;
        },
    });
}

/** How often a deposit that is still in flight is re-checked. Short, because this is what the customer is watching; each check is one indexed read of our own table, not a provider call. */
const IN_FLIGHT_POLL_MS = 3000;

/** `finished` at the provider but nothing posted to the wallet yet: keep looking, but gently — if settlement is genuinely stuck this would otherwise poll at full speed forever. */
const AWAITING_CREDIT_POLL_MS = 10_000;

export function useCryptoDepositStatus(paymentId: string | null) {
    const queryClient = useQueryClient();

    const query = useQuery<CryptoDepositStatusDto>({
        queryKey: cryptoKeys.depositStatus(paymentId ?? ""),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<CryptoDepositStatusDto>>(`/crypto/deposits/${paymentId}`);
            return res.data.data;
        },
        enabled: !!paymentId,
        refetchInterval: process.env.NODE_ENV === 'development' ? false : (q) => {
            const data = q.state.data;
            if (!data?.status) return false;

            if (data.status === "finished") {
                // Terminal at the provider, but done for us only once the credit has posted
                // (or we know it is being held for a check) — stopping earlier left the screen
                // stuck on "crediting" with no way to notice the credit landing.
                return data.creditedAmount != null || data.underReview ? false : AWAITING_CREDIT_POLL_MS;
            }

            return TERMINAL_STATUSES.includes(data.status) ? false : IN_FLIGHT_POLL_MS;
        },
    });

    // The credit has posted: refresh what the rest of the app shows, right now, instead of
    // leaving the balance and history stale until the customer next opens those screens.
    const credited = query.data?.creditedAmount != null;
    React.useEffect(() => {
        if (!credited) return;
        queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
    }, [credited, paymentId, queryClient]);

    return query;
}
