"use client";

import * as React from "react";
import { IconBell as Bell } from "@/components/icons";;
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
        <div className="mx-auto max-w-2xl space-y-4 pb-24 sm:pb-8 px-0 sm:px-0">
            {/* Page Header */}
            <div className="flex items-center justify-between px-1 sm:px-0 pt-2 sm:pt-0">
                <h1 className="text-2xl font-bold text-ink sm:text-3xl">Notifications</h1>
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
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5">
                                <Skeleton className="h-9 w-9 shrink-0 rounded-full sm:h-10 sm:w-10" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-36 sm:w-44" />
                                    <Skeleton className="h-3 w-full max-w-xs sm:max-w-md" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-16 sm:py-20">
                        <EmptyState
                            icon={Bell}
                            heading="You're all caught up"
                            description="No transactions yet. Once you start using NePay, your activity will appear here."
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
                    <div className="border-t border-border p-4 text-center sm:p-5">
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
