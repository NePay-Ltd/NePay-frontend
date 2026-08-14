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
        <div className="space-y-6 pt-4">
            {/* The Big Number Display */}
            <div className="relative mx-auto flex max-w-xs items-center justify-center border-b-2 border-transparent transition-colors focus-within:border-violet-600">
                <span className="text-4xl sm:text-5xl font-black text-ink">₦</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={localVal}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full bg-transparent text-center font-sans text-5xl sm:text-6xl font-black tabular-nums tracking-tighter text-ink outline-none placeholder:text-muted"
                />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {presets.map((preset) => (
                    <motion.button
                        key={preset}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => handlePreset(preset)}
                        className={`rounded-full px-5 py-2.5 text-[15px] font-bold transition-colors tabular-nums ${
                            amount === preset
                                ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                                : "bg-gray-100 text-ink hover:bg-gray-200"
                        }`}
                    >
                        {formatNaira(preset)}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
