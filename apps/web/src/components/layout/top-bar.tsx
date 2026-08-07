"use client";

import * as React from "react";
import {
    Bell,
    Menu,
    Plus,
    Search,
    ArrowUpRight,
    User as UserIcon,
    ShieldCheck,
    LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";
import { useUiStore } from "@/lib/stores/ui-store";
import { useAuth } from "@/lib/auth-context";
import { useUnreadNotificationCount } from "@/lib/queries/notifications";
import { Button } from "@/components/shared/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return "U";
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (first + last).toUpperCase();
}

function Logo() {
    return (
        <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-gradient">
                <span className="text-sm font-extrabold text-white">N</span>
            </div>
            <span className="text-base font-extrabold text-ink tracking-tight">NePay</span>
        </div>
    );
}

export function TopBar() {
    const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
    const setCommandOpen = useUiStore((s) => s.setCommandOpen);
    const { user, logout, isMutating } = useAuth();
    const router = useRouter();
    const userName = user?.name ?? "Guest";
    const { data: notificationCount = 0 } = useUnreadNotificationCount();

    return (
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur-md lg:h-16 lg:pl-6 lg:pr-8">

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
            {/* Search trigger — full on desktop, icon-only on mobile */}
            <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="group hidden h-10 flex-1 items-center gap-2 rounded-xl border border-border/60 bg-bg px-3 text-sm font-medium text-muted transition-all hover:bg-white hover:border-violet-300 sm:max-w-md shadow-sm hover:shadow lg:flex"
            >
                <Search className="h-4 w-4 text-muted group-hover:text-violet-500 transition-colors" />
                <span className="flex-1 text-left">Search anything...</span>
                <kbd className="hidden rounded bg-white px-2 py-0.5 text-[10px] font-bold text-ink sm:inline shadow-sm border border-border/50">
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
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push("/add-money")}
                    className="hidden lg:inline-flex font-bold shadow hover:shadow-md"
                >
                    <Plus className="h-4 w-4" />
                    Add Money
                </Button>
                <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => router.push("/withdraw")}
                    className="hidden lg:inline-flex font-bold hover:bg-violet-50"
                >
                    <ArrowUpRight className="h-4 w-4" />
                    Withdraw
                </Button>

                <div className="h-6 w-px bg-border/50 hidden lg:block" />

                {/* Notification bell */}
                <button
                    type="button"
                    onClick={() => router.push("/notifications")}
                    className="relative rounded-xl p-2 text-muted hover:bg-violet-50 hover:text-ink transition-all active:scale-95"
                    aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
                >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 ? (
                        <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
                    ) : null}
                </button>

                {/* Avatar menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 lg:h-9 lg:w-9 lg:text-sm"
                            aria-label="User menu"
                        >
                            {getInitials(userName)}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>{userName}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/profile")}>
                            <UserIcon className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/security")}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Security
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => void logout()}
                            disabled={isMutating}
                            className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            {isMutating ? "Signing out…" : "Logout"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}