import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
    title: "NePay — Sign In",
};

/**
 * Auth layout — Elegant split-screen design.
 * Left panel: Clean, light-themed form area.
 * Right panel: Vibrant full-bleed authentic lifestyle image.
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-white">
            
            {/* ── Left form panel ────────────────────────────────────── */}
            {/* Full-screen on mobile, fixed-width column on desktop */}
            <div className="flex w-full flex-col lg:w-[540px] lg:flex-shrink-0 bg-white border-r border-border lg:shadow-2xl z-20 relative">

                {/* Logo Area — compact on mobile, generous on desktop */}
                <div className="flex items-center gap-2.5 px-6 pt-10 pb-2 lg:gap-3 lg:px-16 lg:pt-16 lg:pb-0">
                    <img src="/logo.png" alt="NePay Logo" className="h-8 w-8 lg:h-10 lg:w-10 object-contain drop-shadow-md" />
                    <span className="text-2xl font-black tracking-tighter text-ink uppercase lg:text-3xl">
                        NePay
                    </span>
                </div>

                {/* Centered form area */}
                <div className="flex flex-1 flex-col justify-center px-6 py-6 lg:px-16 lg:py-8">
                    {children}
                </div>

                <p className="pb-10 text-center text-xs text-muted font-medium lg:pb-8">
                    &copy; {new Date().getFullYear()} NePay Technology Ltd. All rights reserved.
                </p>
            </div>

            {/* ── Right image panel (hidden on mobile) ─────────────────── */}
            <div className="relative hidden flex-1 lg:block bg-zinc-900 overflow-hidden">
                {/* The vibrant authentic lifestyle image */}
                <Image
                    src="/images/login-banner.png"
                    alt="NePay Lifestyle"
                    fill
                    className="object-cover object-center scale-105"
                    priority
                />
                
                {/* Subtle Gradient Overlay to ensure text readability without ruining image vibrancy */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent w-1/2" />

                {/* Text Content */}
                <div className="absolute bottom-20 left-16 max-w-xl z-10">
                    <h2 className="text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight drop-shadow-xl">
                        Spend.<br />
                        Save.<br />
                        Grow.
                    </h2>
                    <p className="mt-6 text-xl text-white/90 font-medium max-w-lg drop-shadow-lg leading-relaxed">
                        Banking built for everyday life. Earn daily cashback, enjoy massive discounts, and get 24/7 priority support.
                    </p>
                </div>
            </div>

        </div>
    );
}
