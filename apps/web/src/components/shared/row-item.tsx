import * as React from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

export interface RowItemProps {
    icon?: LucideIcon;
    iconTint?: "violet" | "green" | "red" | "amber" | "blue" | "gray";
    leading?: React.ReactNode;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    trailing?: React.ReactNode;
    showChevron?: boolean;
    onClick?: () => void;
    className?: string;
    children?: React.ReactNode;
}

const tintClasses: Record<NonNullable<RowItemProps["iconTint"]>, string> = {
    violet: "bg-violet-100 text-violet-700",
    green: "bg-green-500/10 text-green-500",
    red: "bg-red-500/10 text-red-500",
    amber: "bg-amber-500/10 text-amber-500",
    blue: "bg-blue-500/10 text-blue-500",
    gray: "bg-violet-100 text-muted",
};

export function RowItem({
    icon: Icon,
    iconTint,
    leading,
    title,
    subtitle,
    trailing,
    showChevron = false,
    onClick,
    className,
    children,
}: RowItemProps) {
    const interactive = Boolean(onClick);

    const content = (
        <React.Fragment>
            {children}
            {leading
                ? leading
                : Icon
                    ? (
                        <span
                            className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                iconTint ? tintClasses[iconTint] : "bg-violet-100 text-violet-700",
                            )}
                        >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                    )
                    : null}

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{title}</p>
                {subtitle ? (
                    <p className="truncate text-xs text-body">{subtitle}</p>
                ) : null}
            </div>

            {trailing ? (
                <div className="shrink-0">{trailing}</div>
            ) : showChevron ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            ) : null}
        </React.Fragment>
    );

    const baseClass = cn(
        "flex w-full items-center gap-3 px-1 py-3 text-left transition-colors",
        interactive && "cursor-pointer hover:bg-violet-050",
        className,
    );

    if (interactive) {
        return (
            <button type="button" onClick={onClick} className={baseClass}>
                {content}
            </button>
        );
    }

    return <div className={baseClass}>{content}</div>;
}