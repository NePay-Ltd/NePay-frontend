import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Wallet, CheckCircle2, ArrowUpRight, Gift, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Notification, NotificationType } from "@/lib/mock-notifications";

interface NotificationRowProps {
    notification: Notification;
}

function getIconConfig(type: NotificationType) {
    switch (type) {
        case "deposit":
            return { icon: Wallet, bg: "bg-green-100", fg: "text-green-600" };
        case "kyc":
            return { icon: CheckCircle2, bg: "bg-violet-100", fg: "text-violet-600" };
        case "withdrawal":
            return { icon: ArrowUpRight, bg: "bg-violet-100", fg: "text-violet-600" };
        case "referral":
            return { icon: Gift, bg: "bg-violet-100", fg: "text-violet-600" };
        case "security":
            return { icon: Lock, bg: "bg-violet-100", fg: "text-violet-600" };
    }
}

export function NotificationRow({ notification }: NotificationRowProps) {
    const { icon: Icon, bg, fg } = getIconConfig(notification.type);

    return (
        <div
            className={cn(
                "relative flex items-start gap-4 p-5 transition-colors hover:bg-gray-50",
                !notification.read && "bg-violet-50/30"
            )}
        >
            {/* Unread Indicator */}
            {!notification.read && (
                <div className="absolute right-5 top-5 h-2 w-2 rounded-full bg-red-500" aria-label="Unread" />
            )}

            {/* Icon */}
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", bg)}>
                <Icon className={cn("h-5 w-5", fg)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-6">
                <p className="text-sm font-semibold text-ink">
                    {notification.title}
                </p>
                <p className="mt-1 text-sm text-body leading-relaxed">
                    {notification.body}
                </p>
                <p className="mt-2 text-xs font-medium text-muted">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
}
