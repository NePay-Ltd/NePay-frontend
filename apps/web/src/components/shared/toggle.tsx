"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

export interface ToggleProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    /** Disable interaction. */
    disabled?: boolean;
    /** Accessible label — required for screen readers. */
    label: string;
    /** Hide the visible label (still announced to AT). */
    hideLabel?: boolean;
    className?: string;
}

/**
 * iOS-style on/off switch.
 * Violet-600 fill when on, gray when off, animated knob.
 */
export function Toggle({
    checked,
    onCheckedChange,
    disabled = false,
    label,
    hideLabel = false,
    className,
}: ToggleProps) {
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const handleClick = () => {
        if (disabled) return;
        onCheckedChange(!checked);
    };

    return (
        <button
            ref={buttonRef}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={hideLabel ? label : undefined}
            disabled={disabled}
            onClick={handleClick}
            className={cn(
                "inline-flex items-center gap-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 rounded-full",
                disabled && "opacity-50 cursor-not-allowed",
                className,
            )}
        >
            {!hideLabel ? (
                <span className="text-sm font-medium text-ink">{label}</span>
            ) : null}
            <span
                className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
                    checked ? "bg-violet-600" : "bg-violet-300/60",
                )}
            >
                <span
                    className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
                        checked ? "translate-x-[22px]" : "translate-x-0.5",
                    )}
                />
            </span>
        </button>
    );
}