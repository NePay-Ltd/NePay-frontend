"use client";

import * as React from "react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmRemoveDialogProps {
    open: boolean;
    title: string;
    description: React.ReactNode;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/** "Are you sure?" step behind every saved-beneficiary / saved-account ✕, so a stray tap never deletes anything. */
export function ConfirmRemoveDialog({ open, title, description, loading, onConfirm, onCancel }: ConfirmRemoveDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={(o) => !o && !loading && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        // Radix closes an AlertDialog on action click; keep it open until the request settles.
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                    >
                        {loading ? "Removing..." : "Remove"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
