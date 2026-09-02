"use client";

import * as React from "react";
import { IconPlane as Plane } from "@/components/icons";;
import { ComingSoon } from "@/components/shared/coming-soon";
import { useWaitlistStatus, useJoinWaitlist } from "@/lib/queries/card";

export default function FlightsPage() {
    const { data: isWaitlisted } = useWaitlistStatus();
    const { mutate: joinWaitlist, isPending: isWaitlisting } = useJoinWaitlist();

    const FlightIllustration = (
        <div className="relative w-full h-32 flex items-center justify-center group mb-6">
            {/* Dotted flight path */}
            <svg className="absolute w-[80%] h-full top-0 left-[10%] text-violet-400/50 dark:text-violet-500/30 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path
                    d="M 0 15 Q 25 -5 50 15 T 100 15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                    style={{ strokeLinecap: "round" }}
                />
            </svg>
            
            {/* Plane element */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-white dark:bg-gray-900 shadow-xl shadow-violet-500/20 border-4 border-violet-50 dark:border-white/5 z-10 transition-transform duration-700 ease-in-out group-hover:translate-x-12 group-hover:-translate-y-4">
                <Plane className="w-10 h-10 sm:w-12 sm:h-12 text-violet-600 dark:text-violet-400 rotate-45" />
            </div>
        </div>
    );

    return (
        <ComingSoon 
            title="Flight Booking"
            description="We are building the ultimate flight booking experience. Global travel at your fingertips, directly funded from your NePay balance."
            icon={Plane}
            timeframe="Q4 2026"
            isWaitlisted={!!isWaitlisted}
            isWaitlisting={isWaitlisting}
            onJoinWaitlist={() => joinWaitlist()}
            glowColorHex="rgba(124, 58, 237, 0.15)"
            illustration={FlightIllustration}
        />
    );
}
