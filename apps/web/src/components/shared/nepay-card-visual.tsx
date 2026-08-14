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

            {/* Company Name */}
            <div className="absolute top-6 left-6 flex items-center gap-2 drop-shadow-sm">
                <span className="text-xl font-extrabold tracking-tight text-white">NePay</span>
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
