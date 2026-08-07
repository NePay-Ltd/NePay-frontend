import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, type ButtonProps } from "@/components/shared/button";

export interface EmptyStateProps {
    icon: LucideIcon;
    heading: string;
    description?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    } & Omit<ButtonProps, "label" | "onClick">;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    heading,
    description,
    action,
    className,
}: EmptyStateProps) {
    const { label, onClick, ...actionRest } = action ?? {};
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center px-6 py-12 text-center",
                className,
            )}
        >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <Icon className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-ink">{heading}</h3>
            {description ? (
                <p className="mt-1 max-w-sm text-sm text-body">{description}</p>
            ) : null}
            {action ? (
                <Button
                    className="mt-5"
                    variant="primary"
                    size="md"
                    onClick={onClick}
                    {...actionRest}
                >
                    {label}
                </Button>
            ) : null}
        </div>
    );
}
