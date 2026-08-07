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
    cardholderName = "Dubem Egbo",
    last4 = "4782",
    expiry = "12/28",
}: NePayCardVisualProps) {
    return (
        <div 
            className={cn(
                "relative h-[200px] w-[340px] shrink-0 overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white shadow-xl ring-1 ring-white/10",
                className
            )}
            style={{
                // Enhanced gradient override just for the card to give it a rich metallic pop
                backgroundImage: "linear-gradient(135deg, #4C00B4 0%, #7C3AED 50%, #6C2FF2 100%)"
            }}
        >
            {/* Glossy shine overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-60 mix-blend-overlay" />

            {/* EMV Chip */}
            <div className="absolute left-6 top-6 h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 border border-amber-500/30 flex items-center justify-center overflow-hidden opacity-90 shadow-sm">
                <div className="h-full w-full border border-amber-600/20 rounded-md relative opacity-60">
                    <div className="absolute left-0 top-1/2 w-full h-[1px] bg-amber-600/30 -translate-y-1/2" />
                    <div className="absolute left-1/3 top-0 h-full w-[1px] bg-amber-600/30" />
                    <div className="absolute right-1/3 top-0 h-full w-[1px] bg-amber-600/30" />
                </div>
            </div>

            {/* Card Number */}
            <div className="absolute bottom-14 left-6 flex items-center space-x-3 font-mono text-xl tracking-widest text-white/90 drop-shadow-sm">
                <span>••••</span>
                <span>••••</span>
                <span>••••</span>
                <span>{last4}</span>
            </div>

            {/* Cardholder Details */}
            <div className="absolute bottom-6 left-6 flex w-[calc(100%-3rem)] items-center justify-between drop-shadow-sm">
                <div className="flex flex-col uppercase tracking-widest">
                    <span className="text-[9px] text-white/60">Cardholder</span>
                    <span className="text-xs font-semibold">{cardholderName}</span>
                </div>
                <div className="flex flex-col uppercase tracking-widest mr-16">
                    <span className="text-[9px] text-white/60">Valid Thru</span>
                    <span className="text-xs font-semibold">{expiry}</span>
                </div>
            </div>

            {/* Network Logo (VISA) */}
            <div className="absolute bottom-6 right-6 font-bold italic tracking-tighter text-white drop-shadow-md text-2xl">
                VISA
            </div>
        </div>
    );
}
