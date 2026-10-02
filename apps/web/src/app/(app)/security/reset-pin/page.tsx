"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { useResetPin, useSecuritySettings, useSendPinResetOtp } from "@/lib/queries/security";
import { isTrivialPin, TRIVIAL_PIN_MESSAGE } from "@/lib/pin-strength";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Method = "email" | "totp";

const resetPinSchema = z
    .object({
        password: z.string().min(1, "Enter your account password"),
        code: z.string().length(6, "Enter the 6-digit code"),
        newPin: z.string().length(4, "PIN must be exactly 4 digits"),
        confirmPin: z.string().length(4, "PIN must be exactly 4 digits"),
    })
    .superRefine((data, ctx) => {
        if (data.newPin.length === 4 && isTrivialPin(data.newPin)) {
            ctx.addIssue({ path: ["newPin"], code: z.ZodIssueCode.custom, message: TRIVIAL_PIN_MESSAGE });
        }

        if (data.newPin !== data.confirmPin) {
            ctx.addIssue({ path: ["confirmPin"], code: z.ZodIssueCode.custom, message: "PINs do not match" });
        }
    });

type ResetPinValues = z.infer<typeof resetPinSchema>;

function errorMessage(err: any, fallback: string): string {
    return err?.response?.data?.message || err?.message || fallback;
}

export default function ResetPinPage() {
    const router = useRouter();
    const { data: settings, isLoading: settingsLoading } = useSecuritySettings();
    const { mutateAsync: sendOtp, isPending: sendingOtp } = useSendPinResetOtp();
    const { mutateAsync: resetPin, isPending: resetting } = useResetPin();

    const [method, setMethod] = React.useState<Method>("email");
    const [codeSent, setCodeSent] = React.useState(false);

    const form = useForm<ResetPinValues>({
        resolver: zodResolver(resetPinSchema),
        defaultValues: { password: "", code: "", newPin: "", confirmPin: "" },
    });

    // Nothing to reset until a PIN exists — send them to first-time setup instead.
    React.useEffect(() => {
        if (settings && !settings.pinSet) {
            router.replace("/security/change-pin?mode=setup");
        }
    }, [settings, router]);

    const twoFactorEnabled = !!settings?.twoFactorEnabled;

    const switchMethod = (next: Method) => {
        setMethod(next);
        form.setValue("code", "");
        form.clearErrors("code");
    };

    const handleSendCode = async () => {
        try {
            await sendOtp();
            setCodeSent(true);
            toast.success("We've emailed you a 6-digit code.");
        } catch (err: any) {
            toast.error(errorMessage(err, "Couldn't send the code. Please try again."));
        }
    };

    const onSubmit = async (data: ResetPinValues) => {
        try {
            await resetPin({
                password: data.password,
                newPin: data.newPin,
                ...(method === "totp" ? { totpCode: data.code } : { otp: data.code }),
            });

            toast.success("Transaction PIN reset successfully.");
            router.back();
        } catch (err: any) {
            const message = errorMessage(err, "Failed to reset PIN.");
            const lower = message.toLowerCase();

            if (lower.includes("password")) {
                form.setError("password", { type: "manual", message });
            } else if (lower.includes("code")) {
                form.setError("code", { type: "manual", message });
            } else {
                form.setError("newPin", { type: "manual", message });
            }
        }
    };

    const digitsOnly = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ResetPinValues, max: number) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, max);
        form.setValue(field, val, { shouldValidate: form.formState.isSubmitted });
    };

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 shrink-0 px-2">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-ink">Reset transaction PIN</h1>
                    <p className="mt-0.5 text-sm text-body">
                        Forgot your PIN? Confirm it&apos;s you, then choose a new one.
                    </p>
                </div>
            </div>

            <Panel>
                <PanelBody>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="password">Account password</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Your login password"
                                {...form.register("password")}
                                className="h-12"
                            />
                            {form.formState.errors.password && (
                                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        {twoFactorEnabled && (
                            <div className="space-y-2">
                                <Label>Verify with</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={method === "email" ? "primary" : "quiet"}
                                        onClick={() => switchMethod("email")}
                                    >
                                        Email code
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={method === "totp" ? "primary" : "quiet"}
                                        onClick={() => switchMethod("totp")}
                                    >
                                        Authenticator app
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="code">
                                {method === "totp" ? "Authenticator code" : "Email code"}
                            </Label>
                            <div className="flex items-start gap-2">
                                <Input
                                    id="code"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="6-digit code"
                                    {...form.register("code")}
                                    onChange={(e) => digitsOnly(e, "code", 6)}
                                    className="h-12 font-mono tracking-widest"
                                />
                                {method === "email" && (
                                    <Button
                                        type="button"
                                        variant="quiet"
                                        className="h-12 shrink-0"
                                        loading={sendingOtp}
                                        onClick={handleSendCode}
                                    >
                                        {codeSent ? "Resend" : "Send code"}
                                    </Button>
                                )}
                            </div>
                            {method === "email" && (
                                <p className="text-xs text-muted">
                                    {codeSent
                                        ? "Check your email — the code expires in 10 minutes."
                                        : "We'll email a 6-digit code to the address on your account."}
                                </p>
                            )}
                            {form.formState.errors.code && (
                                <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>
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
                                onChange={(e) => digitsOnly(e, "newPin", 4)}
                                className="h-12 font-mono text-2xl tracking-[0.5em]"
                            />
                            {form.formState.errors.newPin && (
                                <p className="text-xs text-red-500">{form.formState.errors.newPin.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPin">Confirm new PIN</Label>
                            <Input
                                id="confirmPin"
                                type="password"
                                inputMode="numeric"
                                placeholder="••••"
                                {...form.register("confirmPin")}
                                onChange={(e) => digitsOnly(e, "confirmPin", 4)}
                                className="h-12 font-mono text-2xl tracking-[0.5em]"
                            />
                            {form.formState.errors.confirmPin && (
                                <p className="text-xs text-red-500">{form.formState.errors.confirmPin.message}</p>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                loading={resetting}
                                disabled={settingsLoading}
                            >
                                Reset PIN
                            </Button>
                        </div>
                    </form>
                </PanelBody>
            </Panel>
        </div>
    );
}
