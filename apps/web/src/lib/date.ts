/**
 * Date formatting helpers built on date-fns.
 * Use these everywhere a date/time is rendered in the UI.
 */

import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/** Format an ISO date string or Date as "Aug 7, 2026". */
export function formatDate(date: string | Date): string {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "—";
    return format(d, "MMM d, yyyy");
}

/** Format as "Aug 7, 2026 · 09:14 AM". */
export function formatDateTime(date: string | Date): string {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "—";
    return format(d, "MMM d, yyyy · hh:mm a");
}

/** Format as "2 hours ago", "3 days ago", etc. */
export function formatRelativeTime(date: string | Date): string {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "—";
    return formatDistanceToNow(d, { addSuffix: true });
}

/** Format as "09:14 AM". */
export function formatTime(date: string | Date): string {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "—";
    return format(d, "hh:mm a");
}
