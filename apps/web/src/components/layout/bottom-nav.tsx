"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "@/lib/cn";
import { useUiStore } from "@/lib/stores/ui-store";
import { BOTTOM_NAV } from "@/lib/navigation";

export function BottomNav() {
    const activeNav = useUiStore((s) => s.activeNav);
    const setActiveNav = useUiStore((s) => s.setActiveNav);
    const pathname = usePathname();

    // Hide the bottom navigation on service pages to allow the StickyPayBar to take over the screen
    if (pathname.includes("/services/")) {
        return null;
    }

    return (
        <nav
            className="fixed inset-x-4 z-50 flex items-center justify-between rounded-[32px] border border-border/50 bg-white/80 p-1.5 backdrop-blur-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] lg:hidden"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
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
                            "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full py-2 px-1 transition-colors z-10",
                            active ? "text-violet-700" : "text-muted hover:text-ink",
                        )}
                    >
                        {active && (
                            <motion.div
                                layoutId="bottom-nav-active-pill"
                                className="absolute inset-0 rounded-full bg-violet-100"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                style={{ zIndex: -1 }}
                            />
                        )}

                        <span className="relative">
                            <Icon
                                className={cn(
                                    "h-5 w-5 transition-transform duration-200",
                                    active ? "scale-105" : "scale-100 group-active:scale-90",
                                )}
                                aria-hidden="true"
                            />
                            {item.badge ? (
                                <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                                    {item.badge}
                                </span>
                            ) : null}
                        </span>

                        <span
                            className={cn(
                                "text-[10px] font-bold tracking-tight transition-all",
                                active ? "text-violet-800" : ""
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