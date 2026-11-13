/**
 * TanStack Query hooks for Foreign Accounts — Bridge.xyz-backed USD/EUR
 * virtual accounts. Replaces the old Fincra-backed lib/queries/fcy.ts
 * entirely.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
    ApiResponse,
    BridgeAccountFeeDto,
    BridgeCurrency,
    BridgeCustomerDto,
    BridgeDepositDto,
    BridgeExternalAccountDto,
    BridgePayoutDto,
    BridgePayoutQuoteDto,
    BridgeVirtualAccountDto,
    CreateBridgeCustomerDto,
    CreateBridgeExternalAccountDto,
    InitiateBridgePayoutDto,
    RequestBridgeVirtualAccountDto,
    UpdateBridgeExternalAccountAddressDto,
} from "@/lib/types/api";

export const bridgeKeys = {
    all: ["bridge"] as const,
    customer: () => [...bridgeKeys.all, "customer"] as const,
    accounts: () => [...bridgeKeys.all, "accounts"] as const,
    deposits: () => [...bridgeKeys.all, "deposits"] as const,
    fee: (currency: BridgeCurrency) => [...bridgeKeys.all, "fee", currency] as const,
    externalAccounts: () => [...bridgeKeys.all, "externalAccounts"] as const,
    payoutQuote: (amountUsd: string) => [...bridgeKeys.all, "payoutQuote", amountUsd] as const,
    payouts: () => [...bridgeKeys.all, "payouts"] as const,
};

/** Polled while the customer hasn't yet reached a terminal-ish state — Bridge's real onboarding resolves in seconds to minutes once documents are submitted. */
export function useBridgeCustomer() {
    return useQuery<BridgeCustomerDto | null>({
        queryKey: bridgeKeys.customer(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<BridgeCustomerDto | null>>("/bridge/customer");
            return res.data.data;
        },
        refetchInterval: process.env.NODE_ENV === 'development' ? false : (query) => {
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

/** The fee gating account requests for ONE currency — charged separately per currency, see BridgeAccountFeeDto's own note. */
export function useBridgeAccountFee(currency: BridgeCurrency) {
    return useQuery<BridgeAccountFeeDto>({
        queryKey: bridgeKeys.fee(currency),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<BridgeAccountFeeDto>>("/bridge/accounts/fee", { params: { currency } });
            return res.data.data;
        },
    });
}

/** Pays the fee for ONE currency. Idempotent server-side — calling this again once already paid for that currency is a safe no-op, not a second charge. */
export function usePayBridgeAccountFee() {
    const queryClient = useQueryClient();
    return useMutation<BridgeAccountFeeDto, Error, { pin: string; currency: BridgeCurrency }>({
        mutationFn: async ({ pin, currency }) => {
            const res = await apiClient.post<ApiResponse<BridgeAccountFeeDto>>("/bridge/accounts/fee/pay", { pin, currency });
            return res.data.data;
        },
        onSuccess: (_data, { currency }) => {
            queryClient.invalidateQueries({ queryKey: bridgeKeys.fee(currency) });
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
        refetchInterval: process.env.NODE_ENV === 'development' ? false : (query) => {
            const items = query.state.data ?? [];
            const stillSettling = items.some((d) => d.status === "RECEIVED");
            return stillSettling ? 5000 : false;
        },
    });
}

// ─── Foreign Payouts — sending money OUT ───────────────────────────────────

export function useBridgeExternalAccounts() {
    return useQuery<BridgeExternalAccountDto[]>({
        queryKey: bridgeKeys.externalAccounts(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<BridgeExternalAccountDto[]>>("/bridge/external-accounts");
            return res.data.data;
        },
    });
}

export function useCreateBridgeExternalAccount() {
    const queryClient = useQueryClient();
    return useMutation<BridgeExternalAccountDto, Error, CreateBridgeExternalAccountDto>({
        mutationFn: async (dto) => {
            const res = await apiClient.post<ApiResponse<BridgeExternalAccountDto>>("/bridge/external-accounts", dto);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bridgeKeys.externalAccounts() });
        },
    });
}

/** Fixes a USD recipient's address in place — see the backend's UpdateExternalAccountAddressParams note on why this exists instead of re-registering. */
export function useUpdateBridgeExternalAccountAddress() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, { id: string; dto: UpdateBridgeExternalAccountAddressDto }>({
        mutationFn: async ({ id, dto }) => {
            await apiClient.put(`/bridge/external-accounts/${id}/address`, dto);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bridgeKeys.externalAccounts() });
        },
    });
}

/** A live quote — no side effects, so this is safe to fire on every keystroke (debounced by the caller). Disabled while `amountUsd` is empty. */
export function useBridgePayoutQuote(amountUsd: string) {
    return useQuery<BridgePayoutQuoteDto>({
        queryKey: bridgeKeys.payoutQuote(amountUsd),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<BridgePayoutQuoteDto>>("/bridge/payouts/quote", {
                params: { amountUsd },
            });
            return res.data.data;
        },
        enabled: Number(amountUsd) > 0,
    });
}

/** Calls Bridge BEFORE debiting the wallet — see the backend's BridgePayoutService class-level note. A rejection here means nothing was ever charged. */
export function useInitiateBridgePayout() {
    const queryClient = useQueryClient();
    return useMutation<BridgePayoutDto, Error, InitiateBridgePayoutDto>({
        mutationFn: async (dto) => {
            const res = await apiClient.post<ApiResponse<BridgePayoutDto>>("/bridge/payouts", dto);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bridgeKeys.payouts() });
        },
    });
}

export function useBridgePayouts() {
    return useQuery<BridgePayoutDto[]>({
        queryKey: bridgeKeys.payouts(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<BridgePayoutDto[]>>("/bridge/payouts");
            return res.data.data;
        },
    });
}
