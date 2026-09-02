"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/shared/button";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { ApiResponse } from "@/lib/types/api";

export interface AppShellProps {
    children: React.ReactNode;
}

function isProtectedPinRoute(pathname: string) {
    const moneyRoutes = [
        "/withdraw",
        "/services/airtime",
        "/services/data",
        "/services/electricity",
        "/services/education",
        "/services/tv",
        "/gift-cards",
    ];

    return moneyRoutes.some((route) => pathname === route || pathname.startsWith(route));
}

function TransactionPinSetupGate() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading } = useAuth();
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        if (isLoading || !user) return;

        // Check if we just set the PIN - if so, don't show the dialog
        const pinJustSet = localStorage.getItem('pinJustSet') === 'true';
        if (pinJustSet) {
            localStorage.removeItem('pinJustSet');
            setOpen(false);
            return;
        }

        const ignoredRoutes = ["/security", "/security/change-pin", "/login", "/register"];
        if (ignoredRoutes.some((route) => pathname === route || pathname.startsWith(route))) {
            setOpen(false);
            return;
        }

        if (!isProtectedPinRoute(pathname)) {
            setOpen(false);
            return;
        }

        let cancelled = false;

        const checkPinSetup = async () => {
            try {
                const res = await apiClient.get<ApiResponse<{ hasTransactionPin?: boolean; pinSet?: boolean }>>("/security/pin-status");
                const hasPin = res.data.data?.hasTransactionPin ?? res.data.data?.pinSet ?? false;

                if (!cancelled) {
                    setOpen(!hasPin);
                }
            } catch (error: any) {
                const status = error?.response?.status;
                if (status === 409 && !cancelled) {
                    setOpen(true);
                }
            }
        };

        checkPinSetup();

        return () => {
            cancelled = true;
        };
    }, [isLoading, pathname, user]);

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
            <DialogContent className="sm:max-w-md bg-[#10151f] border border-white/10 text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white">Set your transaction PIN</DialogTitle>
                    <DialogDescription className="text-sm text-slate-300">
                        You need to create a 4-digit payment PIN before you can withdraw or make wallet payments.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm text-violet-100">
                        This keeps your funds protected and is required for all payment actions.
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row-reverse">
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => {
                                setOpen(false);
                                router.push("/security/change-pin?mode=setup");
                            }}
                        >
                            Set PIN now
                        </Button>
                        <Button
                            variant="ghost"
                            fullWidth
                            onClick={() => setOpen(false)}
                            className="border border-white/10 bg-transparent text-white hover:bg-white/5"
                        >
                            Later
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <React.Fragment>
            <Sidebar />
            <MobileSidebar />
            <TransactionPinSetupGate />

            <div className="flex min-h-screen flex-col lg:pl-64">
                <TopBar />
                {/* 
                  Mobile: px-4 horizontal padding, generous bottom padding to clear the floating nav + safe area, pt-5 top breathing room.
                  Desktop: px-8 generous padding, pb-8 normal.
                */}
                <main 
                    className="flex-1 px-4 pt-5 lg:px-8 lg:pb-8 lg:pt-8"
                    style={{ paddingBottom: "calc(var(--bottom-nav-height, 0px) + env(safe-area-inset-bottom, 0px) + 32px)" }}
                >
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>

            <BottomNav />
            <CommandPalette />
        </React.Fragment>
    );
}
