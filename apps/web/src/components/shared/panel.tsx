import * as React from "react";

import { cn } from "@/lib/cn";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Remove the default padding so children control their own spacing. */
    flush?: boolean;
}

/**
 * Surface card: white background, border, rounded-2xl, soft shadow.
 * Use for grouped content throughout the app.
 */
export function Panel({ className, flush, children, ...props }: PanelProps) {
    return (
        <section
            className={cn(
                "rounded-lg border border-border bg-white shadow-sm",
                !flush && "p-5",
                className,
            )}
            {...props}
        >
            {children}
        </section>
    );
}

export interface PanelHeaderProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    title: React.ReactNode;
    /** Optional small description under the title. */
    description?: React.ReactNode;
    /** Right-aligned action (link, button, etc). */
    action?: React.ReactNode;
}

export function PanelHeader({
    title,
    description,
    action,
    className,
    ...props
}: PanelHeaderProps) {
    return (
        <div
            className={cn("mb-4 flex items-start justify-between gap-4", className)}
            {...props}
        >
            <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-ink">{title}</h3>
                {description ? (
                    <p className="mt-0.5 text-sm text-body">{description}</p>
                ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

export function PanelBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("text-sm text-body", className)} {...props}>
            {children}
        </div>
    );
}