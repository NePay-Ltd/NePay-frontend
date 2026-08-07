"use client";

import * as React from "react";

import { cn } from "@/lib/cn";
import { useUiStore } from "@/lib/stores/ui-store";
import { BOTTOM_NAV } from "@/lib/navigation";

/**
 * Bottom navigation bar — visible <768px (below md breakpoint).
 * 5 icons: Home, Wallet, Services, Activity, Profile.
 */
export function BottomNav() {
    const activeNav = useUiStore((s) => s.activeNav);
    const setActiveNav = useUiStore((s) => s.setActiveNav);

    return (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
            {BOTTOM_NAV.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.key;

                return (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveNav(item.key)}
                        className={cn(
                            "flex flex-1 flex-col items-center gap-1 py-2 transition-colors",
                            active ? "text-violet-700" : "text-muted",
                        )}
                    >
                        <span className="relative">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                            {item.badge ? (
                                <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                                    {item.badge}
                                </span>
                            ) : null}
                        </span>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}