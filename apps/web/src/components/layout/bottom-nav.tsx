"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { useUiStore } from "@/lib/stores/ui-store";
import { BOTTOM_NAV } from "@/lib/navigation";

/**
 * Bottom navigation bar — visible < lg (below 1024px).
 * 5 tabs: Home, Wallet, Services, Activity, Profile.
 * Active tab gets a pill indicator above the icon with a smooth scale animation.
 */
export function BottomNav() {
    const activeNav = useUiStore((s) => s.activeNav);
    const setActiveNav = useUiStore((s) => s.setActiveNav);

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-around border-t border-border bg-white lg:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            {BOTTOM_NAV.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.key;

                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setActiveNav(item.key)}
                        className={cn(
                            "group relative flex flex-1 flex-col items-center gap-1 pb-2 pt-3 transition-colors",
                            active ? "text-violet-700" : "text-muted",
                        )}
                    >
                        {/* Active pill indicator */}
                        <span
                            className={cn(
                                "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-violet-600 transition-all duration-300",
                                active ? "w-6 opacity-100" : "w-0 opacity-0",
                            )}
                        />

                        {/* Icon with scale pop on active */}
                        <span className="relative">
                            <Icon
                                className={cn(
                                    "h-5 w-5 transition-all duration-200",
                                    active ? "scale-110" : "scale-100 group-active:scale-90",
                                )}
                                aria-hidden="true"
                            />
                            {item.badge ? (
                                <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                                    {item.badge}
                                </span>
                            ) : null}
                        </span>

                        {/* Label */}
                        <span
                            className={cn(
                                "text-[10px] font-semibold tracking-tight transition-all",
                                active ? "text-violet-700" : "text-muted",
                            )}
                        >
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}