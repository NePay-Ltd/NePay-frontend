"use client";

import * as React from "react";

import type { DialogProps } from "@radix-ui/react-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

export interface ModalProps extends Omit<DialogProps, "title" | "description"> {
    title: string;
    description?: string;
    /** Main body content. */
    children: React.ReactNode;
    /** Footer (actions) — typically a row of Buttons. */
    footer?: React.ReactNode;
    /** Size preset. Defaults to `md` (max-w-lg). */
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
};

/**
 * Base modal for all confirmation flows in the app.
 * Built on shadcn's Dialog (Radix), with Header/Body/Footer slot support.
 */
export function Modal({
    title,
    description,
    children,
    footer,
    size = "md",
    ...props
}: ModalProps) {
    return (
        <Dialog {...props}>
            <DialogContent className={cn(sizeClasses[size])}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? <DialogDescription>{description}</DialogDescription> : null}
                </DialogHeader>

                <div className="text-sm text-body">{children}</div>

                {footer ? <DialogFooter className="gap-2">{footer}</DialogFooter> : null}
            </DialogContent>
        </Dialog>
    );
}