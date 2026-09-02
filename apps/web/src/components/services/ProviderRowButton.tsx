"use client";

import * as React from "react";
import { ChevronRight, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Provider } from "./ProviderSelector";

interface ProviderRowButtonProps {
    providers: Provider[];
    selectedId: string;
    onChange: (id: string) => void;
}

export function ProviderRowButton({ providers, selectedId, onChange }: ProviderRowButtonProps) {
    const [open, setOpen] = React.useState(false);
    const selectedProvider = providers.find((p) => p.id === selectedId) || providers[0];

    if (providers.length === 0 || !selectedProvider) return null;

    const ProviderIcon = ({ provider, size = "md" }: { provider: Provider, size?: "sm" | "md" }) => {
        const dimensions = size === "md" ? "h-10 w-10" : "h-8 w-8";
        const textClass = size === "md" ? "text-sm" : "text-xs";
        
        if (provider.logoUrl) {
            return (
                <div className={`flex ${dimensions} items-center justify-center rounded-full bg-white shadow-sm overflow-hidden shrink-0 border border-gray-100 dark:border-white/10`}>
                    <img
                        src={provider.logoUrl}
                        alt={provider.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                parent.className = `flex ${dimensions} items-center justify-center rounded-full ${provider.color} text-white font-black ${textClass} shadow-sm shrink-0 border border-gray-100 dark:border-white/10`;
                                parent.innerHTML = provider.label.charAt(0);
                            }
                        }}
                    />
                </div>
            );
        }
        return (
            <div className={`flex ${dimensions} items-center justify-center rounded-full ${provider.color} text-white font-black ${textClass} shadow-sm shrink-0 border border-gray-100 dark:border-white/10`}>
                {provider.label.charAt(0)}
            </div>
        );
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button type="button" className="flex items-center justify-between w-full p-4 rounded-2xl border-2 border-border bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors outline-none">
                    <div className="flex items-center gap-3">
                        <ProviderIcon provider={selectedProvider} />
                        <span className="text-[17px] font-bold text-ink">{selectedProvider.label}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-[calc(100vw-32px)] max-w-xl p-2 z-50">
                <div className="space-y-1 max-h-[60vh] overflow-y-auto no-scrollbar">
                    {providers.map((p) => {
                        const isSelected = selectedId === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => {
                                    onChange(p.id);
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ${isSelected ? 'bg-violet-50 dark:bg-violet-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <ProviderIcon provider={p} size="sm" />
                                    <span className={`text-[15px] font-bold ${isSelected ? 'text-violet-700 dark:text-violet-400' : 'text-ink'}`}>{p.label}</span>
                                </div>
                                {isSelected && <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
