import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

export interface TileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    label: string;
    /** Show a "Coming soon" overlay and disable interaction. */
    comingSoon?: boolean;
}

/**
 * Quick-action tile: icon in a violet-100 rounded square + label below.
 * Used in grid layouts (Services hub, quick actions).
 */
export function Tile({
    icon: Icon,
    label,
    comingSoon = false,
    className,
    disabled,
    ...props
}: TileProps) {
    return (
        <button
            type="button"
            disabled={disabled ?? comingSoon}
            className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-white p-3 text-center shadow-sm transition-all",
                "hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:shadow-sm disabled:hover:translate-y-0",
                className,
            )}
            {...props}
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-violet-100 text-violet-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold text-ink">{label}</span>

            {comingSoon ? (
                <span className="absolute right-2 top-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                    Soon
                </span>
            ) : null}
        </button>
    );
}