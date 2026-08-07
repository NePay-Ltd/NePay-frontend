import {
    ArrowDownLeft,
    ArrowUpRight,
    CreditCard,
    Gift,
    Plane,
    type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";

export type TxCategory =
    | "deposit"
    | "withdrawal"
    | "payment"
    | "gift-card"
    | "flight";

export interface TxIconProps {
    category: TxCategory;
    className?: string;
    /** Override the size. Defaults to `h-10 w-10` container. */
    size?: "sm" | "md";
}

interface CategoryConfig {
    icon: LucideIcon;
    /** Background tint (e.g. bg-green-500/10). */
    bg: string;
    /** Icon color (e.g. text-green-500). */
    fg: string;
}

const CATEGORY_MAP: Record<TxCategory, CategoryConfig> = {
    deposit: { icon: ArrowDownLeft, bg: "bg-green-500/10", fg: "text-green-500" },
    withdrawal: { icon: ArrowUpRight, bg: "bg-red-500/10", fg: "text-red-500" },
    payment: { icon: CreditCard, bg: "bg-amber-500/10", fg: "text-amber-500" },
    "gift-card": { icon: Gift, bg: "bg-violet-100", fg: "text-violet-700" },
    flight: { icon: Plane, bg: "bg-blue-500/10", fg: "text-blue-500" },
};

/**
 * Colored circular icon used in transaction rows.
 * Background/icon changes based on the `category` prop.
 */
export function TxIcon({ category, className, size = "md" }: TxIconProps) {
    const config = CATEGORY_MAP[category];
    const Icon = config.icon;
    const dimensions =
        size === "sm"
            ? { box: "h-8 w-8", icon: "h-4 w-4" }
            : { box: "h-10 w-10", icon: "h-5 w-5" };

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-full",
                dimensions.box,
                config.bg,
                config.fg,
                className,
            )}
        >
            <Icon className={dimensions.icon} aria-hidden="true" />
        </span>
    );
}