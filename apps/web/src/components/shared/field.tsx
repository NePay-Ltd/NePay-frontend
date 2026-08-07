import * as React from "react";

import { cn } from "@/lib/cn";
import { Label } from "@/components/ui/label";

export interface FieldProps {
    /** Uppercase small label text. */
    label: string;
    /** Optional `htmlFor` to bind the label to a control by id. */
    htmlFor?: string;
    /** Optional hint text below the label. */
    hint?: React.ReactNode;
    /** The input/select control. */
    children: React.ReactNode;
    /** Error message rendered below the control in red. */
    error?: string;
    /** Optional trailing addon inside the right edge (icon, button). */
    trailing?: React.ReactNode;
    className?: string;
}

/**
 * Labeled form field wrapper.
 * Renders an uppercase small label + the input/select child + optional error
 * message below. Pairs well with React Hook Form.
 */
export function Field({
    label,
    htmlFor,
    hint,
    children,
    error,
    trailing,
    className,
}: FieldProps) {
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={htmlFor}>{label}</Label>
                {hint ? (
                    <span className="text-xs text-muted">{hint}</span>
                ) : null}
            </div>

            <div className="relative">
                {children}
                {trailing ? (
                    <div className="absolute inset-y-0 right-3 flex items-center text-muted">
                        {trailing}
                    </div>
                ) : null}
            </div>

            {error ? (
                <p
                    role="alert"
                    className="text-xs font-medium text-red-500"
                >
                    {error}
                </p>
            ) : null}
        </div>
    );
}