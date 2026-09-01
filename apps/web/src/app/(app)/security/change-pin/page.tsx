"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";;
import { toast } from "sonner";

import { useChangePin } from "@/lib/queries/security";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createPinSchema = (isSetupMode: boolean) => z.object({
    currentPin: z.string().optional(),
    newPin: z.string().length(4, "PIN must be exactly 4 digits"),
    confirmPin: z.string().length(4, "PIN must be exactly 4 digits"),
}).superRefine((data, ctx) => {
    if (!isSetupMode) {
        if (!data.currentPin || data.currentPin.length !== 4) {
            ctx.addIssue({
                path: ["currentPin"],
                code: z.ZodIssueCode.custom,
                message: "Current PIN must be exactly 4 digits",
            });
        }

        if (data.currentPin && data.newPin === data.currentPin) {
            ctx.addIssue({
                path: ["newPin"],
                code: z.ZodIssueCode.custom,
                message: "New PIN must be different from current PIN",
            });
        }
    }

    if (data.newPin !== data.confirmPin) {
        ctx.addIssue({
            path: ["confirmPin"],
            code: z.ZodIssueCode.custom,
            message: "PINs do not match",
        });
    }
});

type PinFormValues = z.infer<ReturnType<typeof createPinSchema>>;

export default function ChangePinPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isSetupMode = searchParams.get("mode") === "setup";
    const { mutateAsync: changePin, isPending } = useChangePin();

    const form = useForm<PinFormValues>({
        resolver: zodResolver(createPinSchema(isSetupMode)),
        defaultValues: {
            currentPin: "",
            newPin: "",
            confirmPin: "",
        },
    });

    const onSubmit = async (data: PinFormValues) => {
        try {
            const payload = isSetupMode
                ? { newPin: data.newPin }
                : { currentPin: data.currentPin ?? "", newPin: data.newPin };

            await changePin(payload);

            toast.success(isSetupMode ? "Transaction PIN set successfully." : "PIN changed successfully.");
            // Mark that PIN was just set to prevent showing the dialog immediately
            if (isSetupMode) {
                localStorage.setItem('pinJustSet', 'true');
            }
            router.back();
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || "Failed to update PIN.";
            // Only set currentPin error if we're in change mode (not setup mode)
            if (!isSetupMode && (message.toLowerCase().includes("current pin") || message.toLowerCase().includes("incorrect current pin"))) {
                form.setError("currentPin", { type: "manual", message });
                return;
            }
            form.setError("newPin", { type: "manual", message });
        }
    };

    // Helper to only allow numeric input in the form fields
    const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof PinFormValues) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
        form.setValue(fieldName, val, { shouldValidate: form.formState.isSubmitted });
    };

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.back()}
                    className="-ml-2 shrink-0 px-2"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-ink">
                        {isSetupMode ? "Set transaction PIN" : "Change transaction PIN"}
                    </h1>
                    <p className="mt-0.5 text-sm text-body">
                        {isSetupMode
                            ? "Create your 4-digit payment PIN for withdrawals and purchases."
                            : "Update your 4-digit security PIN for transactions."}
                    </p>
                </div>
            </div>

            <Panel>
                <PanelBody>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        {!isSetupMode && (
                            <div className="space-y-2">
                                <Label htmlFor="currentPin">Current PIN</Label>
                                <Input
                                    id="currentPin"
                                    type="password"
                                    inputMode="numeric"
                                    placeholder="••••"
                                    {...form.register("currentPin")}
                                    onChange={(e) => handleNumericInput(e, "currentPin")}
                                    className="text-2xl tracking-[0.5em] font-mono h-12"
                                />
                                {form.formState.errors.currentPin && (
                                    <p className="text-xs text-red-500">{form.formState.errors.currentPin.message}</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="newPin">{isSetupMode ? "New PIN" : "New PIN"}</Label>
                            <Input
                                id="newPin"
                                type="password"
                                inputMode="numeric"
                                placeholder="••••"
                                {...form.register("newPin")}
                                onChange={(e) => handleNumericInput(e, "newPin")}
                                className="text-2xl tracking-[0.5em] font-mono h-12"
                            />
                            {form.formState.errors.newPin && (
                                <p className="text-xs text-red-500">{form.formState.errors.newPin.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPin">Confirm New PIN</Label>
                            <Input
                                id="confirmPin"
                                type="password"
                                inputMode="numeric"
                                placeholder="••••"
                                {...form.register("confirmPin")}
                                onChange={(e) => handleNumericInput(e, "confirmPin")}
                                className="text-2xl tracking-[0.5em] font-mono h-12"
                            />
                            {form.formState.errors.confirmPin && (
                                <p className="text-xs text-red-500">{form.formState.errors.confirmPin.message}</p>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button type="submit" variant="primary" fullWidth loading={isPending}>
                                {isSetupMode ? "Set PIN" : "Save New PIN"}
                            </Button>
                        </div>
                    </form>
                </PanelBody>
            </Panel>
        </div>
    );
}
