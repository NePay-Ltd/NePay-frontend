/**
 * TanStack Query hooks for the Wallet section.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
    WalletBalanceDto,
    VirtualAccountResponseDto,
    SimulateDepositDto,
    UpgradeTierDto,
    ApiResponse,
} from "@/lib/types/api";

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

/**
 * Triggers a real Korapay sandbox deposit to the caller's own virtual
 * account (test mode only — the backend refuses outright if live keys are
 * configured, see GET /config/test-mode / useTestMode). This only starts
 * the simulated payment; the wallet balance updates once Korapay's real
 * charge.success webhook lands — not from this mutation's own response —
 * so callers should refetch/poll the balance rather than optimistically
 * updating it here.
 */
export function useSimulateDeposit() {
    return useMutation<void, unknown, SimulateDepositDto>({
        mutationFn: async (payload) => {
            await apiClient.post("/wallet/virtual-account/simulate-deposit", payload);
        },
    });
}

/**
 * Raises the caller's virtual account to a higher CBN tier. Synchronous —
 * VFD's own upgrade endpoint resolves immediately, no webhook/polling
 * involved (unlike a deposit or payout). Invalidates the virtual-account
 * query on success so the new tier/limits show up immediately.
 */
export function useUpgradeTier() {
    const queryClient = useQueryClient();

    return useMutation<VirtualAccountResponseDto, unknown, UpgradeTierDto>({
        mutationFn: async (payload) => {
            const res = await apiClient.post<ApiResponse<VirtualAccountResponseDto>>(
                "/wallet/virtual-account/upgrade-tier",
                payload,
            );
            return res.data.data;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(walletKeys.virtualAccount(), updated);
        },
    });
}
