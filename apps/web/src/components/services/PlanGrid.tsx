"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { IconCheck as Check } from "@/components/icons";;
import { formatNaira } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export interface Plan {
    id: string;
    name: string; // e.g. "N100 100MB - 24 hrs"
    validity?: string; // Optional override
    price: number;
    recommended?: boolean;
}

interface PlanGridProps {
    plans: Plan[];
    selectedId: string;
    onChange: (id: string) => void;
    isLoading?: boolean;
}

function parsePlanInfo(name: string) {
    // Extract format: "N100 100MB - 24 hrs"
    // Handle optional "N100" at the start
    const match = name.match(/(?:N\d+\s+)?([0-9.]+[MG]B)\s*-\s*(.*)/i);
    if (match) {
        return { dataAmount: match[1]!, validity: match[2] || '' };
    }
    const parts = name.split('-');
    if (parts.length > 1) {
        // Strip out "N100 " from the first part if it exists
        const cleanData = parts[0]!.replace(/N\d+\s+/, '').trim();
        return { dataAmount: cleanData, validity: parts[1]!.trim() };
    }
    return { dataAmount: name.replace(/N\d+\s+/, '').trim(), validity: '' };
}

function getPlanCategory(validity: string) {
    const v = validity.toLowerCase();
    if (!v) return 'Other';
    if (v.includes('hr') || v.includes('1 day') || v.includes('2 day') || v.includes('3 day')) return 'Daily';
    if (v.includes('7 day') || v.includes('14 day') || v.includes('week')) return 'Weekly';
    if (v.includes('30 day') || v.includes('month')) return 'Monthly';
    return 'Other';
}

export function PlanGrid({ plans, selectedId, onChange, isLoading }: PlanGridProps) {
    const [activeTab, setActiveTab] = React.useState("All");

    const parsedPlans = React.useMemo(() => {
        return plans.map(p => {
            const parsed = parsePlanInfo(p.name);
            const validity = p.validity || parsed.validity;
            return {
                ...p,
                parsedData: parsed.dataAmount,
                parsedValidity: validity,
                category: getPlanCategory(validity || '')
            };
        });
    }, [plans]);

    const filteredPlans = React.useMemo(() => {
        if (activeTab === "All") return parsedPlans;
        return parsedPlans.filter(p => p.category === activeTab);
    }, [parsedPlans, activeTab]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[100px] rounded-2xl border border-border bg-gray-50 animate-pulse" />
                ))}
            </div>
        );
    }

    if (plans.length === 0) return null;

    // Check which tabs actually have plans
    const hasDaily = parsedPlans.some(p => p.category === 'Daily');
    const hasWeekly = parsedPlans.some(p => p.category === 'Weekly');
    const hasMonthly = parsedPlans.some(p => p.category === 'Monthly');
    const hasOther = parsedPlans.some(p => p.category === 'Other');

    return (
        <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h4 className="text-sm font-bold text-ink">Data Bundles</h4>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="flex w-full overflow-x-auto no-scrollbar sm:grid sm:grid-flow-col sm:auto-cols-fr bg-gray-100 dark:bg-[#1C1C1E] rounded-xl p-1 h-10 shrink-0">
                        <TabsTrigger value="All" className="shrink-0 rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-ink data-[state=active]:shadow-sm">All</TabsTrigger>
                        {hasDaily && <TabsTrigger value="Daily" className="shrink-0 rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-ink data-[state=active]:shadow-sm">Daily</TabsTrigger>}
                        {hasWeekly && <TabsTrigger value="Weekly" className="shrink-0 rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-ink data-[state=active]:shadow-sm">Weekly</TabsTrigger>}
                        {hasMonthly && <TabsTrigger value="Monthly" className="shrink-0 rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-ink data-[state=active]:shadow-sm">Monthly</TabsTrigger>}
                        {hasOther && <TabsTrigger value="Other" className="shrink-0 rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-ink data-[state=active]:shadow-sm">Other</TabsTrigger>}
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {filteredPlans.map((plan) => {
                    const isSelected = selectedId === plan.id;

                    return (
                        <motion.button
                            key={plan.id}
                            type="button"
                            onClick={() => onChange(plan.id)}
                            whileTap={{ scale: 0.96 }}
                            className={`relative flex flex-col items-start justify-between text-left p-3 min-h-[85px] w-full rounded-2xl border-2 transition-all ${
                                isSelected
                                    ? "border-violet-600 bg-violet-50/50 dark:bg-violet-900/20 shadow-sm"
                                    : "border-border bg-white dark:bg-white/5 hover:border-violet-200 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10"
                            }`}
                        >
                            {plan.recommended && (
                                <span className="absolute -top-3 left-3 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                                    Best Value
                                </span>
                            )}
                            
                            {isSelected && (
                                <div className="absolute right-2 top-2 h-4 w-4 bg-violet-600 dark:bg-violet-500 rounded-full flex items-center justify-center shadow-sm">
                                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                </div>
                            )}

                            <div>
                                <span className={`text-base sm:text-lg font-black tracking-tight w-full break-words ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-ink'}`}>
                                    {plan.parsedData}
                                </span>
                                {plan.parsedValidity && (
                                    <p className="text-[11px] font-medium text-muted mt-0.5 line-clamp-1">
                                        {plan.parsedValidity}
                                    </p>
                                )}
                            </div>
                            
                            <div className={`mt-3 text-[13px] font-bold ${isSelected ? 'text-violet-700 dark:text-violet-400' : 'text-ink/80'}`}>
                                {formatNaira(plan.price)}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {filteredPlans.length === 0 && (
                <div className="py-10 text-center">
                    <p className="text-sm text-muted">No {activeTab.toLowerCase()} plans available.</p>
                </div>
            )}
        </div>
    );
}
