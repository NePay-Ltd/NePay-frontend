"use client";

import * as React from "react";
import { CreditCard, Lock } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";
import { useWaitlistStatus, useJoinWaitlist } from "@/lib/queries/card";

export default function CardPage() {
    const { data: isWaitlisted } = useWaitlistStatus();
    const { mutate: joinWaitlist, isPending: isWaitlisting } = useJoinWaitlist();

    const CardIllustration = (
        <div className="relative w-full h-32 flex items-center justify-center group mb-6">
            {/* Background blurred cards for depth */}
            <div className="absolute w-24 h-16 rounded-lg bg-indigo-500/20 dark:bg-indigo-500/30 blur-md transform -rotate-12 -translate-x-8 translate-y-2 z-0" />
            <div className="absolute w-24 h-16 rounded-lg bg-fuchsia-500/20 dark:bg-fuchsia-500/30 blur-md transform rotate-12 translate-x-8 translate-y-2 z-0" />
            
            {/* Main card element */}
            <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-900 shadow-xl shadow-violet-500/40 border border-white/20 z-10 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-4 group-hover:rotate-6">
                <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-white opacity-90" />
                
                {/* Simulated card chip */}
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-3 sm:w-5 sm:h-4 rounded-[2px] sm:rounded bg-amber-200/80 border border-amber-400/50" />
            </div>
            
            {/* Lock badge */}
            <div className="absolute -bottom-2 sm:-bottom-4 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
        </div>
    );

    return (
        <ComingSoon 
            title="NePay Virtual Card"
            description="Your passport to global payments. Spend anywhere online instantly with zero FX markup on your transactions."
            icon={CreditCard}
            timeframe="Q1 2027"
            isWaitlisted={!!isWaitlisted}
            isWaitlisting={isWaitlisting}
            onJoinWaitlist={() => joinWaitlist()}
            glowColorHex="rgba(79, 70, 229, 0.15)" // Indigo glow
            illustration={CardIllustration}
        />
    );
}
