import { IconArrowUpRight as ArrowUpRight, IconCard as CreditCard, IconGift as Gift, IconPlane as Plane, IconAirtime as Smartphone, IconData as Wifi, IconTv as Tv, IconElectricity as Zap, IconWallet as Wallet } from "@/components/icons";
import { ArrowDownLeft, Sparkles, HeartHandshake, Undo2, type LucideIcon } from "lucide-react";;

import { cn } from "@/lib/cn";

export type TxCategory =
    | "deposit"
    | "withdrawal"
    | "payment"
    | "gift-card"
    | "flight"
    | "airtime"
    | "data"
    | "tv"
    | "electricity"
    | "admin"
    | "promo-credit"
    | "goodwill-credit"
    | "correction"
    | "cashback";

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
    "gift-card": { icon: Gift, bg: "bg-green-100", fg: "text-green-700" },
    flight: { icon: Plane, bg: "bg-teal-100", fg: "text-teal-700" },
    airtime: { icon: Smartphone, bg: "bg-violet-100", fg: "text-violet-700" },
    data: { icon: Wifi, bg: "bg-blue-100", fg: "text-blue-700" },
    tv: { icon: Tv, bg: "bg-pink-100", fg: "text-pink-700" },
    electricity: { icon: Zap, bg: "bg-amber-100", fg: "text-amber-700" },
    // Deliberately NOT an administrative/gear-looking icon: a manually
    // posted credit that doesn't fit a named category should still feel
    // like a normal part of the wallet, not a flagged staff action — see
    // AdminService.postAdjustment's own note on why every NAMED category
    // (below) gets its own icon instead of ever reaching this one.
    admin: { icon: Wallet, bg: "bg-violet-100", fg: "text-violet-700" },
    "promo-credit": { icon: Sparkles, bg: "bg-pink-100", fg: "text-pink-700" },
    "goodwill-credit": { icon: HeartHandshake, bg: "bg-rose-100", fg: "text-rose-700" },
    correction: { icon: Undo2, bg: "bg-slate-100", fg: "text-slate-700" },
    cashback: { icon: Gift, bg: "bg-emerald-100", fg: "text-emerald-700" },
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