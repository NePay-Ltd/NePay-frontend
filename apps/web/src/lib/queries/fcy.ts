/**
 * TanStack Query hooks for the Foreign Currency (FCY) Accounts section —
 * Fincra-backed USD/EUR/GBP/CAD accounts, collections, RFI and NGN
 * conversion. See lib/types/api.ts's own note on what's testable today.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
    ApiResponse,
    FcyAccountDto,
    FcyCollectionDto,
    FcyConversionDto,
    FcyDocumentDto,
    FcyDocumentPurpose,
    FcyRfiCaseDto,
    InitiateFcyConversionDto,
    RequestFcyAccountDto,
    SimulateCadCollectionDto,
} from "@/lib/types/api";

export const fcyKeys = {
    all: ["fcy"] as const,
    accounts: () => [...fcyKeys.all, "accounts"] as const,
    account: (id: string) => [...fcyKeys.all, "accounts", id] as const,
    collections: () => [...fcyKeys.all, "collections"] as const,
    conversions: () => [...fcyKeys.all, "conversions"] as const,
    rfiCases: () => [...fcyKeys.all, "rfi"] as const,
};

/**
 * Account status changes asynchronously (webhook-driven: REQUESTED ->
 * APPROVED -> ISSUED, or DECLINED at any point) — polled every 5s while any
 * account is still short of a terminal state (ISSUED/DECLINED/CLOSED), the
 * same "poll until settled" shape CryptoDepositStatus's own hook uses.
 */
export function useFcyAccounts() {
    return useQuery<FcyAccountDto[]>({
        queryKey: fcyKeys.accounts(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<FcyAccountDto[]>>("/fcy/accounts");
            return res.data.data;
        },
        refetchInterval: (query) => {
            const accounts = query.state.data ?? [];
            const stillSettling = accounts.some(
                (a) => a.status === "REQUESTED" || a.status === "APPROVED",
            );
            return stillSettling ? 5000 : false;
        },
    });
}

/**
 * Uploads a KYC-supporting document ahead of an account request — the
 * returned id is what POST /fcy/accounts references (see
 * RequestFcyAccountDto's own note on why never a raw URL).
 *
 * `headers: { "Content-Type": undefined }` is required, not optional —
 * confirmed live: apiClient's instance-level default `application/json`
 * header does NOT get silently overridden by axios just because the body
 * is a FormData instance (an earlier assumption in this file that turned
 * out wrong, caught live when every upload failed with "property file
 * should not exist" — the request was going out as `application/json`
 * with a multipart-boundary body, so Nest's body parser never handed it to
 * Multer at all and `file` landed as a literal property on the object
 * class-validator saw). Explicitly unsetting Content-Type per-call is what
 * lets the browser's own XHR/fetch layer set the correct
 * `multipart/form-data; boundary=...` header itself.
 */
export function useUploadFcyDocument() {
    return useMutation<FcyDocumentDto, Error, { file: File; purpose: FcyDocumentPurpose }>({
        mutationFn: async ({ file, purpose }) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("purpose", purpose);

            const res = await apiClient.post<ApiResponse<FcyDocumentDto>>("/fcy/documents", formData, {
                headers: { "Content-Type": undefined },
            });
            return res.data.data;
        },
    });
}

export function useRequestFcyAccount() {
    const queryClient = useQueryClient();
    return useMutation<FcyAccountDto, Error, RequestFcyAccountDto>({
        mutationFn: async (payload) => {
            const res = await apiClient.post<ApiResponse<FcyAccountDto>>("/fcy/accounts", payload);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: fcyKeys.accounts() });
        },
    });
}

/** Sandbox-only — see SimulateCadCollectionDto's own note on the amount-driven outcomes. */
export function useSimulateCadCollection() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, { fcyAccountId: string; amount: string }>({
        mutationFn: async ({ fcyAccountId, amount }) => {
            await apiClient.post(`/fcy/accounts/${fcyAccountId}/simulate-collection`, {
                amount,
            } satisfies SimulateCadCollectionDto);
        },
        onSuccess: () => {
            // The collection itself lands async via webhook — poll shortly after.
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: fcyKeys.collections() });
                queryClient.invalidateQueries({ queryKey: fcyKeys.rfiCases() });
            }, 3000);
        },
    });
}

/** Collections settle async (webhook-driven) — polled while any is still PENDING/AWAITING_INFO. */
export function useFcyCollections() {
    return useQuery<FcyCollectionDto[]>({
        queryKey: fcyKeys.collections(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<FcyCollectionDto[]>>("/fcy/collections");
            return res.data.data;
        },
        refetchInterval: (query) => {
            const items = query.state.data ?? [];
            const stillSettling = items.some((c) => c.status === "PENDING" || c.status === "AWAITING_INFO");
            return stillSettling ? 5000 : false;
        },
    });
}

export function useFcyConversions() {
    return useQuery<FcyConversionDto[]>({
        queryKey: fcyKeys.conversions(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<FcyConversionDto[]>>("/fcy/conversions");
            return res.data.data;
        },
        refetchInterval: (query) => {
            const items = query.state.data ?? [];
            const stillSettling = items.some((c) => c.status === "INITIATED");
            return stillSettling ? 5000 : false;
        },
    });
}

export function useInitiateFcyConversion() {
    const queryClient = useQueryClient();
    return useMutation<FcyConversionDto, Error, InitiateFcyConversionDto>({
        mutationFn: async (payload) => {
            const res = await apiClient.post<ApiResponse<FcyConversionDto>>("/fcy/conversions", payload);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: fcyKeys.conversions() });
        },
    });
}

/**
 * RFI cases are same-day/within-hours urgent (confirmed) — polled more
 * frequently than the other FCY lists so an "Action needed" banner doesn't
 * sit stale while a deadline is ticking.
 */
export function useFcyRfiCases() {
    return useQuery<FcyRfiCaseDto[]>({
        queryKey: fcyKeys.rfiCases(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<FcyRfiCaseDto[]>>("/fcy/rfi");
            return res.data.data;
        },
        refetchInterval: (query) => {
            const items = query.state.data ?? [];
            const stillOpen = items.some((r) => r.status === "OPEN" || r.status === "RESPONSE_SUBMITTED");
            return stillOpen ? 15000 : false;
        },
    });
}

export function useSubmitRfiResponse() {
    const queryClient = useQueryClient();
    return useMutation<FcyRfiCaseDto, Error, { id: string; note: string }>({
        mutationFn: async ({ id, note }) => {
            const res = await apiClient.post<ApiResponse<FcyRfiCaseDto>>(`/fcy/rfi/${id}/respond`, { note });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: fcyKeys.rfiCases() });
        },
    });
}
