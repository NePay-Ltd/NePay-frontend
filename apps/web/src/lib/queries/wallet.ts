/**
 * TanStack Query hooks for the Wallet section.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { WalletBalanceDto, VirtualAccountResponseDto, ApiResponse } from "@/lib/types/api";

export const walletKeys = {
    all: ["wallet"] as const,
    balance: () => [...walletKeys.all, "balance"] as const,
    virtualAccount: () => [...walletKeys.all, "virtual-account"] as const,
};

export function useWalletBalance() {
    return useQuery<WalletBalanceDto>({
        queryKey: walletKeys.balance(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<WalletBalanceDto>>("/wallet");
            return res.data.data;
        },
    });
}

export function useVirtualAccount() {
    return useQuery<VirtualAccountResponseDto | null>({
        queryKey: walletKeys.virtualAccount(),
        queryFn: async () => {
            try {
                const res = await apiClient.get<ApiResponse<VirtualAccountResponseDto>>("/wallet/virtual-account");
                return res.data.data;
            } catch (err: any) {
                if (err.response?.status === 404) return null;
                throw err;
            }
        },
        staleTime: Infinity,
    });
}

export function useCreateVirtualAccount() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async () => {
            const res = await apiClient.post<ApiResponse<VirtualAccountResponseDto>>("/wallet/virtual-account");
            return res.data.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(walletKeys.virtualAccount(), data);
        },
    });
}
