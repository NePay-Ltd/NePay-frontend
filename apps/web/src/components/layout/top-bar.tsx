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

export function TopBar() {
    const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
    const setCommandOpen = useUiStore((s) => s.setCommandOpen);
    const { user, logout, isMutating } = useAuth();
    const router = useRouter();
    const userName = user?.name ?? "Guest";
    const { data: notificationCount = 0 } = useUnreadNotificationCount();

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/90 px-4 backdrop-blur-md lg:pl-6 lg:pr-8">
            {/* Hamburger — mobile only */}
            <button
                type="button"
                onClick={toggleMobileSidebar}
                className="rounded-sm p-2 text-ink hover:bg-violet-100 lg:hidden"
                aria-label="Open menu"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Search trigger */}
            <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="flex h-10 flex-1 items-center gap-2 rounded-sm border border-border bg-bg px-3 text-sm text-muted transition-colors hover:border-violet-300 sm:max-w-md"
            >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Search...</span>
                <kbd className="hidden rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-semibold sm:inline">
                    &#8984;K
                </kbd>
            </button>

            {/* Right cluster */}
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
                {/* Quick actions */}
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push("/add-money")}
                    className="hidden sm:inline-flex"
                >
                    <Plus className="h-4 w-4" />
                    Add Money
                </Button>
                <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => router.push("/withdraw")}
                    className="hidden sm:inline-flex"
                >
                    <ArrowUpRight className="h-4 w-4" />
                    Withdraw
                </Button>

                {/* Notification bell */}
                <button
                    type="button"
                    onClick={() => router.push("/notifications")}
                    className="relative rounded-full p-2 text-ink hover:bg-violet-100"
                    aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
                >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 ? (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">
                            {notificationCount > 9 ? "9+" : notificationCount}
                        </span>
                    ) : null}
                </button>

                {/* Avatar menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
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