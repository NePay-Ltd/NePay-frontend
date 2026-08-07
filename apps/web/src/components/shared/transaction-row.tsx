import * as React from "react";
import { format } from "date-fns";
import { TxIcon, type TxCategory } from "./tx-icon";
import { Tag } from "./tag";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface BaseTransaction {
    id: string;
    label: string;
    meta: string;
    amount: number;
    category: TxCategory;
    status: "success" | "pending" | "failed";
    date?: string; // Optional for Overview, required for Transactions
}

export interface TransactionRowProps {
    tx: BaseTransaction;
    variant?: "table" | "compact";
}

function getCategoryLabel(cat: TxCategory) {
    switch (cat) {
        case "deposit": return "Deposit";
        case "withdrawal": return "Withdrawal";
        case "payment": return "Payment";
        case "gift-card": return "Gift Card";
        case "flight": return "Flight";
        default: return "Transfer";
    }
}

export function TransactionRow({ tx, variant = "compact" }: TransactionRowProps) {
    const isCredit = tx.amount > 0;
    const amountClass = isCredit ? "text-green-500" : "text-ink";
    const amountStr = `${isCredit ? "+" : ""}${formatNaira(tx.amount)}`;

    if (variant === "table") {
        return (
            <tr className="group border-b border-border bg-white transition-colors hover:bg-gray-50">
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
                    {tx.date ? format(new Date(tx.date), "MMM d, yyyy") : "-"}
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
                <td className={cn("whitespace-nowrap px-6 py-4 text-right font-mono text-sm font-semibold", amountClass)}>
                    {amountStr}
                </td>
            </tr>
        );
    }

    // Compact variant (Overview)
    return (
        <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
            <TxIcon category={tx.category} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{tx.label}</p>
                <p className="truncate text-xs text-muted">{tx.meta}</p>
            </div>
            <div className="shrink-0 text-right">
                <p className={cn("font-mono text-sm font-semibold", amountClass)}>
                    {amountStr}
                </p>
                <Tag
                    variant={
                        tx.status === "success"
                            ? "ok"
                            : tx.status === "pending"
                                ? "warn"
                                : "error"
                    }
                    className="mt-0.5"
                >
                    {tx.status === "success"
                        ? "Success"
                        : tx.status === "pending"
                            ? "Pending"
                            : "Failed"}
                </Tag>
            </div>
        </div>
    );
}
