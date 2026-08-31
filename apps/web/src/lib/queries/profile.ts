/**
 * TanStack Query hooks for Profile.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { UserResponseDto, ApiResponse, Currency } from "@/lib/types/api";
import { toast } from "sonner";
import { overviewKeys } from "./overview";

export const profileKeys = {
    all: ["profile"] as const,
    detail: () => [...profileKeys.all, "detail"] as const,
};

export function useProfile() {
    return useQuery<UserResponseDto>({
        queryKey: profileKeys.detail(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<UserResponseDto>>("/users/me");
            return res.data.data;
        },
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { firstName?: string; lastName?: string; phoneNumber?: string; emailReceipts?: boolean }) => {
            const res = await apiClient.patch<ApiResponse<UserResponseDto>>("/users/me", data);
            return res.data.data;
        },
        onSuccess: (newProfile) => {
            queryClient.setQueryData(profileKeys.detail(), newProfile);
            toast.success("Profile updated successfully");
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || "Failed to update profile. Please try again.";
            toast.error(msg);
        }
    });
}

/**
 * Restricted to NGN/USD, matching the backend's own UpdateCurrencyDto — see
 * its class-level note on why EUR/GBP were dropped rather than built out
 * (no live rate source exists for either). Purely a display preference: it
 * never touches Wallet.displayCurrency or how/where transactions actually
 * settle, only which of {NGN, USD} the wallet balance card shows as the
 * headline vs. the naira-equivalent subscript — see HeroCard.
 */
export function useUpdatePreferredCurrency() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (preferredCurrency: Extract<Currency, "NGN" | "USD">) => {
            const res = await apiClient.patch<ApiResponse<UserResponseDto>>(
                "/users/me/preferences/currency",
                { preferredCurrency },
            );
            return res.data.data;
        },
        onSuccess: (updatedProfile) => {
            queryClient.setQueryData(profileKeys.detail(), updatedProfile);
            // The balance card's headline/subscript flip depends on this —
            // without invalidating it, the change wouldn't show up until
            // the next unrelated refetch.
            queryClient.invalidateQueries({ queryKey: overviewKeys.summary() });
            toast.success("Display currency updated");
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || "Failed to update your currency preference. Please try again.";
            toast.error(msg);
        },
    });
}
