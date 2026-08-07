import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

export interface SpinnerProps {
    /** Optional text rendered beside the spinner. */
    label?: string;
    className?: string;
    /** Diameter of the spinner icon. Defaults to `h-5 w-5`. */
    size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<NonNullable<SpinnerProps["size"]>, string> = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-8 w-8",
};

/**
 * A simple loading spinner with optional accompanying text.
 */
export function Spinner({ label, className, size = "md" }: SpinnerProps) {
    return (
        <span
            role="status"
            aria-live="polite"
            className={cn("inline-flex items-center gap-2 text-muted", className)}
        >
            <Loader2 className={cn("animate-spin text-violet-600", sizeClasses[size])} aria-hidden="true" />
            {label ? <span className="text-sm font-medium">{label}</span> : null}
        </span>
    );
}