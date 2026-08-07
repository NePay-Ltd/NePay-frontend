"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { useChangePin } from "@/lib/queries/security";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const pinSchema = z.object({
    currentPin: z.string().length(4, "PIN must be exactly 4 digits"),
    newPin: z.string().length(4, "PIN must be exactly 4 digits"),
    confirmPin: z.string().length(4, "PIN must be exactly 4 digits"),
}).refine((data) => data.newPin !== data.currentPin, {
    message: "New PIN must be different from current PIN",
    path: ["newPin"],
}).refine((data) => data.newPin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
});

type PinFormValues = z.infer<typeof pinSchema>;

export default function ChangePinPage() {
    const router = useRouter();
    const { mutateAsync: changePin, isPending } = useChangePin();

    const form = useForm<PinFormValues>({
        resolver: zodResolver(pinSchema),
        defaultValues: {
            currentPin: "",
            newPin: "",
            confirmPin: "",
        },
    });

    const onSubmit = async (data: PinFormValues) => {
        try {
            await changePin({ currentPin: data.currentPin, newPin: data.newPin });
            toast.success("PIN changed successfully.");
            router.back();
        } catch (err: any) {
            form.setError("currentPin", { type: "manual", message: err.message || "Failed to change PIN." });
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
                    <h1 className="text-2xl font-bold text-ink">Change PIN</h1>
                    <p className="mt-0.5 text-sm text-body">
                        Update your 4-digit security PIN for transactions.
                    </p>
                </div>
            </div>

            <Panel>
                <PanelBody>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

                        <div className="space-y-2">
                            <Label htmlFor="newPin">New PIN</Label>
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
                                Save New PIN
                            </Button>
                        </div>
                    </form>
                </PanelBody>
            </Panel>
        </div>
    );
}
