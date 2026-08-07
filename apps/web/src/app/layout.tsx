import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "NePay — Your Money, Simplified",
    description:
        "NePay is a Nigerian fintech platform for crypto off-ramp, gift cards, bill payments, flight booking, and group data-buying Pods.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            className={`${inter.variable} ${jetbrainsMono.variable}`}
            suppressHydrationWarning
        >
            <body className="font-sans antialiased">
                <Providers>
                    <AppShell notificationCount={3} userName="Chidi Okafor">
                        {children}
                    </AppShell>
                </Providers>
            </body>
        </html>
    );
}