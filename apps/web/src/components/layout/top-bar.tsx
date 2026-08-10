"use client";

import * as React from "react";
import {
    Bell,
    Menu,
    Plus,
    Search,
    ArrowUpRight,
    HelpCircle,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

import { cn } from "@/lib/cn";
import { useUiStore } from "@/lib/stores/ui-store";
import { useUnreadNotificationCount } from "@/lib/queries/notifications";
import { Button } from "@/components/shared/button";

function Logo() {
    return (
        <div className="flex items-center gap-2">
            <img src="/logo.png" alt="NePay Logo" className="h-6 w-6 object-contain drop-shadow-sm" />
            <span className="text-base font-extrabold text-ink tracking-tight">NePay</span>
        </div>
    );
}

function usePageHeaders() {
    const pathname = usePathname();
    const today = format(new Date(), "EEEE, d MMM");
    
    if (pathname.startsWith("/overview")) {
        return { title: "Overview", subtitle: `${today} · Everything at a glance` };
    }
    if (pathname.startsWith("/wallet")) {
        return { title: "Wallet", subtitle: "Balances, assets and limits" };
    }
    if (pathname.startsWith("/flights")) {
        return { title: "Flights", subtitle: "Search and pay from your balance" };
    }
    if (pathname.startsWith("/transactions")) {
        return { title: "Transactions", subtitle: "All your activity in one place" };
    }
    if (pathname.startsWith("/services")) {
        return { title: "Services", subtitle: "Pay bills and buy airtime instantly" };
    }
    if (pathname.startsWith("/gift-cards")) {
        return { title: "Gift Cards", subtitle: "Trade gift cards at the best rates" };
    }
    
    // Default fallback
    const title = pathname.split('/')[1] || "NePay";
    return { 
        title: title.charAt(0).toUpperCase() + title.slice(1).replace("-", " "), 
        subtitle: "Manage your account" 
    };
}

export function TopBar() {
    const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
    const setCommandOpen = useUiStore((s) => s.setCommandOpen);
    const router = useRouter();
    const { data: notificationCount = 0 } = useUnreadNotificationCount();
    const { title, subtitle } = usePageHeaders();

    return (
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur-md lg:pl-10 lg:pr-8">

            {/* ── Mobile layout ──────────────────────────────────────────── */}
            {/* Hamburger — mobile only */}
            <button
                type="button"
                onClick={toggleMobileSidebar}
                className="rounded-xl p-2 text-ink hover:bg-violet-50 transition-colors lg:hidden"
                aria-label="Open menu"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Logo — center on mobile, hidden on desktop (sidebar has it) */}
            <div className="absolute left-1/2 -translate-x-1/2 lg:hidden">
                <Logo />
            </div>

            {/* ── Desktop layout ─────────────────────────────────────────── */}
            {/* Page Header — desktop only */}
            <div className="hidden lg:flex flex-col mr-8 min-w-[200px]">
                <h1 className="text-xl font-extrabold tracking-tight text-ink">{title}</h1>
                <p className="text-[13px] font-medium text-muted tracking-tight">{subtitle}</p>
            </div>

            {/* Search trigger */}
            <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="group hidden h-10 flex-1 items-center gap-2 rounded-xl border border-border bg-bg px-3 text-sm font-medium text-muted/80 transition-all hover:bg-white hover:border-violet-300 max-w-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] lg:flex"
            >
                <Search className="h-4 w-4 text-muted group-hover:text-violet-500 transition-colors" />
                <span className="flex-1 text-left">Search transactions, services, banks...</span>
                <kbd className="hidden rounded bg-white px-2 py-0.5 text-[10px] font-bold text-muted sm:inline shadow-sm border border-border/50">
                    &#8984;K
                </kbd>
            </button>

            {/* ── Right cluster ──────────────────────────────────────────── */}
            <div className="ml-auto flex items-center gap-2 lg:gap-3">
                {/* Search icon — mobile only (opens command palette) */}
                <button
                    type="button"
                    onClick={() => setCommandOpen(true)}
                    className="rounded-xl p-2 text-muted hover:bg-violet-50 hover:text-ink transition-colors lg:hidden"
                    aria-label="Search"
                >
                    <Search className="h-5 w-5" />
                </button>

                {/* Quick actions — desktop only */}
                <div className="hidden lg:flex items-center gap-2 mr-2">
                    <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => router.push("/add-money")}
                        className="font-bold border border-border hover:bg-white shadow-sm hover:shadow text-ink h-9 px-4 rounded-lg"
                    >
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add money
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push("/withdraw")}
                        className="font-bold h-9 px-4 rounded-lg shadow-sm hover:shadow-md"
                    >
                        <ArrowUpRight className="mr-1.5 h-4 w-4" />
                        Withdraw
                    </Button>
                </div>

                {/* Notification bell */}
                <button
                    type="button"
                    onClick={() => router.push("/notifications")}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted hover:bg-violet-50 hover:text-ink hover:border-violet-200 transition-all shadow-sm"
                    aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
                >
                    <Bell className="h-[18px] w-[18px]" />
                    {notificationCount > 0 ? (
                        <span className="absolute right-0 top-0 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
                    ) : null}
                </button>
                
                {/* Theme Toggle */}
                <button
                    type="button"
                    onClick={() => {
                        const isDark = document.documentElement.classList.toggle('dark');
                        if (isDark) {
                            toast.success("Dark mode enabled (Preview)");
                        } else {
                            toast.success("Light mode enabled");
                        }
                    }}
                    className="hidden lg:flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted hover:bg-violet-50 hover:text-ink hover:border-violet-200 transition-all shadow-sm"
                    aria-label="Toggle theme"
                >
                    <svg className="h-[18px] w-[18px] dark:hidden" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                    <svg className="hidden h-[18px] w-[18px] dark:block" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                </button>

                {/* Help */}
                <button
                    type="button"
                    onClick={() => router.push("/support")}
                    className="hidden lg:flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted hover:bg-violet-50 hover:text-ink hover:border-violet-200 transition-all shadow-sm"
                    aria-label="Help and Support"
                >
                    <HelpCircle className="h-[18px] w-[18px]" />
                </button>
            </div>
        </header>
    );
}