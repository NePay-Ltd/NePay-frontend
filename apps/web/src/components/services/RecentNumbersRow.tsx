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
            <h4 className="mb-3 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Recent</h4>
            <div className="flex gap-3 overflow-x-auto pb-4 pt-1 pr-2 no-scrollbar snap-x">
                {contacts.map((contact, i) => (
                    <div key={`${contact.id}-${i}`} className="relative flex-none snap-start">
                        <motion.button
                            type="button"
                            onClick={() => onSelect(contact.id)}
                            whileTap={{ scale: 0.98 }}
                            className={`flex min-w-[190px] items-center gap-3 rounded-2xl border p-3 pr-9 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                                contact.beneficiaryId
                                    ? "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white hover:border-violet-300 dark:border-violet-900/70 dark:from-violet-950/40 dark:via-gray-950 dark:to-gray-950"
                                    : "border-border bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
                            }`}
                        >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                contact.beneficiaryId
                                    ? "bg-violet-600 text-white shadow-sm shadow-violet-900/20"
                                    : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                            }`}>
                                <User2 className="h-4 w-4" />
                            </div>
                            <div className="flex min-w-0 flex-col items-start">
                                <span className="max-w-[145px] truncate text-[13px] font-bold leading-tight text-ink">{contact.name}</span>
                                <span className="max-w-[145px] truncate text-[11px] font-medium text-muted">{contact.id}</span>
                                {contact.beneficiaryId && (
                                    <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
                                        Saved beneficiary
                                    </span>
                                )}
                            </div>
                        </motion.button>
                        {contact.beneficiaryId && (
                            <button
                                type="button"
                                aria-label={`Remove ${contact.name} from saved`}
                                onClick={() => setToRemove(contact)}
                                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-violet-100 bg-white/90 text-muted shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-violet-900 dark:bg-gray-900"
                            >
                                <X className="h-3.5 w-3.5" strokeWidth={3} />
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
