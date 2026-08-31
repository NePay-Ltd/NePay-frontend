/**
 * TanStack Query hooks for the Withdraw section.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ResolveAccountResponseDto, WithdrawalResponseDto, ApiResponse } from "@/lib/types/api";
export interface Bank {
    bankCode: string;
    bankName: string;
}

export interface SavedBankAccount {
    id: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
    iconUrl?: string;
    lastUsedAt?: string;
}

export const withdrawKeys = {
    all: ["withdraw"] as const,
    bankList: () => [...withdrawKeys.all, "bankList"] as const,
    savedAccounts: () => [...withdrawKeys.all, "savedAccounts"] as const,
    status: (id: string) => [...withdrawKeys.all, "status", id] as const,
};

export function useBankList() {
    return useQuery<Bank[]>({
        queryKey: withdrawKeys.bankList(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<Bank[]>>("/withdrawals/banks");
            return res.data.data;
        },
        staleTime: Infinity,
    });
}

export function useSavedBankAccounts() {
    return useQuery<SavedBankAccount[]>({
        queryKey: withdrawKeys.savedAccounts(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<SavedBankAccount[]>>("/withdrawals/accounts");
            return res.data.data;
        },
    });
}

export function useResolveBankAccount() {
    return useMutation<ResolveAccountResponseDto, Error, { accountNumber: string; bankCode: string }>({
        mutationFn: async ({ accountNumber, bankCode }) => {
            const res = await apiClient.get<ApiResponse<ResolveAccountResponseDto>>(
                `/withdrawals/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`
            );
            return res.data.data;
        },
    });
}

export function useSaveBankAccount() {
    const queryClient = useQueryClient();
    return useMutation<SavedBankAccount, Error, { accountNumber: string; bankCode: string; accountName: string }>({
        mutationFn: async ({ accountNumber, bankCode, accountName }) => {
            const res = await apiClient.post<ApiResponse<SavedBankAccount>>("/withdrawals/accounts", { accountNumber, bankCode, accountName });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: withdrawKeys.savedAccounts() });
        },
    });
}

export function useDeleteBankAccount() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (accountId) => {
            await apiClient.delete(`/withdrawals/accounts/${accountId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: withdrawKeys.savedAccounts() });
        },
    });
}

export function useInitiateWithdrawal() {
    return useMutation<
        WithdrawalResponseDto,
        Error,
        {
            amount: string;
            resolutionToken: string;
            pin: string;
            bankCode: string;
            accountNumber: string;
            accountName: string;
        }
    >({
        mutationFn: async (payload) => {
            const res = await apiClient.post<ApiResponse<WithdrawalResponseDto>>("/withdrawals", payload);
            return res.data.data;
        },
    });
}

export function useWithdrawalStatus(withdrawalId: string | null) {
    return useQuery<WithdrawalResponseDto>({
        queryKey: withdrawKeys.status(withdrawalId!),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<WithdrawalResponseDto>>(`/withdrawals/${withdrawalId}`);
            return res.data.data;
        },
        enabled: !!withdrawalId,
        refetchInterval: 3000,
    });
}
