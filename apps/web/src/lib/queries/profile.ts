/**
 * TanStack Query hooks for Profile.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    mockGetProfile, 
    mockUpdateProfile, 
    mockUpdatePreferences, 
    type UserProfile 
} from "@/lib/mock-profile";
import { toast } from "sonner";

export const profileKeys = {
    all: ["profile"] as const,
    detail: () => [...profileKeys.all, "detail"] as const,
};

export function useProfile() {
    return useQuery<UserProfile>({
        queryKey: profileKeys.detail(),
        queryFn: mockGetProfile,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: mockUpdateProfile,
        onSuccess: (newProfile) => {
            queryClient.setQueryData(profileKeys.detail(), newProfile);
            toast.success("Profile updated successfully");
        },
        onError: () => {
            toast.error("Failed to update profile. Please try again.");
        }
    });
}

export function useUpdatePreferences() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: mockUpdatePreferences,
        onMutate: async (newPrefs) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: profileKeys.detail() });

            // Snapshot previous value
            const previousProfile = queryClient.getQueryData<UserProfile>(profileKeys.detail());

            // Optimistically update to the new value
            if (previousProfile) {
                queryClient.setQueryData<UserProfile>(profileKeys.detail(), {
                    ...previousProfile,
                    preferences: {
                        ...previousProfile.preferences,
                        ...newPrefs,
                    }
                });
            }

            return { previousProfile };
        },
        onError: (err, newPrefs, context) => {
            if (context?.previousProfile) {
                queryClient.setQueryData(profileKeys.detail(), context.previousProfile);
            }
            toast.error("Failed to save preferences. Please check your connection.");
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
        }
    });
}
