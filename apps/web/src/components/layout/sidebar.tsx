"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";
import { useUiStore } from "@/lib/stores/ui-store";
import { SIDEBAR_NAV, type NavItem } from "@/lib/navigation";

function Logo() {
    return (
        <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient">
                <span className="text-lg font-bold text-white">N</span>
            </div>
            <span className="text-lg font-bold text-white">NePay</span>
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
                "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-violet-950",
                active
                    ? "bg-violet-100 text-violet-700"
                    : "text-violet-100 hover:bg-violet-800/60 hover:text-white",
            )}
        >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {item.badge}
                </span>
            ) : null}
        </Link>
    );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    const activeNav = useUiStore((s) => s.activeNav);
    const setActiveNav = useUiStore((s) => s.setActiveNav);

    return (
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
            {SIDEBAR_NAV.map((item) => (
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
        </nav>
    );
}

export function Sidebar() {
    return (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-violet-950 lg:flex">
            <div className="flex h-16 items-center border-b border-violet-800/50">
                <Logo />
            </div>
            <SidebarNav />
            <div className="border-t border-violet-800/50 p-4">
                <p className="text-xs text-violet-300">
                    &copy; {new Date().getFullYear()} NePay Technologies Ltd.
                </p>
            </div>
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
                    "absolute inset-y-0 left-0 flex w-72 flex-col bg-violet-950 shadow-lg transition-transform duration-200",
                    open ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex h-16 items-center justify-between border-b border-violet-800/50">
                    <Logo />
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="mr-2 rounded-sm p-2 text-violet-100 hover:bg-violet-800/60"
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <SidebarNav onNavigate={() => setOpen(false)} />
            </aside>
        </div>
    );
}
