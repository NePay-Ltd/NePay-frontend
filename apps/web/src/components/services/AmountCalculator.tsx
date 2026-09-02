"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { formatNaira } from "@/lib/format";

interface AmountCalculatorProps {
    amount: number;
    onChange: (val: number) => void;
    presets: number[];
}

export function AmountCalculator({ amount, onChange, presets }: AmountCalculatorProps) {
    // We'll use a local string state so users can type freely, 
    // and sync it with the parent number state.
    const [localVal, setLocalVal] = React.useState(amount ? amount.toString() : "");

    // Sync from parent if preset is clicked externally
    React.useEffect(() => {
        if (amount === 0 && localVal === "") return;
        setLocalVal(amount ? amount.toString() : "");
    }, [amount]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Only allow numbers
        if (!/^\d*$/.test(val)) return;
        
        setLocalVal(val);
        const parsed = parseInt(val, 10);
        onChange(isNaN(parsed) ? 0 : parsed);
    };

    const handlePreset = (preset: number) => {
        setLocalVal(preset.toString());
        onChange(preset);
    };

    return (
        <div className="pt-2">
            <h4 className="text-sm font-bold text-ink mb-3 px-1">Top up</h4>
            <div className="grid grid-cols-3 gap-3">
                {presets.map((preset) => {
                    const isSelected = amount === preset;
                    return (
                        <motion.button
                            key={preset}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handlePreset(preset)}
                            className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 min-h-[72px] transition-all ${
                                isSelected
                                    ? "border-violet-600 bg-violet-50/50 dark:bg-violet-900/20 shadow-sm"
                                    : "border-border bg-white dark:bg-white/5 hover:border-violet-200 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10"
                            }`}
                        >
                            <span className={`text-[15px] sm:text-[17px] font-black tabular-nums tracking-tight ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-ink'}`}>
                                {formatNaira(preset)}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <div className="relative flex items-center h-[56px] w-full rounded-2xl border-2 border-border bg-white dark:bg-white/5 focus-within:border-violet-600 transition-colors overflow-hidden px-5 mt-6">
                <span className="text-lg font-black text-ink mr-1">₦</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={localVal}
                    onChange={handleChange}
                    placeholder="50 - 500,000"
                    className="flex-1 h-full bg-transparent text-lg font-bold tabular-nums tracking-wide outline-none placeholder:font-medium placeholder:text-muted"
                />
            </div>
        </div>
    );
}
