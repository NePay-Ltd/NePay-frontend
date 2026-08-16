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
} from "@/lib/types/api";

const TERMINAL_STATUSES = ["finished", "failed", "expired", "refunded", "partially_paid"];

export const cryptoKeys = {
    all: ["crypto"] as const,
    currencies: () => [...cryptoKeys.all, "currencies"] as const,
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

export function useCryptoMinAmount(currency: string | null) {
    return useQuery<CryptoMinAmountDto>({
        queryKey: cryptoKeys.minAmount(currency ?? ""),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<CryptoMinAmountDto>>("/crypto/min-amount", {
                params: { currency },
            });
            return res.data.data;
        },
        enabled: !!currency,
    });
}

export function useGenerateDepositAddress() {
    return useMutation<CryptoDepositAddressDto, Error, { currency: string }>({
        mutationFn: async ({ currency }) => {
            const res = await apiClient.post<ApiResponse<CryptoDepositAddressDto>>("/crypto/deposit-address", { currency });
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
