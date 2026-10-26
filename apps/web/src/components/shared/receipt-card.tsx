"use client";

import * as React from "react";
import { toast } from "sonner";

import { buildReceiptMarkup } from "@/lib/receipt-markup";
import type { ReceiptConfig } from "@/lib/receipt-config";

/**
 * The on-screen receipt: the full picture (fee, total debited, discount). It renders the same
 * markup and layout the HTML / PNG / PDF downloads use (lib/receipt-markup.ts) - but what is
 * downloaded or shared is the shareable version, with only the exact amount that moved.
 *
 * Every value inside the markup is HTML-escaped by the generator, which is what makes
 * injecting it safe. The Copy buttons are plain buttons carrying `data-copy`; one click
 * handler on the wrapper does the copying.
 */
export function ReceiptCard({ receipt }: { receipt: ReceiptConfig }) {
    const { css, html } = React.useMemo(() => buildReceiptMarkup(receipt, "/logo.png", { interactive: true }), [receipt]);

    const onClick = async (e: React.MouseEvent<HTMLDivElement>) => {
        const button = (e.target as HTMLElement).closest<HTMLElement>("[data-copy]");
        if (!button) return;
        try {
            await navigator.clipboard.writeText(button.dataset.copy ?? "");
            toast.success("Copied");
        } catch {
            toast.error("Couldn't copy - select the text and copy it instead");
        }
    };

    return <div onClick={onClick} dangerouslySetInnerHTML={{ __html: `<style>${css}</style>${html}` }} />;
}
