"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {/*
              nonce: next-themes renders its own pre-hydration inline
              <script> (sets the theme class before React mounts, to avoid a
              flash of the wrong theme) — without this prop that script has
              no nonce and middleware.ts's CSP blocks it outright. Threaded
              down from the root layout's Server Component, the only place
              that can read the per-request nonce header() sees.
            */}
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="nepay-theme" disableTransitionOnChange nonce={nonce}>
                <AuthProvider>
                    {children}
                    <Toaster position="top-right" richColors closeButton />
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}