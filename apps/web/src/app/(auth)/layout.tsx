import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "NePay — Sign In",
};

/**
 * Auth layout — full-bleed split-screen design.
 * Left panel: animated brand visual (no sidebar, no top bar).
 * Right panel: form content from page.tsx.
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* ── Left brand panel (hidden on mobile) ─────────────────── */}
            <div className="relative hidden w-[480px] flex-shrink-0 overflow-hidden bg-brand-gradient lg:flex lg:flex-col">
                {/* Decorative blobs */}
                <div
                    aria-hidden="true"
                    className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-violet-800/40 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="absolute bottom-32 right-8 h-40 w-40 rounded-full bg-violet-400/20 blur-2xl"
                />

                {/* Logo */}
                <div className="relative z-10 p-10">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl font-black text-white backdrop-blur-sm">
                            N
                        </span>
                        <span className="text-2xl font-bold tracking-tight text-white">
                            NePay
                        </span>
                    </Link>
                </div>

                {/* Marketing copy */}
                <div className="relative z-10 mt-auto p-10 pb-14">
                    <blockquote className="space-y-4">
                        <p className="text-[1.375rem] font-semibold leading-snug text-white">
                            &ldquo;The smartest way to manage your money,
                            send crypto, and pay bills — all in one place.&rdquo;
                        </p>
                        <footer className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                                CO
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    Chidi Okafor
                                </p>
                                <p className="text-xs text-violet-200">
                                    NePay user since 2024
                                </p>
                            </div>
                        </footer>
                    </blockquote>

                    {/* Stats strip */}
                    <div className="mt-8 flex gap-6 border-t border-white/20 pt-8">
                        {[
                            { label: "Users", value: "120K+" },
                            { label: "Transactions", value: "₦4.2B+" },
                            { label: "Uptime", value: "99.9%" },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <p className="text-lg font-bold text-white">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-violet-200">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right form panel ────────────────────────────────────── */}
            <div className="flex flex-1 flex-col bg-bg">
                {/* Mobile logo (shown < lg) */}
                <div className="flex items-center gap-3 p-6 lg:hidden">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-base font-black text-white">
                        N
                    </span>
                    <span className="text-lg font-bold tracking-tight text-ink">
                        NePay
                    </span>
                </div>

                {/* Centered form area */}
                <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-12">
                    <div className="w-full max-w-md">{children}</div>
                </div>

                <p className="pb-8 text-center text-xs text-muted">
                    © {new Date().getFullYear()} NePay Technology Ltd. All rights reserved.
                </p>
            </div>
        </div>
    );
}
