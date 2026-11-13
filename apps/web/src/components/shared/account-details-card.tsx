"use client";

/**
 * AccountDetailsCard - the customer's own NePay account, as a card worth screenshotting (web twin of the mobile
 * app's AccountDetailsCard): bank, the number grouped for reading, the name, and the two things people do with it -
 * copy the number, or share the details as text. It's the customer's OWN account number, so it is shown in full.
 */
import * as React from "react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

/** "8123456789" -> "812 345 6789": easy to read aloud or type into a bank app. */
export function groupAccountNumber(n: string): string {
    const d = (n ?? "").replace(/\D/g, "");
    return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : n;
}

export function AccountDetailsCard({
    bankName,
    accountNumber,
    accountName,
}: {
    bankName: string;
    accountNumber: string;
    accountName: string;
}) {
    const shareText = `Send money to my NePay account\nBank: ${bankName}\nAccount number: ${accountNumber}\nName: ${accountName}`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(accountNumber);
            toast.success("Account number copied");
        } catch {
            toast.error("Couldn't copy. Select the number and copy it instead.");
        }
    };

    const share = async () => {
        // The phone's share sheet where there is one; otherwise the details go to the clipboard, ready to paste.
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
            try {
                await navigator.share({ text: shareText });
                return;
            } catch (err) {
                if ((err as Error)?.name === "AbortError") return;
            }
        }
        try {
            await navigator.clipboard.writeText(shareText);
            toast.success("Account details copied, ready to paste");
        } catch {
            toast.error("Couldn't copy the details.");
        }
    };

    return (
        <div
            className="relative overflow-hidden rounded-[26px] p-5 sm:p-6 text-white shadow-[0_14px_32px_-12px_rgba(76,0,180,0.55)]"
            style={{ background: "linear-gradient(150deg, #6C2FF2 0%, #3A00A8 60%, #1E0A55 100%)" }}
        >
            <div className="pointer-events-none absolute inset-0 rounded-[26px] border border-white/15" aria-hidden />

            <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-white/80">Your NePay account</p>
                <span className="max-w-[55%] truncate rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">{bankName}</span>
            </div>

            <p className="mt-4 font-mono text-[28px] sm:text-[32px] font-bold tracking-[0.08em] tabular-nums select-all">
                {groupAccountNumber(accountNumber)}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-white/80">{accountName}</p>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button
                    type="button"
                    onClick={copy}
                    className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-[#3A00A8] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#3A00A8]"
                >
                    <Copy className="h-4 w-4" strokeWidth={2} />
                    Copy number
                </button>
                <button
                    type="button"
                    onClick={share}
                    className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/15 text-sm font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    <Share2 className="h-4 w-4" strokeWidth={2} />
                    Share details
                </button>
            </div>
        </div>
    );
}
