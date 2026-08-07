import * as React from "react";

import { cn } from "@/lib/cn";

export type TagVariant = "ok" | "warn" | "neutral" | "error";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: TagVariant;
    /** Optional leading dot. */
    dot?: boolean;
}

const variantClasses: Record<TagVariant, string> = {
    ok: "bg-green-500/10 text-green-500",
    warn: "bg-amber-500/10 text-amber-500",
    neutral: "bg-violet-100 text-body",
    error: "bg-red-500/10 text-red-500",
};

const dotClasses: Record<TagVariant, string> = {
    ok: "bg-green-500",
    warn: "bg-amber-500",
    neutral: "bg-muted",
    error: "bg-red-500",
};

/**
 * Small pill label for status indicators (e.g. "Successful", "Pending").
 */
export function Tag({
    variant = "neutral",
    dot = false,
    className,
    children,
    ...props
}: TagProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                variantClasses[variant],
                className,
            )}
            {...props}
        >
            {dot ? (
                <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[variant])} />
            ) : null}
            {children}
        </span>
    );
}