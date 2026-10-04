"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconCopy as Copy, IconCheck as Check } from "@/components/icons";

/** VTpass sometimes prefixes the token ("Token : 2636..."). Copy only the redeemable part. */
export function tokenForCopy(token: string): string {
    return token.replace(/^\s*token\s*:?\s*/i, "").trim();
}

export function CopyTokenButton({ token, className = "" }: { token: string; className?: string }) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(tokenForCopy(token));
            setCopied(true);
            toast.success("Token copied");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy — please select and copy the token manually.");
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-gray-100 dark:hover:bg-white/5 ${className}`}
            aria-label="Copy token"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
            {copied ? "Copied" : "Copy token"}
        </button>
    );
}
