"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { User2, X } from "lucide-react";
import { toast } from "sonner";

import { ConfirmRemoveDialog } from "@/components/shared/confirm-remove-dialog";
import { useDeleteBeneficiary } from "@/lib/queries/services";

export interface RecentContact {
    name: string;
    id: string; // phone number or smartcard ID
    /** Saved-beneficiary id — when present the chip gets a ✕ to remove it. */
    beneficiaryId?: string;
}

interface RecentNumbersRowProps {
    contacts: RecentContact[];
    onSelect: (id: string) => void;
}

export function RecentNumbersRow({ contacts, onSelect }: RecentNumbersRowProps) {
    const deleteBeneficiary = useDeleteBeneficiary();
    const [toRemove, setToRemove] = React.useState<RecentContact | null>(null);

    if (!contacts.length) return null;

    const confirmRemove = () => {
        if (!toRemove?.beneficiaryId) return;
        deleteBeneficiary.mutate(toRemove.beneficiaryId, {
            onSuccess: () => {
                toast.success("Removed from saved");
                setToRemove(null);
            },
            onError: () => toast.error("Couldn't remove it. Please try again."),
        });
    };

    return (
        <div className="pt-2">
            <h4 className="text-xs font-bold text-muted mb-3 px-1 uppercase tracking-wider">Recent</h4>
            {/* pt/pr leave room for the ✕ badge that overhangs each chip's top-right corner */}
            <div className="flex gap-2 overflow-x-auto pb-4 pt-2 pr-2 no-scrollbar snap-x">
                {contacts.map((contact, i) => (
                    <div key={`${contact.id}-${i}`} className="relative flex-none snap-start">
                        <motion.button
                            type="button"
                            onClick={() => onSelect(contact.id)}
                            whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-3 rounded-full border border-border bg-white p-2 pr-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                <User2 className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="text-[13px] font-bold text-ink leading-tight">{contact.name}</span>
                                <span className="text-[11px] font-medium text-muted">{contact.id}</span>
                            </div>
                        </motion.button>
                        {contact.beneficiaryId && (
                            <button
                                type="button"
                                aria-label={`Remove ${contact.name} from saved`}
                                onClick={() => setToRemove(contact)}
                                className="absolute -right-1.5 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-muted shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                                <X className="h-3 w-3" strokeWidth={3} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <ConfirmRemoveDialog
                open={!!toRemove}
                title="Remove saved beneficiary?"
                description={
                    <>
                        {toRemove?.name} ({toRemove?.id}) will be removed from your saved list. You can save it again the next time you pay.
                    </>
                }
                loading={deleteBeneficiary.isPending}
                onConfirm={confirmRemove}
                onCancel={() => setToRemove(null)}
            />
        </div>
    );
}
