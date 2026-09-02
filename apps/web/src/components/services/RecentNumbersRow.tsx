"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { User2 } from "lucide-react";;

export interface RecentContact {
    name: string;
    id: string; // phone number or smartcard ID
}

interface RecentNumbersRowProps {
    contacts: RecentContact[];
    onSelect: (id: string) => void;
}

export function RecentNumbersRow({ contacts, onSelect }: RecentNumbersRowProps) {
    if (!contacts.length) return null;

    return (
        <div className="pt-2">
            <h4 className="text-xs font-bold text-muted mb-3 px-1 uppercase tracking-wider">Recent</h4>
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar snap-x">
                {contacts.map((contact, i) => (
                    <motion.button
                        key={`${contact.id}-${i}`}
                        type="button"
                        onClick={() => onSelect(contact.id)}
                        whileTap={{ scale: 0.96 }}
                        className="flex-none snap-start flex items-center gap-3 rounded-full border border-border bg-white p-2 pr-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                            <User2 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[13px] font-bold text-ink leading-tight">{contact.name}</span>
                            <span className="text-[11px] font-medium text-muted">{contact.id}</span>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
