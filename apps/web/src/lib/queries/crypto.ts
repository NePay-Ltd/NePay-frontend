/**
 * TanStack Query hooks for the Crypto section.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
    ApiResponse,
    CryptoCurrencyDto,
    CryptoMinAmountDto,
    CryptoDepositAddressDto,
    CryptoDepositStatusDto,
    CryptoPricesDto,
} from "@/lib/types/api";

const TERMINAL_STATUSES = ["finished", "failed", "expired", "refunded", "partially_paid"];

export const cryptoKeys = {
    all: ["crypto"] as const,
    currencies: () => [...cryptoKeys.all, "currencies"] as const,
    prices: () => [...cryptoKeys.all, "prices"] as const,
    minAmount: (currency: string) => [...cryptoKeys.all, "min-amount", currency] as const,
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

export function useCryptoDepositStatus(paymentId: string | null) {
    return useQuery<CryptoDepositStatusDto>({
        queryKey: cryptoKeys.depositStatus(paymentId ?? ""),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<CryptoDepositStatusDto>>(`/crypto/deposits/${paymentId}`);
            return res.data.data;
        },
        enabled: !!paymentId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (!status || TERMINAL_STATUSES.includes(status)) return false;
            return 7000;
        },
    });
}
