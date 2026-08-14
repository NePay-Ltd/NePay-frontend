/**
 * TanStack Query hooks for Profile.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { UserResponseDto, ApiResponse } from "@/lib/types/api";
import { toast } from "sonner";

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
        mutationFn: async (data: { firstName?: string; lastName?: string; phoneNumber?: string }) => {
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
