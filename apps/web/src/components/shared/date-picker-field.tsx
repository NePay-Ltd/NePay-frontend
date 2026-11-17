"use client";

/**
 * Web's equivalent of Nepay-Mobile-App's DatePickerField — a tap-to-open
 * calendar instead of the bare native `<input type="date">` this replaces.
 * Built on the Calendar/Popover primitives that already existed in this
 * codebase but were never wired together (confirmed: Calendar wasn't
 * imported anywhere before this).
 */

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MIN_DATE = new Date(1900, 0, 1);

function parseKey(value: string): Date | undefined {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return undefined;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function formatDisplay(date: Date): string {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function DatePickerField({
    value,
    onChange,
    placeholder = "Select date",
}: {
    /** "YYYY-MM-DD", or "" when nothing is picked yet. */
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = React.useState(false);
    const selected = parseKey(value);
    const today = new Date();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex h-12 w-full items-center justify-between rounded-md border border-border bg-white px-3 text-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                >
                    <span className={selected ? "text-ink" : "text-muted"}>
                        {selected ? formatDisplay(selected) : placeholder}
                    </span>
                    <CalendarIcon className="h-4 w-4 shrink-0 text-muted" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={selected}
                    defaultMonth={selected ?? new Date(today.getFullYear() - 25, today.getMonth())}
                    disabled={[{ after: today }, { before: MIN_DATE }]}
                    onSelect={(date) => {
                        if (!date) return;
                        onChange(toKey(date));
                        setOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
