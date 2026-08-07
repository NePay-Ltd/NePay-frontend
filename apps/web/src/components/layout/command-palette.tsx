"use client";

import * as React from "react";
import { Plus, ArrowUpRight, Gift, Plane } from "lucide-react";

import { useUiStore } from "@/lib/stores/ui-store";
import { SIDEBAR_NAV } from "@/lib/navigation";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";

export function CommandPalette() {
    const open = useUiStore((s) => s.commandOpen);
    const setOpen = useUiStore((s) => s.setCommandOpen);
    const setActiveNav = useUiStore((s) => s.setActiveNav);

    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen(!open);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, setOpen]);

    const handleNavigate = (key: string) => {
        setActiveNav(key);
        setOpen(false);
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Search NePay..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Quick Actions">
                    <CommandItem onSelect={() => setOpen(false)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Money
                    </CommandItem>
                    <CommandItem onSelect={() => setOpen(false)}>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Withdraw
                    </CommandItem>
                    <CommandItem onSelect={() => setOpen(false)}>
                        <Gift className="mr-2 h-4 w-4" />
                        Buy Gift Card
                    </CommandItem>
                    <CommandItem onSelect={() => setOpen(false)}>
                        <Plane className="mr-2 h-4 w-4" />
                        Book Flight
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Navigate">
                    {SIDEBAR_NAV.map((item) => {
                        const Icon = item.icon;
                        return (
                            <CommandItem
                                key={item.key}
                                onSelect={() => handleNavigate(item.key)}
                            >
                                <Icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </CommandItem>
                        );
                    })}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
