"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

export interface Provider {
    id: string;
    label: string;
    color: string; // e.g. "bg-yellow-400"
    logoUrl?: string; // Optional logo image
}

interface ProviderSelectorProps {
    providers: Provider[];
    selectedId: string;
    onChange: (id: string) => void;
}

export function ProviderSelector({ providers, selectedId, onChange }: ProviderSelectorProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-ink">Select Provider</h3>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x">
                {providers.map((provider) => {
                    const isSelected = selectedId === provider.id;

                    return (
                        <motion.button
                            key={provider.id}
                            type="button"
                            onClick={() => onChange(provider.id)}
                            whileTap={{ scale: 0.96 }}
                            className={`relative flex-none snap-start overflow-hidden rounded-2xl border-2 transition-colors ${
                                isSelected 
                                    ? "border-violet-600 bg-violet-50" 
                                    : "border-border bg-white hover:border-violet-200"
                            }`}
                            style={{ width: 100, height: 100 }}
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                {provider.logoUrl ? (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm mb-2 overflow-hidden border border-gray-100">
                                        <img src={provider.logoUrl} alt={provider.label} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${provider.color} text-white font-black text-xl shadow-sm mb-2`}>
                                        {provider.label.charAt(0)}
                                    </div>
                                )}
                                <span className={`text-[13px] font-bold leading-none ${isSelected ? 'text-violet-900' : 'text-ink'}`}>
                                    {provider.label}
                                </span>
                            </div>

                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm"
                                    >
                                        <Check className="h-3 w-3" strokeWidth={3} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
