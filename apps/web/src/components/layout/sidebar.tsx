"use client";

import * as React from "react";
import Link from "next/link";
import { X, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";
import { useUiStore } from "@/lib/stores/ui-store";
import { SIDEBAR_GROUPS, type NavItem } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";

function Logo() {
    return (
        <div className="flex items-center gap-2.5 px-4">
            <img src="/logo.png" alt="NePay Logo" className="h-7 w-7 object-contain drop-shadow-sm" />
            <span className="text-lg font-bold text-white leading-tight">NePay</span>
        </div>
    );
}

function NavLink({
    item,
    active,
    onClick,
}: {
    item: NavItem;
    active: boolean;
    onClick?: () => void;
}) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={cn(
                "group flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-violet-950",
                active
                    ? "bg-violet-600 text-trueWhite font-bold shadow-sm"
                    : "text-violet-100/70 hover:bg-trueWhite/5 hover:text-trueWhite font-medium",
            )}
        >
            <Icon 
                className={cn("mr-3 h-5 w-5 shrink-0 transition-transform duration-200", !active && "group-hover:scale-110", active ? "text-trueWhite" : "text-violet-100/70 group-hover:text-trueWhite")} 
                aria-hidden="true" 
            />
            <span className="flex-1 text-left tracking-tight">{item.label}</span>
            {item.badge ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-trueWhite/20 px-1.5 text-xs font-bold text-trueWhite transition-transform group-hover:scale-110">
                    {item.badge}
                </span>
            ) : item.badgeLabel ? (
                <span className="flex h-5 items-center justify-center rounded-full bg-trueWhite/10 px-2 text-[10px] font-bold uppercase tracking-widest text-trueWhite/80">
                    {item.badgeLabel}
                </span>
            ) : null}
        </Link>
    );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    const activeNav = useUiStore((s) => s.activeNav);
    const setActiveNav = useUiStore((s) => s.setActiveNav);

    return (
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6 scrollbar-thin">
            {SIDEBAR_GROUPS.map((group) => (
                <div key={group.title}>
                    <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-violet-400">
                        {group.title}
                    </h3>
                    <div className="space-y-1">
                        {group.items.map((item) => (
                            <NavLink
                                key={item.key}
                                item={item}
                                active={activeNav === item.key}
                                onClick={() => {
                                    setActiveNav(item.key);
                                    onNavigate?.();
                                }}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {/* Refer & Earn Card */}
            <div className="mt-8 rounded-2xl bg-trueWhite/5 p-4 border border-trueWhite/10">
                <h4 className="text-sm font-bold text-trueWhite">Refer & earn</h4>
                <p className="mt-1 mb-4 text-xs font-medium text-violet-200/80 dark:text-muted leading-relaxed">
                    Invite a friend and earn up to ₦5,000 once they sign up and transact.
                </p>
                <button type="button" className="w-full rounded-xl bg-white dark:bg-gray-100 py-2.5 text-xs font-bold text-ink transition-transform hover:scale-[1.02] active:scale-95 shadow-sm">
                    Copy invite link
                </button>
            </div>
        </nav>
    );
}

function UserProfileCard() {
    const { user, logout, isMutating } = useAuth();
    const router = useRouter();
    
    const displayName = user?.name || "Ugochukwu Nebeani";
    const status = user?.kycTier === "FULL_BVN_NIN" ? "Verified account" : "Verified account"; // Match prototype

    return (
        <div className="mt-2 flex items-center justify-between p-4">
            <button
                onClick={() => router.push("/settings")}
                className="flex items-center gap-3 text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trueWhite/20 rounded-xl"
            >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-200 text-sm font-extrabold text-orange-900">
                    {displayName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-trueWhite">{displayName}</span>
                    <span className="text-[11px] font-medium text-violet-300 dark:text-muted">{status}</span>
                </div>
            </button>
            <button
                onClick={() => logout()}
                disabled={isMutating}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-violet-300 dark:text-muted hover:bg-trueWhite/10 hover:text-trueWhite transition-colors disabled:opacity-50"
            >
                <LogOut className="h-4 w-4" />
            </button>
        </div>
    );
}

export function Sidebar() {
    return (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-violet-950 lg:flex">
            <div className="flex h-[72px] items-center border-b border-white/5 pt-2">
                <Logo />
            </div>
            <SidebarNav />
            <UserProfileCard />
        </aside>
    );
}

export function MobileSidebar() {
    const open = useUiStore((s) => s.mobileSidebarOpen);
    const setOpen = useUiStore((s) => s.setMobileSidebarOpen);

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 lg:hidden",
                open ? "pointer-events-auto" : "pointer-events-none",
            )}
            aria-hidden={!open}
        >
            <div
                className={cn(
                    "absolute inset-0 bg-violet-950/60 backdrop-blur-sm transition-opacity duration-200",
                    open ? "opacity-100" : "opacity-0",
                )}
                onClick={() => setOpen(false)}
            />
            <aside
                className={cn(
                    "absolute inset-y-0 left-0 flex w-72 flex-col bg-violet-950 shadow-2xl transition-transform duration-200",
                    open ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex h-[72px] items-center justify-between border-b border-white/5 pt-2 pr-4">
                    <Logo />
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-lg p-2 text-violet-100 hover:bg-white/10"
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <SidebarNav onNavigate={() => setOpen(false)} />
                <UserProfileCard />
            </aside>
        </div>
    );
}
