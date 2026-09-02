"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Provider } from "./ProviderSelector";

interface PhoneNetworkInputProps {
    phone: string;
    onChangePhone: (phone: string) => void;
    providers: Provider[];
    selectedProviderId: string;
    onChangeProvider: (id: string) => void;
}

export function PhoneNetworkInput({ phone, onChangePhone, providers, selectedProviderId, onChangeProvider }: PhoneNetworkInputProps) {
    const [open, setOpen] = React.useState(false);

    const selectedProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

    const ProviderIcon = ({ provider }: { provider?: Provider }) => {
        if (!provider) return <div className="h-8 w-8 rounded-full bg-gray-200" />;
        if (provider.logoUrl) {
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm overflow-hidden shrink-0 border border-gray-100">
                    <img
                        src={provider.logoUrl}
                        alt={provider.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                parent.className = `flex h-8 w-8 items-center justify-center rounded-full ${provider.color} text-white font-black text-xs shadow-sm shrink-0 border border-gray-100`;
                                parent.innerHTML = provider.label.charAt(0);
                            }
                        }}
                    />
                </div>
            );
        }
        return (
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${provider.color} text-white font-black text-xs shadow-sm shrink-0 border border-gray-100`}>
                {provider.label.charAt(0)}
            </div>
        );
    };

    return (
        <div className="relative flex items-center h-16 w-full rounded-2xl border-2 border-border bg-white dark:bg-white/5 focus-within:border-violet-600 transition-colors overflow-hidden">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button type="button" className="flex items-center gap-2 h-full pl-4 pr-3 border-r border-border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors outline-none">
                        <ProviderIcon provider={selectedProvider} />
                        <ChevronDown className="h-4 w-4 text-muted" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-48 p-2">
                    <div className="space-y-1">
                        {providers.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    onChangeProvider(p.id);
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${selectedProviderId === p.id ? 'bg-gray-50 dark:bg-white/5' : ''}`}
                            >
                                <ProviderIcon provider={p} />
                                <span className={`text-sm font-bold ${selectedProviderId === p.id ? 'text-violet-600 dark:text-violet-400' : 'text-ink'}`}>{p.label}</span>
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
            
            <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                maxLength={11}
                onChange={(e) => onChangePhone(e.target.value.replace(/\D/g, ''))}
                className="flex-1 h-full bg-transparent px-4 text-xl font-bold tracking-wide outline-none placeholder:font-medium placeholder:text-muted"
            />
        </div>
    );
}
