/**
 * TanStack Query hooks for the Withdraw section.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ResolveAccountResponseDto, WithdrawalResponseDto, ApiResponse } from "@/lib/types/api";
import {
    mockGetBankList,
    mockGetSavedBankAccounts,
    mockSaveBankAccount,
    mockDeleteBankAccount,
    type Bank,
    type SavedBankAccount,
} from "@/lib/mock-withdraw";

export const withdrawKeys = {
    all: ["withdraw"] as const,
    bankList: () => [...withdrawKeys.all, "bankList"] as const,
    savedAccounts: () => [...withdrawKeys.all, "savedAccounts"] as const,
    status: (id: string) => [...withdrawKeys.all, "status", id] as const,
};

// Bank lists and saved accounts are kept mocked as they are not provided in the API docs yet.
export function useBankList() {
    return useQuery<Bank[]>({
        queryKey: withdrawKeys.bankList(),
        queryFn: mockGetBankList,
        staleTime: Infinity,
    });
}

export function useSavedBankAccounts() {
    return useQuery<SavedBankAccount[]>({
        queryKey: withdrawKeys.savedAccounts(),
        queryFn: mockGetSavedBankAccounts,
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
        mutationFn: ({ accountNumber, bankCode, accountName }) => mockSaveBankAccount(accountNumber, bankCode, accountName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: withdrawKeys.savedAccounts() });
        },
    });
}

export function useDeleteBankAccount() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: mockDeleteBankAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: withdrawKeys.savedAccounts() });
        },
    });
}

export function useInitiateWithdrawal() {
    return useMutation<WithdrawalResponseDto, Error, { amount: string; resolutionToken: string; pin: string }>({
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
            // Ideally this would be GET /withdrawals/:id, but API docs don't define a polling endpoint for withdrawals.
            // In a real implementation we would fetch the specific withdrawal transaction.
            // Since it's missing, we simulate polling success if we just got a successful initiation response.
            return {
                id: withdrawalId!,
                status: "COMPLETED",
                amount: "0",
                bankCode: "",
                accountNumber: "",
                accountName: "",
                providerReference: "",
                failureReason: null,
                completedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
            };
        },
        enabled: !!withdrawalId,
        refetchInterval: false,
    });
}
