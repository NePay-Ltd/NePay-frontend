"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

import { getTokens } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { noticeKeys } from "@/lib/queries/notices";

const RECONNECT_BASE_MS = 3000;
const RECONNECT_MAX_MS = 30000;

function socketOrigin() {
    const configured = process.env.NEXT_PUBLIC_API_URL;
    return configured ? new URL(configured).origin : "https://nepay-backend.onrender.com";
}

/**
 * Renders nothing — owns the live connection to the backend's `/notices`
 * WebSocket gateway so an admin's publish/unpublish/edit is reflected
 * immediately instead of on next reload. Mounted unconditionally (not gated
 * on whether there's currently a notice to show): a brand-new notice
 * published while none exist yet still needs to be picked up.
 *
 * Manages its own connection rather than trusting socket.io's auto-reconnect:
 * access tokens last ~15 minutes and the gateway answers a stale token by
 * disconnecting the client from the server side — a reason socket.io never
 * auto-reconnects from — so a connect-once socket silently stopped receiving
 * pushes after the first drop past the token's age. Every (re)connect now:
 *   1. refetches the notices first (the request goes through the axios
 *      refresh interceptor, so the stored token is fresh afterwards),
 *   2. connects with that fresh token,
 *   3. refetches again on `connect` to catch anything missed while down.
 * A disconnect or connect error schedules another attempt with backoff. The
 * socket is dropped while the tab is hidden and rebuilt when it's visible
 * again or the browser comes back online.
 *
 * Both `notice:published` and `notice:unpublished` just invalidate the one
 * `noticeKeys.active()` query — NoticeTicker and NoticeModal both read it.
 */
export function NoticeSocketListener() {
    const { user, isLoading } = useAuth();
    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (isLoading || !user) return;

        let cancelled = false;
        let socket: Socket | null = null;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;
        let attempt = 0;

        const invalidate = () => queryClient.invalidateQueries({ queryKey: noticeKeys.active() });
        const visible = () => document.visibilityState === "visible";

        const teardown = () => {
            if (retryTimer) clearTimeout(retryTimer);
            retryTimer = null;
            socket?.removeAllListeners();
            socket?.disconnect();
            socket = null;
        };

        const scheduleReconnect = () => {
            if (cancelled || retryTimer || !visible()) return;
            const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
            attempt += 1;
            retryTimer = setTimeout(() => {
                retryTimer = null;
                void connect();
            }, delay);
        };

        const connect = async () => {
            teardown();
            if (cancelled || !visible()) return;

            // Refetch first: also refreshes an expired access token via the axios interceptor.
            await invalidate().catch(() => undefined);
            const token = getTokens()?.accessToken;
            if (cancelled || !token) return;

            const next = io(`${socketOrigin()}/notices`, {
                auth: { token },
                transports: ["websocket"],
                // Reconnection is ours — a reconnect must pick up a fresh token.
                reconnection: false,
            });
            socket = next;

            next.on("connect", () => {
                attempt = 0;
                void invalidate();
            });
            next.on("notice:published", () => void invalidate());
            next.on("notice:unpublished", () => void invalidate());
            next.on("disconnect", scheduleReconnect);
            next.on("connect_error", scheduleReconnect);
        };

        const onVisibility = () => {
            if (visible()) {
                attempt = 0;
                void connect();
            } else {
                teardown();
            }
        };
        const onOnline = () => {
            attempt = 0;
            void connect();
        };

        void connect();
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("online", onOnline);

        return () => {
            cancelled = true;
            teardown();
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("online", onOnline);
        };
    }, [isLoading, user, queryClient]);

    return null;
}
