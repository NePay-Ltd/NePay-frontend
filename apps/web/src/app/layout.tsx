import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";

import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin", "latin-ext"],
    fallback: ["font-sans", "Arial", "Helvetica", "sans-serif"],
    variable: "--font-sans",
    display: "swap",
});

// Receipt-only faces: the italic accent word and the monospaced references/numbers.
const receiptSerif = Instrument_Serif({
    subsets: ["latin"],
    weight: "400",
    style: "italic",
    variable: "--font-receipt-serif",
    display: "swap",
});

const receiptMono = JetBrains_Mono({
    subsets: ["latin"],
    weight: "500",
    variable: "--font-receipt-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "NePay - Your Money, Simplified",
    description:
        "NePay is a global digital wallet for instant auto-conversion of 300+ crypto coins to fiat, cross-border virtual accounts, and seamless utility bill payments.",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Set by middleware.ts on every request, alongside the matching
    // Content-Security-Policy header — see Providers' own note on why
    // next-themes specifically needs this passed through.
    const nonce = (await headers()).get("x-nonce") ?? undefined;

    return (
        <html
            lang="en"
            suppressHydrationWarning
        >
            <body className={`${jakarta.variable} ${receiptSerif.variable} ${receiptMono.variable} font-sans text-ink bg-bg antialiased selection:bg-violet-200 selection:text-violet-900 min-h-screen flex flex-col overflow-x-hidden`}>
                <Providers nonce={nonce}>{children}</Providers>
            </body>
        </html>
    );
}