"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "@/lib/cn";

import { BOTTOM_NAV } from "@/lib/navigation";

export function BottomNav() {

    const pathname = usePathname();
    const navRef = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        if (!navRef.current) {
            document.documentElement.style.removeProperty('--bottom-nav-height');
            return;
        }
        const observer = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const height = entries[0]?.borderBoxSize?.[0]?.blockSize ?? entries[0]?.contentRect.height ?? 0;
            document.documentElement.style.setProperty('--bottom-nav-height', `${height}px`);
        });
        observer.observe(navRef.current);
        return () => {
            observer.disconnect();
            document.documentElement.style.removeProperty('--bottom-nav-height');
        };
    }, [pathname]); // re-run if it remounts or changes


    // Hide the bottom navigation on service pages to allow the StickyPayBar to take over the screen
    if (pathname.includes("/services/")) {
        return null;
    }

    return (
        <nav
            ref={navRef}
            className="fixed inset-x-4 z-50 flex items-center justify-between rounded-[32px] border border-border/50 bg-white/80 p-1.5 backdrop-blur-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] lg:hidden"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
        >
            {BOTTOM_NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);

                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={cn(
                            "relative flex-1 flex flex-col items-center justify-center gap-1 py-2 z-10 transition-colors duration-200",
                            active ? "text-violet-500 font-medium" : "text-zinc-500 hover:text-zinc-400"
                        )}
                    >
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

                        <span className="text-[10px] tracking-tight">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}