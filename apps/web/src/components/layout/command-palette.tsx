"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    ArrowUpRight,
    Gift,
    Plane,
    Receipt,
    LayoutGrid,
    Building2,
    Search,
    Loader2,
} from "lucide-react";

import { useUiStore } from "@/lib/stores/ui-store";
import { SIDEBAR_GROUPS } from "@/lib/navigation";
import { fetchSearch, type SearchHit } from "@/lib/mock-overview";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

// ─── Search result types ──────────────────────────────────────────────────────

interface SearchState {
    transactions: SearchHit[];
    services: SearchHit[];
    banks: SearchHit[];
}

const EMPTY_RESULTS: SearchState = {
    transactions: [],
    services: [],
    banks: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandPalette() {
    const open = useUiStore((s) => s.commandOpen);
    const setOpen = useUiStore((s) => s.setCommandOpen);
    const router = useRouter();

    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchState>(EMPTY_RESULTS);
    const [isSearching, setIsSearching] = React.useState(false);

    const debouncedQuery = useDebounce(query, 280);

    // ── Keyboard shortcut ────────────────────────────────────────────────
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

    // ── Clear query on close ─────────────────────────────────────────────
    React.useEffect(() => {
        if (!open) {
            setQuery("");
            setResults(EMPTY_RESULTS);
        }
    }, [open]);

    // ── Debounced search ─────────────────────────────────────────────────
    React.useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (!open) return;
            setIsSearching(true);
            try {
                const data = await fetchSearch(debouncedQuery);
                if (!cancelled) setResults(data);
            } finally {
                if (!cancelled) setIsSearching(false);
            }
        };
        void run();
        return () => { cancelled = true; };
    }, [debouncedQuery, open]);

    const navigate = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    // Total results count for deciding what to show
    const hasResults =
        results.transactions.length > 0 ||
        results.services.length > 0 ||
        results.banks.length > 0;

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Search transactions, services, banks…"
                value={query}
                onValueChange={setQuery}
            />

            <CommandList>
                {/* Loading state */}
                {isSearching && (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching…
                    </div>
                )}

                {/* Empty state — only show when not searching */}
                {!isSearching && query.length > 0 && !hasResults && (
                    <CommandEmpty>
                        No results for &ldquo;{query}&rdquo;
                    </CommandEmpty>
                )}

                {/* ── Default state (no query) ────────────────────────── */}
                {!isSearching && query.length === 0 && (
                    <>
                        <CommandGroup heading="Quick Actions">
                            <CommandItem onSelect={() => navigate("/add-money")}>
                                <Plus className="mr-2 h-4 w-4 text-violet-600" />
                                Add Money
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/withdraw")}>
                                <ArrowUpRight className="mr-2 h-4 w-4 text-violet-600" />
                                Withdraw
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/gift-cards")}>
                                <Gift className="mr-2 h-4 w-4 text-violet-600" />
                                Buy Gift Card
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/flights")}>
                                <Plane className="mr-2 h-4 w-4 text-violet-600" />
                                Book Flight
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="Navigate">
                            {SIDEBAR_GROUPS.flatMap((group) => group.items).map((item) => {
                                const Icon = item.icon;
                                return (
                                    <CommandItem
                                        key={item.key}
                                        onSelect={() => navigate(`/${item.key}`)}
                                    >
                                        <Icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </>
                )}

                {/* ── Search results ──────────────────────────────────── */}
                {!isSearching && hasResults && (
                    <>
                        {results.transactions.length > 0 && (
                            <CommandGroup heading="Transactions">
                                {results.transactions.map((hit) => (
                                    <CommandItem
                                        key={hit.id}
                                        onSelect={() => navigate(hit.href)}
                                    >
                                        <Receipt className="mr-2 h-4 w-4 shrink-0 text-muted" />
                                        <span className="flex-1 truncate">{hit.label}</span>
                                        {hit.meta && (
                                            <span className="ml-2 shrink-0 text-xs text-muted">
                                                {hit.meta}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {results.transactions.length > 0 && results.services.length > 0 && (
                            <CommandSeparator />
                        )}

                        {results.services.length > 0 && (
                            <CommandGroup heading="Services">
                                {results.services.map((hit) => (
                                    <CommandItem
                                        key={hit.id}
                                        onSelect={() => navigate(hit.href)}
                                    >
                                        <LayoutGrid className="mr-2 h-4 w-4 shrink-0 text-muted" />
                                        <span className="flex-1 truncate">{hit.label}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {results.services.length > 0 && results.banks.length > 0 && (
                            <CommandSeparator />
                        )}

                        {results.banks.length > 0 && (
                            <CommandGroup heading="Banks">
                                {results.banks.map((hit) => (
                                    <CommandItem
                                        key={hit.id}
                                        onSelect={() => navigate(hit.href)}
                                    >
                                        <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted" />
                                        <span className="flex-1 truncate">{hit.label}</span>
                                        {hit.meta && (
                                            <span className="ml-2 shrink-0 font-mono text-xs text-muted">
                                                {hit.meta}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </>
                )}
            </CommandList>

            {/* Footer hint */}
            <div className="flex items-center gap-4 border-t border-border px-3 py-2">
                <span className="flex items-center gap-1 text-[11px] text-muted">
                    <Search className="h-3 w-3" /> Search
                </span>
                <span className="text-[11px] text-muted">
                    <kbd className="rounded border border-border bg-bg px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                    {" "}navigate
                </span>
                <span className="text-[11px] text-muted">
                    <kbd className="rounded border border-border bg-bg px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                    {" "}select
                </span>
                <span className="ml-auto text-[11px] text-muted">
                    <kbd className="rounded border border-border bg-bg px-1 py-0.5 font-mono text-[10px]">Esc</kbd>
                    {" "}close
                </span>
            </div>
        </CommandDialog>
    );
}
