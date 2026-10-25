"use client";

import * as React from "react";

import { buildReceiptMarkup } from "@/lib/receipt-markup";
import { getReceiptRows, type ReceiptData } from "@/lib/receipt-utils";

/**
 * The on-screen receipt. It renders the SAME markup the HTML / PNG / PDF downloads
 * are built from (lib/receipt-markup.ts), so what a customer reads here is exactly
 * what they share — no second layout to drift out of step.
 *
 * Every value inside the markup is HTML-escaped by the generator, which is what makes
 * injecting it safe.
 */
export function ReceiptCard({ receipt }: { receipt: ReceiptData }) {
    const { css, html } = React.useMemo(
        () =>
            buildReceiptMarkup(
                {
                    id: receipt.id,
                    amount: receipt.amount,
                    currency: receipt.currency,
                    status: receipt.status,
                    date: receipt.date,
                    rows: getReceiptRows(receipt),
                },
                "/logo.png",
            ),
        [receipt],
    );

    return <div dangerouslySetInnerHTML={{ __html: `<style>${css}</style>${html}` }} />;
}
