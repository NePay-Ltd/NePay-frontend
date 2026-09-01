import * as React from "react";
import { Loader2 } from "lucide-react";;
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
    cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:active:scale-100",
        "[&>svg]:pointer-events-none [&>svg]:shrink-0",
    ),
    {
        variants: {
            variant: {
                primary:
                    "bg-brand-gradient text-white shadow-sm hover:brightness-110 active:brightness-95",
                quiet:
                    "bg-white border border-border text-ink hover:bg-violet-050 dark:hover:bg-gray-100 active:bg-violet-100 dark:active:bg-gray-100/80",
                ghost:
                    "bg-transparent text-ink hover:bg-violet-100 dark:hover:bg-gray-100 active:bg-violet-100/70 dark:active:bg-gray-100/80",
                danger:
                    "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:bg-red-500/25",
            },
            size: {
                sm: "h-9 px-3 [&>svg]:h-4 [&>svg]:w-4",
                md: "h-11 px-5 [&>svg]:h-5 [&>svg]:w-5",
                lg: "h-12 px-6 text-base [&>svg]:h-5 [&>svg]:w-5",
                icon: "h-11 w-11 [&>svg]:h-5 [&>svg]:w-5",
            },
            fullWidth: {
                true: "w-full",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    /** Render as child element (composition pattern). */
    asChild?: boolean;
    /** Show a spinner and disable interaction. */
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            fullWidth,
            asChild = false,
            loading = false,
            disabled,
            children,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : "button";

        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size, fullWidth }), className)}
                disabled={disabled ?? loading}
                aria-busy={loading || undefined}
                {...props}
            >
                {asChild ? (
                    children
                ) : (
                    <>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : null}
                        {children}
                    </>
                )}
            </Comp>
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };