"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { useNotifications, useMarkAllRead } from "@/lib/queries/notifications";

import { Panel } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationRow } from "@/components/shared/notification-row";
import { Skeleton } from "@/components/shared/skeletons";

export default function NotificationsPage() {
    const { 
        data, 
        isLoading, 
        isFetchingNextPage, 
        hasNextPage, 
        fetchNextPage 
    } = useNotifications();

    const { mutate: markAllRead, isPending: markingRead } = useMarkAllRead();

    // Flatten pages into a single array
    const notifications = React.useMemo(() => {
        return data?.pages.flatMap((page) => page.items) || [];
    }, [data]);

    const hasUnread = notifications.some((n) => !n.read);

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-ink">Notifications</h1>
                {notifications.length > 0 && (
                    <button
                        type="button"
                        onClick={() => markAllRead()}
                        disabled={markingRead || !hasUnread}
                        className="text-sm font-semibold text-violet-600 hover:underline disabled:opacity-50 disabled:hover:no-underline transition-opacity"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* List Panel */}
            <Panel flush>
                {isLoading ? (
                    <div className="flex flex-col divide-y divide-border">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-5">
                                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-full max-w-md" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-20">
                        <EmptyState
                            icon={Bell}
                            heading="You're all caught up"
                            description="No new notifications. When something happens on your account, you'll see it here."
                        />
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-border">
                        {notifications.map((notif) => (
                            <NotificationRow key={notif.id} notification={notif} />
                        ))}
                    </div>
                )}
                
                {/* Load More */}
                {hasNextPage && (
                    <div className="border-t border-border p-5 text-center">
                        <Button
                            variant="ghost"
                            onClick={() => fetchNextPage()}
                            loading={isFetchingNextPage}
                        >
                            {isFetchingNextPage ? "Loading..." : "Load older"}
                        </Button>
                    </div>
                )}
            </Panel>
        </div>
    );
}
