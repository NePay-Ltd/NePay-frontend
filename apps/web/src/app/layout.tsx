import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin", "latin-ext"],
    fallback: ["font-sans", "Arial", "Helvetica", "sans-serif"],
    variable: "--font-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: "NePay - Your Money, Simplified",
    description:
        "NePay is a global digital wallet for instant auto-conversion of 300+ crypto coins to fiat, cross-border virtual accounts, and seamless utility bill payments.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
        >
            <body className={`${jakarta.variable} font-sans text-ink bg-bg antialiased selection:bg-violet-200 selection:text-violet-900 min-h-screen flex flex-col overflow-x-hidden`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}