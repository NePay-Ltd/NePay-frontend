/**
 * TanStack Query hooks for the Virtual Card Waitlist module.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/lib/types/api";

export const cardKeys = {
    all: ["card"] as const,
    waitlist: () => [...cardKeys.all, "waitlist"] as const,
};

export function useWaitlistStatus() {
    return useQuery<boolean>({
        queryKey: cardKeys.waitlist(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ onWaitlist: boolean }>>("/card/waitlist/status");
            return res.data.data.onWaitlist;
        },
    });
}

export function useJoinWaitlist() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            await apiClient.post("/card/waitlist");
        },
        onSuccess: () => {
            // Update UI to reflect the joined status immediately
            queryClient.setQueryData(cardKeys.waitlist(), true);
        },
    });
}

