/**
 * TanStack Query hooks for Foreign Accounts — Bridge.xyz-backed USD/EUR/GBP
 * virtual accounts. Replaces the old Fincra-backed lib/queries/fcy.ts
 * entirely.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
    ApiResponse,
    BridgeCustomerDto,
    BridgeDepositDto,
    BridgeVirtualAccountDto,
    CreateBridgeCustomerDto,
    RequestBridgeVirtualAccountDto,
} from "@/lib/types/api";

export const bridgeKeys = {
    all: ["bridge"] as const,
    customer: () => [...bridgeKeys.all, "customer"] as const,
    accounts: () => [...bridgeKeys.all, "accounts"] as const,
    deposits: () => [...bridgeKeys.all, "deposits"] as const,
};

/** Polled while the customer hasn't yet reached a terminal-ish state — Bridge's real onboarding resolves in seconds to minutes once documents are submitted. */
export function useBridgeCustomer() {
    return useQuery<BridgeCustomerDto | null>({
        queryKey: bridgeKeys.customer(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<BridgeCustomerDto | null>>("/bridge/customer");
            return res.data.data;
        },
        refetchInterval: (query) => {
            const customer = query.state.data;
            if (!customer) return false;
            const settling = customer.status === "incomplete" || customer.status === "under_review" || customer.status === "not_started";
            return settling ? 5000 : false;
        },
    });
}

/**
 * Submits KYC data plus an identity document image (multipart). Bridge
 * accepts the image inline as base64 — the backend converts it, so this
 * never uploads to a separate document-storage step the way Fincra's
 * useUploadFcyDocument did.
 */
export function useCreateBridgeCustomer() {
    const queryClient = useQueryClient();
    return useMutation<
        BridgeCustomerDto,
        Error,
        { dto: CreateBridgeCustomerDto; front: File; back?: File }
    >({
        mutationFn: async ({ dto, front, back }) => {
            const formData = new FormData();
            for (const [key, value] of Object.entries(dto)) {
                formData.append(key, String(value));
            }
            formData.append("identityDocumentFront", front);
            if (back) formData.append("identityDocumentBack", back);

            const res = await apiClient.post<ApiResponse<BridgeCustomerDto>>("/bridge/customer", formData, {
                headers: { "Content-Type": undefined },
            });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bridgeKeys.customer() });
        },
    });
}

/** Call once the user reports completing Bridge's hosted ToS page — re-checks status directly with Bridge. */
export function useRefreshBridgeCustomer() {
    const queryClient = useQueryClient();
    return useMutation<BridgeCustomerDto, Error, void>({
        mutationFn: async () => {
            const res = await apiClient.post<ApiResponse<BridgeCustomerDto>>("/bridge/customer/refresh");
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bridgeKeys.customer() });
        },
    });
}

export function useBridgeAccounts() {
    return useQuery<BridgeVirtualAccountDto[]>({
        queryKey: bridgeKeys.accounts(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<BridgeVirtualAccountDto[]>>("/bridge/accounts");
            return res.data.data;
        },
    });
}

/** Synchronous — Bridge issues a virtual account immediately once the customer is active, no async REQUESTED/APPROVED/ISSUED lifecycle. */
export function useRequestBridgeAccount() {
    const queryClient = useQueryClient();
    return useMutation<BridgeVirtualAccountDto, Error, RequestBridgeVirtualAccountDto>({
        mutationFn: async (payload) => {
            const res = await apiClient.post<ApiResponse<BridgeVirtualAccountDto>>("/bridge/accounts", payload);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bridgeKeys.accounts() });
        },
    });
}

/** Deposits settle async (webhook-driven) — polled while any is still RECEIVED (not yet CREDITED). */
export function useBridgeDeposits() {
    return useQuery<BridgeDepositDto[]>({
        queryKey: bridgeKeys.deposits(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<BridgeDepositDto[]>>("/bridge/accounts/deposits");
            return res.data.data;
        },
        refetchInterval: (query) => {
            const items = query.state.data ?? [];
            const stillSettling = items.some((d) => d.status === "RECEIVED");
            return stillSettling ? 5000 : false;
        },
    });
}
