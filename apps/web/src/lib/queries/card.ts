/**
 * TanStack Query hooks for the Virtual Card Waitlist module.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    mockGetWaitlistStatus,
    mockJoinWaitlist,
} from "@/lib/mock-card";

export const cardKeys = {
    all: ["card"] as const,
    waitlist: () => [...cardKeys.all, "waitlist"] as const,
};

export function useWaitlistStatus() {
    return useQuery<boolean>({
        queryKey: cardKeys.waitlist(),
        queryFn: mockGetWaitlistStatus,
    });
}

export function useJoinWaitlist() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: mockJoinWaitlist,
        onSuccess: () => {
            // Update UI to reflect the joined status immediately
            queryClient.setQueryData(cardKeys.waitlist(), true);
        },
    });
}

