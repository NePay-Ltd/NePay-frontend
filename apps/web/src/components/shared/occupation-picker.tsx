"use client";

/**
 * Searchable occupation picker for the Bridge onboarding form's
 * `mostRecentOccupation` field — replaces a bare "type your O*NET/SOC
 * code" input, which no ordinary user could fill in without looking one
 * up. Backed by OCCUPATION_CODES, a curated ~140-entry subset (verified
 * live against Bridge's own accepted-values list, see that file's header)
 * covering common occupations. Anyone whose job isn't listed can fall back
 * to typing the raw code manually — the field is unchanged on the wire, so
 * there's no coverage gap, just a UX one for less common jobs.
 */

import * as React from "react";
import { IconChevronDown as ChevronDown, IconSearch as Search } from "@/components/icons";
import { Check } from "lucide-react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/shared/button";
import { cn } from "@/lib/cn";
import { OCCUPATION_CODES } from "@/lib/occupation-codes";

export function OccupationPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
    const [open, setOpen] = React.useState(false);
    const [manual, setManual] = React.useState(false);

    const matched = OCCUPATION_CODES.find((o) => o.code === value);

    if (manual) {
        return (
            <div className="space-y-1.5">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="e.g. 151254"
                    autoFocus
                />
                <button
                    type="button"
                    onClick={() => setManual(false)}
                    className="text-xs font-semibold text-violet-600 hover:underline"
                >
                    Search by job title instead
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="quiet"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal"
                    >
                        <span className={cn("truncate text-left", !matched && "text-muted")}>
                            {matched ? matched.label : "Search for your job title…"}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Type a job title…" />
                        <CommandList>
                            <CommandEmpty>
                                <div className="space-y-2 px-2 py-1 text-center">
                                    <p className="flex items-center justify-center gap-1.5 text-muted">
                                        <Search className="h-3.5 w-3.5" />
                                        No match found
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            setManual(true);
                                        }}
                                        className="text-xs font-semibold text-violet-600 hover:underline"
                                    >
                                        Enter the code manually
                                    </button>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {OCCUPATION_CODES.map((o) => (
                                    <CommandItem
                                        key={o.code}
                                        value={o.label}
                                        onSelect={() => {
                                            onChange(o.code);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", value === o.code ? "opacity-100" : "opacity-0")} />
                                        {o.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <button
                type="button"
                onClick={() => setManual(true)}
                className="text-xs font-semibold text-violet-600 hover:underline"
            >
                Can&apos;t find it? Enter the code manually
            </button>
        </div>
    );
}
