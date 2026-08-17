"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

// 10 minutes in milliseconds
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

export function AutoLogout() {
    const { logout } = useAuth();
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(() => {
        // Clear the timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        // Use the auth context logout function
        logout().then(() => {
            // Push to login with the inactivity reason
            router.push("/login?reason=inactivity");
        });
    }, [logout, router]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    }, [handleLogout]);

    useEffect(() => {
        // Set initial timer
        resetTimer();

        // Events that indicate user activity
        const events = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
            "click"
        ];

        // Attach listeners
        events.forEach((event) => {
            window.addEventListener(event, resetTimer, { passive: true });
        });

        return () => {
            // Cleanup listeners
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [resetTimer]);

    // This is a logic-only component, it renders nothing
    return null;
}
