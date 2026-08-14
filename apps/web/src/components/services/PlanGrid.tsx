"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { formatNaira } from "@/lib/format";

export interface Plan {
    id: string;
    name: string; // e.g. "10GB" or "DSTV Premium"
    validity?: string; // e.g. "30 Days"
    price: number;
    recommended?: boolean;
}

interface PlanGridProps {
    plans: Plan[];
    selectedId: string;
    onChange: (id: string) => void;
    isLoading?: boolean;
}

export function PlanGrid({ plans, selectedId, onChange, isLoading }: PlanGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[120px] rounded-2xl border border-border bg-gray-50 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="pt-2">
            <h4 className="text-xs font-bold text-muted mb-3 px-1 uppercase tracking-wider">Select a Plan</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {plans.map((plan) => {
                    const isSelected = selectedId === plan.id;

                    return (
                        <motion.button
                            key={plan.id}
                            type="button"
                            onClick={() => onChange(plan.id)}
                            whileTap={{ scale: 0.96 }}
                            className={`relative flex flex-col items-start text-left p-4 min-h-[120px] w-full rounded-2xl border-2 transition-all ${
                                isSelected
                                    ? "border-violet-600 bg-violet-50 shadow-md shadow-violet-500/10"
                                    : "border-border bg-white hover:border-violet-200 hover:bg-gray-50"
                            }`}
                        >
                            {plan.recommended && (
                                <span className="absolute -top-3 left-4 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                                    Best Value
                                </span>
                            )}
                            
                            {/* Checkmark for selected state */}
                            {isSelected && (
                                <div className="absolute right-3 top-3 h-5 w-5 bg-violet-600 rounded-full flex items-center justify-center shadow-sm">
                                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                </div>
                            )}

                            <span className={`text-xl sm:text-2xl font-black tracking-tight mt-1 w-full break-words ${isSelected ? 'text-violet-900' : 'text-ink'}`}>
                                {plan.name}
                            </span>
                            {plan.validity && (
                                <span className="text-xs font-medium text-muted mt-0.5">
                                    {plan.validity}
                                </span>
                            )}
                            <div className="mt-4 text-sm sm:text-base font-bold text-ink">
                                {formatNaira(plan.price)}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
