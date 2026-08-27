import * as React from "react";
import { cn } from "@/lib/cn";

interface NePayCardVisualProps {
    className?: string;
    cardholderName?: string;
    last4?: string;
    expiry?: string;
}

export function NePayCardVisual({
    className,
    cardholderName = "YOUR NAME",
    last4 = "••••",
    expiry = "MM/YY"
}: NePayCardVisualProps) {
    return (
        <div 
            className={cn(
                "relative h-[200px] w-full max-w-[340px] shrink-0 overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white shadow-xl ring-1 ring-white/10",
                className
            )}
            style={{
                // Enhanced gradient override just for the card to give it a rich metallic pop
                backgroundImage: "linear-gradient(135deg, #4C00B4 0%, #7C3AED 50%, #6C2FF2 100%)"
            }}
        >
            {/* Glossy shine overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-60 mix-blend-overlay" />

            {/* Company Name */}
            <div className="absolute top-6 left-6 flex items-center gap-2 drop-shadow-sm">
                <span className="text-xl font-extrabold tracking-tight text-white">NePay</span>
            </div>

            {/* Card Number & Details */}
            <div className="absolute bottom-16 left-6 right-6 flex items-end justify-between drop-shadow-sm">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium tracking-widest text-white/80">•••• •••• •••• {last4}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">{cardholderName}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Valid Thru</span>
                    <span className="text-xs font-bold tracking-widest text-white">{expiry}</span>
                </div>
            </div>

            {/* Network Logo (Verve) */}
            <div className="absolute bottom-6 right-6 flex items-center justify-center">
                <div className="text-white font-black italic tracking-tighter text-2xl drop-shadow-md">
                    Verve
                </div>
            </div>
        </div>
    );
}
