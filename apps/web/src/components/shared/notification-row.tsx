import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Wallet, ArrowUpRight, Gift, Lock, Zap, Smartphone, Tv, CreditCard, Plane, Tag, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Notification, NotificationType } from "@/lib/queries/notifications";

interface NotificationRowProps {
    notification: Notification;
}

function getIconConfig(type: NotificationType) {
    switch (type) {
        case "deposit":
            return { icon: Wallet, bg: "bg-green-100 dark:bg-green-900/30", fg: "text-green-600 dark:text-green-400" };
        case "withdrawal":
            return { icon: ArrowUpRight, bg: "bg-red-100 dark:bg-red-900/30", fg: "text-red-500 dark:text-red-400" };
        case "referral":
            return { icon: Gift, bg: "bg-violet-100 dark:bg-violet-900/30", fg: "text-violet-600 dark:text-violet-400" };
        case "kyc":
            return { icon: BadgeCheck, bg: "bg-blue-100 dark:bg-blue-900/30", fg: "text-blue-600 dark:text-blue-400" };
        case "utility":
            return { icon: Zap, bg: "bg-amber-100 dark:bg-amber-900/30", fg: "text-amber-600 dark:text-amber-400" };
        case "gift_card":
            return { icon: CreditCard, bg: "bg-pink-100 dark:bg-pink-900/30", fg: "text-pink-600 dark:text-pink-400" };
        case "flight":
            return { icon: Plane, bg: "bg-teal-100 dark:bg-teal-900/30", fg: "text-teal-600 dark:text-teal-400" };
        case "security":
            return { icon: Lock, bg: "bg-gray-100 dark:bg-gray-800", fg: "text-gray-600 dark:text-gray-400" };
        case "credit":
        default:
            return { icon: Tag, bg: "bg-violet-100 dark:bg-violet-900/30", fg: "text-violet-600 dark:text-violet-400" };
    }
}

export function NotificationRow({ notification }: NotificationRowProps) {
    const { icon: Icon, bg, fg } = getIconConfig(notification.type);

    return (
        <div
            className={cn(
                "relative flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]",
                !notification.read && "bg-violet-50/40 dark:bg-violet-900/10"
            )}
        >
            {/* Unread dot */}
            {!notification.read && (
                <span className="absolute right-4 top-4 sm:right-5 sm:top-5 h-2 w-2 rounded-full bg-violet-500" aria-label="Unread" />
            )}

            {/* Icon */}
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10", bg)}>
                <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", fg)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-semibold text-ink leading-snug">
                    {notification.title}
                </p>
                <p className="mt-0.5 text-sm text-body leading-relaxed line-clamp-2">
                    {notification.body}
                </p>
                <p className="mt-1.5 text-xs font-medium text-muted">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
}
