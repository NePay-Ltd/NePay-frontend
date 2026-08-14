"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

export interface ChipProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
    /** Controlled active state. */
    active?: boolean;
    /** Optional small icon rendered before the label. */
    leadingIcon?: React.ComponentType<{ className?: string }>;
}

/**
 * Pill-shaped toggle button for filters and single-select options
 * (network selection, trip type, etc).
 *
 * Active: violet-600 background, white text.
 * Inactive: white background, border.
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
    ({ active = false, leadingIcon: Icon, className, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                aria-pressed={active}
                className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 min-h-[44px] text-sm font-bold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    active
                        ? "bg-violet-600 text-white"
                        : "border border-border bg-white text-ink hover:border-violet-300 hover:text-violet-700",
                    className,
                )}
                {...props}
            >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {children}
            </button>
        );
    },
);
Chip.displayName = "Chip";