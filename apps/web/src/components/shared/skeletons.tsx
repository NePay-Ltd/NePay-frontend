import * as React from "react";
import { cn } from "@/lib/cn";

export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-violet-100", className)}
            {...props}
        />
    );
}

export function HeroCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-lg bg-white p-6 shadow-sm", className)}>
            <div className="flex flex-col gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-40" />
                <div className="flex gap-3">
                    <Skeleton className="h-11 w-28 rounded-sm" />
                    <Skeleton className="h-11 w-28 rounded-sm" />
                </div>
            </div>
        </div>
    );
}

export function TableRowSkeleton({
    rows = 5,
    className,
}: {
    rows?: number;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col divide-y divide-border", className)}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                </div>
            ))}
        </div>
    );
}

export function TileGridSkeleton({
    count = 8,
    className,
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
                className,
            )}
        >
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col items-center gap-3 rounded-lg border border-border p-5"
                >
                    <Skeleton className="h-12 w-12 rounded-sm" />
                    <Skeleton className="h-3.5 w-20" />
                </div>
            ))}
        </div>
    );
}
