import * as React from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

import { Modal } from "./modal";
import { Button } from "./button";

import { Input } from "@/components/ui/input";

export type TransactionState = "confirm" | "pin" | "processing" | "success" | "error";

export interface TransactionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    
    /** Current state of the transaction state machine */
    state: TransactionState;

    // ── Confirm State ──
    confirmTitle?: string;
    confirmContent?: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmButtonLabel?: string;
    cancelButtonLabel?: string;

    // ── Pin State ──
    pinTitle?: string;
    pinDescription?: React.ReactNode;
    onPinSubmit?: (pin: string) => void;

    // ── Processing State ──
    processingTitle?: string;
    processingText?: string;

    // ── Success State ──
    successTitle?: string;
    successDescription?: React.ReactNode;
    onSuccessAction?: () => void;
    successButtonLabel?: string;

    // ── Error State ──
    errorTitle?: string;
    errorDescription?: React.ReactNode;
    onErrorAction: () => void;
    errorButtonLabel?: string;
}

/**
 * Generic state-machine modal for transactional flows (Withdrawals, Transfers, Bill Payments).
 * Handles the standard Confirm -> Processing -> Success/Error UX cleanly.
 */
export function TransactionModal({
    open,
    onOpenChange,
    state,
    confirmTitle = "Confirm Transaction",
    confirmContent,
    onConfirm,
    onCancel,
    confirmButtonLabel = "Confirm & Send",
    cancelButtonLabel = "Cancel",
    processingTitle = "Processing...",
    processingText = "Please wait a moment while we process your request.",
    successTitle = "Transaction Successful",
    successDescription = "Your transaction has been completed successfully.",
    onSuccessAction,
    successButtonLabel = "Done",
    errorTitle = "Transaction Failed",
    errorDescription = "We encountered an issue. Please try again.",
    onErrorAction,
    errorButtonLabel = "Try Again",
    pinTitle = "Enter PIN",
    pinDescription = "Please enter your 4-digit transaction PIN to proceed.",
    onPinSubmit,
}: TransactionModalProps) {
    const [pin, setPin] = React.useState("");

    // Reset pin when modal closes
    React.useEffect(() => {
        if (!open) setPin("");
    }, [open]);

    // Determine dynamic title based on state
    const modalTitle = 
        state === "confirm" ? confirmTitle :
        state === "pin" ? pinTitle :
        state === "processing" ? processingTitle :
        state === "success" ? successTitle :
        errorTitle;

    // Disable closing the modal via backdrop/escape while processing
    const handleOpenChange = (isOpen: boolean) => {
        if (state === "processing") return;
        onOpenChange(isOpen);
    };

    return (
        <Modal
            open={open}
            onOpenChange={handleOpenChange}
            title={modalTitle}
            size="sm"
            // We use a custom footer based on the state
            footer={
                state === "confirm" ? (
                    <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row-reverse sm:gap-3">
                        <Button variant="primary" fullWidth onClick={() => onConfirm?.()}>
                            {confirmButtonLabel}
                        </Button>
                        <Button variant="ghost" fullWidth onClick={() => onCancel?.()}>
                            {cancelButtonLabel}
                        </Button>
                    </div>
                ) : state === "pin" ? (
                    <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row-reverse sm:gap-3">
                        <Button variant="primary" fullWidth onClick={() => onPinSubmit?.(pin)} disabled={pin.length < 4}>
                            Confirm
                        </Button>
                        <Button variant="ghost" fullWidth onClick={() => onCancel?.()}>
                            {cancelButtonLabel}
                        </Button>
                    </div>
                ) : state === "success" ? (
                    <Button variant="primary" fullWidth onClick={() => onSuccessAction?.()} className="mt-4">
                        {successButtonLabel}
                    </Button>
                ) : state === "error" ? (
                    <Button variant="primary" fullWidth onClick={() => onErrorAction?.()} className="mt-4">
                        {errorButtonLabel}
                    </Button>
                ) : null // No footer during processing
            }
        >
            <div className="py-2">
                {state === "confirm" && confirmContent}

                {state === "pin" && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
                        <div className="text-sm text-body">{pinDescription}</div>
                        <Input 
                            type="password" 
                            maxLength={4} 
                            placeholder="••••" 
                            className="text-center text-3xl tracking-[1em] h-14 w-40 font-mono pl-6"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>
                )}

                {state === "processing" && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                        <p className="text-center text-sm font-medium text-ink">{processingText}</p>
                    </div>
                )}

                {state === "success" && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div className="text-sm text-body">{successDescription}</div>
                    </div>
                )}

                {state === "error" && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <div className="text-sm text-body">{errorDescription}</div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
