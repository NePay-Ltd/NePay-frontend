"use client";

import * as React from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

import { getTokens } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { noticeKeys } from "@/lib/queries/notices";

function socketOrigin() {
    const configured = process.env.NEXT_PUBLIC_API_URL;
    return configured ? new URL(configured).origin : window.location.origin;
}

/**
 * Renders nothing — owns the live connection to the backend's `/notices`
 * WebSocket gateway so an admin's publish/unpublish is reflected immediately
 * instead of on next reload. Mounted unconditionally (not gated on whether
 * there's currently a notice to show): a brand-new notice published while
 * none exist yet still needs to be picked up, so this can't wait for
 * NoticeTicker/NoticeModal to decide there's something worth connecting for.
 *
 * Both `notice:published` and `notice:unpublished` just invalidate the one
 * `noticeKeys.active()` query — NoticeTicker and NoticeModal both read that
 * same query, so one invalidation refreshes both at once.
 */
export function NoticeSocketListener() {
    const { user, isLoading } = useAuth();
    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (isLoading || !user) return;

        const token = getTokens()?.accessToken;
        if (!token) return;

        const socket = io(`${socketOrigin()}/notices`, { auth: { token }, transports: ["websocket"] });

        const invalidate = () => void queryClient.invalidateQueries({ queryKey: noticeKeys.active() });
        socket.on("notice:published", invalidate);
        socket.on("notice:unpublished", invalidate);

        return () => {
            socket.disconnect();
        };
    }, [isLoading, user, queryClient]);

    return null;
}
