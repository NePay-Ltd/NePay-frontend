import * as React from "react";
import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import { TxIcon, type TxCategory } from "./tx-icon";
import { Tag } from "./tag";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/lib/stores/ui-store";

export interface BaseTransaction {
    id: string;
    label: string;
    meta: string;
    amount: number;
    category: TxCategory;
    status: "success" | "pending" | "failed";
    date?: string; // Optional for Overview, required for Transactions
    cryptoAmount?: string;
    cryptoAsset?: string;
    exchangeRate?: string;
}

export interface TransactionRowProps {
    tx: BaseTransaction;
    variant?: "table" | "compact";
    onViewReceipt?: (tx: BaseTransaction) => void;
}

function getCategoryLabel(cat: TxCategory) {
    switch (cat) {
        case "deposit": return "Deposit";
        case "withdrawal": return "Withdrawal";
        case "payment": return "Payment";
        case "gift-card": return "Gift Card";
        case "flight": return "Flight";
        case "airtime": return "Airtime";
        case "data": return "Data";
        case "tv": return "TV/Cable";
        case "electricity": return "Electricity";
        case "admin": return "Adjustment";
        case "promo-credit": return "Promo Credit";
        case "goodwill-credit": return "Goodwill Credit";
        case "correction": return "Correction";
        case "cashback": return "Cashback";
        default: return "Transfer";
    }
}

function formatDateSmart(dateString?: string) {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    
    // If it's very recent (under 1 hour), show relative minutes (e.g., "18 mins ago")
    if (now.getTime() - date.getTime() < 60 * 60 * 1000) {
        return formatDistanceToNowStrict(date, { addSuffix: true }).replace(" minutes", " mins").replace(" minute", " min");
    }
    
    if (isToday(date)) return format(date, "h:mm a"); // e.g. "2:30 PM"
    if (isYesterday(date)) return "Yesterday";
    
    // If this year, show "2 Aug"
    if (date.getFullYear() === now.getFullYear()) return format(date, "d MMM");
    
    return format(date, "d MMM, yyyy");
}

export function TransactionRow({ tx, variant = "compact", onViewReceipt }: TransactionRowProps) {
    const masked = useUiStore((s) => s.masked);
    const isCredit = tx.amount > 0;
    const amountClass = isCredit ? "text-green-500" : "text-ink";

    const amountStr = masked ? "••••••" : <>{isCredit ? "+" : ""}{formatNaira(tx.amount)}</>;

    if (variant === "table") {
        return (
            <tr className="group border-b border-border bg-white transition-colors hover:bg-gray-50 cursor-pointer" onClick={() => onViewReceipt?.(tx)}>
                <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                        <TxIcon category={tx.category} />
                        <div>
                            <p className="text-sm font-medium text-ink">{tx.label}</p>
                            <p className="text-xs text-muted">{tx.meta}</p>
                        </div>
                    </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                    <Tag variant="neutral">{getCategoryLabel(tx.category)}</Tag>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-body">
                    {tx.date ? formatDateSmart(tx.date) : "-"}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                    <Tag
                        variant={
                            tx.status === "success"
                                ? "ok"
                                : tx.status === "pending"
                                    ? "warn"
                                    : "error"
                        }
                    >
                        {tx.status === "success"
                            ? "Completed"
                            : tx.status === "pending"
                                ? "Pending"
                                : "Failed"}
                    </Tag>
                </td>
                <td className={cn("whitespace-nowrap px-6 py-4 text-right font-sans tabular-nums tracking-tighter text-sm font-semibold", amountClass)}>
                    {amountStr}
                </td>
            </tr>
        );
    }

    // Compact variant (Overview)
    return (
        <div className="group flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-violet-50/50 cursor-pointer" onClick={() => onViewReceipt?.(tx)}>
            <TxIcon category={tx.category} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{tx.label}</p>
                <p className="truncate text-xs font-medium text-muted mt-0.5">
                    {tx.cryptoAmount && tx.cryptoAsset ? `${tx.cryptoAmount} ${tx.cryptoAsset} · Crypto deposit` : tx.meta}
                </p>
            </div>
            <div className="shrink-0 text-right">
                <p className={cn("font-sans tabular-nums tracking-tighter text-sm font-bold", amountClass)}>
                    {amountStr}
                </p>
                <p className={cn(
                    "text-[10px] font-bold mt-0.5",
                    tx.status === "success" ? "text-green-500" : tx.status === "pending" ? "text-amber-500" : "text-red-500"
                )}>
                    {tx.status === "success" ? "Completed" : tx.status === "pending" ? "Pending" : "Failed"}
                </p>
                <p className="text-[10px] font-medium text-muted mt-0.5">{formatDateSmart(tx.date)}</p>
            </div>
        </div>
    );
}
