/**
 * TanStack Query hooks for the Transfer section.
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

export const transferKeys = {
    all: ["transfer"] as const,
    bankList: () => [...transferKeys.all, "bankList"] as const,
    savedAccounts: () => [...transferKeys.all, "savedAccounts"] as const,
    status: (id: string) => [...transferKeys.all, "status", id] as const,
};

export function useBankList() {
    return useQuery<Bank[]>({
        queryKey: transferKeys.bankList(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<Bank[]>>("/withdrawals/banks");
            return res.data.data;
        },
        staleTime: Infinity,
    });
}

export function useSavedBankAccounts() {
    return useQuery<SavedBankAccount[]>({
        queryKey: transferKeys.savedAccounts(),
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
            queryClient.invalidateQueries({ queryKey: transferKeys.savedAccounts() });
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
            queryClient.invalidateQueries({ queryKey: transferKeys.savedAccounts() });
        },
    });
}

export function useInitiateTransfer() {
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

export function useTransferStatus(withdrawalId: string | null) {
    return useQuery<WithdrawalResponseDto>({
        queryKey: transferKeys.status(withdrawalId!),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<WithdrawalResponseDto>>(`/withdrawals/${withdrawalId}`);
            return res.data.data;
        },
        enabled: !!withdrawalId,
        refetchInterval: process.env.NODE_ENV === 'development' ? false : 3000,
    });
}
