/**
 * TanStack Query hooks for Notifications.
 */

import { useInfiniteQuery, useQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { 
    mockGetNotifications, 
    mockGetUnreadCount, 
    mockMarkAllRead, 
    type PaginatedNotifications 
} from "@/lib/mock-notifications";
import { toast } from "sonner";

export const notificationKeys = {
    all: ["notifications"] as const,
    list: () => [...notificationKeys.all, "list"] as const,
    unreadCount: () => [...notificationKeys.all, "unreadCount"] as const,
};

export function useNotifications() {
    return useInfiniteQuery<PaginatedNotifications>({
        queryKey: notificationKeys.list(),
        queryFn: ({ pageParam }) => mockGetNotifications(pageParam as string | null, 15),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });
}

export function useUnreadNotificationCount() {
    return useQuery<number>({
        queryKey: notificationKeys.unreadCount(),
        queryFn: mockGetUnreadCount,
        refetchInterval: 30000, // Poll every 30 seconds (swap for WebSockets/SSE on real backend)
    });
}

export function useMarkAllRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: mockMarkAllRead,
        onMutate: async () => {
            // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: notificationKeys.all });

            // 2. Snapshot the previous values
            const previousUnreadCount = queryClient.getQueryData<number>(notificationKeys.unreadCount());
            const previousList = queryClient.getQueryData<InfiniteData<PaginatedNotifications>>(notificationKeys.list());

            // 3. Optimistically update the unread count to 0
            queryClient.setQueryData(notificationKeys.unreadCount(), 0);

            // 4. Optimistically update the list to mark all items as read
            if (previousList) {
                queryClient.setQueryData<InfiniteData<PaginatedNotifications>>(notificationKeys.list(), {
                    ...previousList,
                    pages: previousList.pages.map(page => ({
                        ...page,
                        items: page.items.map(item => ({ ...item, read: true }))
                    }))
                });
            }

            // Return a context object with the snapshotted values
            return { previousUnreadCount, previousList };
        },
        onError: (err, variables, context) => {
            // Roll back to previous values if the mutation fails
            if (context?.previousUnreadCount !== undefined) {
                queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount);
            }
            if (context?.previousList !== undefined) {
                queryClient.setQueryData(notificationKeys.list(), context.previousList);
            }
            toast.error("Failed to mark notifications as read. Please try again.");
        },
        onSettled: () => {
            // Always refetch after error or success to ensure we're perfectly in sync
            void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}
