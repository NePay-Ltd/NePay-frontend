"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { IconCheck as Check } from "@/components/icons";;
import { formatNaira } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLAN_BUCKETS, parsePlanLabel, planBucket, type PlanBucket } from "@/lib/plan-label";

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

export function PlanGrid({ plans, selectedId, onChange, isLoading }: PlanGridProps) {
    const [activeTab, setActiveTab] = React.useState("All");

    const parsedPlans = React.useMemo(() => {
        return plans.map((p) => {
            const label = parsePlanLabel(p.name);
            return {
                ...p,
                parsedData: label.title,
                parsedValidity: p.validity || label.validity,
                note: label.note,
                category: planBucket(p.name, p.id) as PlanBucket,
            };
        });
    }, [plans]);

    // Only offer a tab that has plans — and no tab bar at all when everything lands in one group
    // (e.g. TV bouquets carry no validity text), since a lone "Other" tab is just noise.
    const tabsWithPlans = React.useMemo(
        () => PLAN_BUCKETS.filter((bucket) => parsedPlans.some((p) => p.category === bucket)),
        [parsedPlans],
    );

    const filteredPlans = React.useMemo(() => {
        if (activeTab === "All") return parsedPlans;
        return parsedPlans.filter((p) => p.category === activeTab);
    }, [parsedPlans, activeTab]);

    // A tab can disappear when the network (and so the plan list) changes — never stay on one that no longer exists.
    React.useEffect(() => {
        if (activeTab !== "All" && !tabsWithPlans.includes(activeTab as PlanBucket)) setActiveTab("All");
    }, [activeTab, tabsWithPlans]);

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

    return (
        <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h4 className="text-sm font-bold text-ink">Data Bundles</h4>
                {tabsWithPlans.length > 1 && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                        <TabsList className="flex w-full overflow-x-auto no-scrollbar sm:grid sm:grid-flow-col sm:auto-cols-fr bg-gray-100 dark:bg-[#1C1C1E] rounded-xl p-1 h-10 shrink-0">
                            {["All", ...tabsWithPlans].map((tab) => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab}
                                    className="shrink-0 rounded-lg text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-ink data-[state=active]:shadow-sm"
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {filteredPlans.map((plan, index) => {
                    const isSelected = selectedId === plan.id;

                    return (
                        <motion.button
                            key={`${plan.id}-${index}`}
                            type="button"
                            title={plan.name}
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
                                {(plan.parsedValidity || plan.note) && (
                                    <p className="text-[11px] font-medium text-muted mt-0.5 line-clamp-2">
                                        {[plan.parsedValidity, plan.note].filter(Boolean).join(" · ")}
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
