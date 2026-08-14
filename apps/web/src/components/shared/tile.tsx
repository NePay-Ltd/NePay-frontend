import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

export interface TileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    label: string;
    /** Show a "Coming soon" overlay and disable interaction. */
    comingSoon?: boolean;
    /** Optional badge text shown on top of the tile (e.g. "Cheap Data 🔥") */
    badge?: string;
    /** Tailwind bg class for the icon container */
    iconBg?: string;
    /** Tailwind text-color class for the icon */
    iconColor?: string;
}

/**
 * Quick-action tile: icon in a coloured rounded square + label below.
 * Left-aligned by default to match native app grid style.
 */
export function Tile({
    icon: Icon,
    label,
    comingSoon = false,
    badge,
    iconBg = "bg-violet-50",
    iconColor = "text-violet-600",
    className,
    disabled,
    ...props
}: TileProps) {
    return (
        <button
            type="button"
            disabled={disabled ?? comingSoon}
            className={cn(
                "relative group flex flex-col items-start justify-between gap-3 rounded-[16px] border border-transparent bg-gray-50 dark:bg-[#1A1A1A] p-4 text-left transition-all",
                "hover:bg-gray-100 dark:hover:bg-[#262626] active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:shadow-sm disabled:hover:translate-y-0",
                className,
            )}
            {...props}
        >
            {badge && (
                <span className="absolute -top-2.5 left-3 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white">
                    {badge} 🔥
                </span>
            )}
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>
                <Icon className={cn("h-5 w-5", iconColor)} aria-hidden="true" />
            </span>
            <span className="text-sm font-bold leading-tight text-ink">{label}</span>

            {comingSoon ? (
                <span className="absolute right-2 top-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                    Soon
                </span>
            ) : null}
        </button>
    );
}