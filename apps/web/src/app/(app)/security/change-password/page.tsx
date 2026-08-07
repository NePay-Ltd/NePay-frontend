"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

import { useChangePassword } from "@/lib/queries/security";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

function calculateStrength(password: string): number {
    let strength = 0;
    if (password.length > 0) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
}

export default function ChangePasswordPage() {
    const router = useRouter();
    const { mutateAsync: changePassword, isPending } = useChangePassword();

    const [showCurrent, setShowCurrent] = React.useState(false);
    const [showNew, setShowNew] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);

    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const newPasswordValue = form.watch("newPassword");
    const strength = calculateStrength(newPasswordValue || "");

    const onSubmit = async (data: PasswordFormValues) => {
        try {
            await changePassword({ currentPass: data.currentPassword, newPass: data.newPassword });
            toast.success("Password changed successfully.");
            router.back();
        } catch (err: any) {
            form.setError("currentPassword", { type: "manual", message: err.message || "Failed to change password." });
        }
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
                    <h1 className="text-2xl font-bold text-ink">Change Password</h1>
                    <p className="mt-0.5 text-sm text-body">
                        Keep your account secure with a strong password.
                    </p>
                </div>
            </div>

            <Panel>
                <PanelBody>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrent ? "text" : "password"}
                                    placeholder="Enter your current password"
                                    {...form.register("currentPassword")}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2.5 text-muted hover:text-ink"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                >
                                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {form.formState.errors.currentPassword && (
                                <p className="text-xs text-red-500">{form.formState.errors.currentPassword.message}</p>
                            )}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNew ? "text" : "password"}
                                    placeholder="Enter your new password"
                                    {...form.register("newPassword")}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2.5 text-muted hover:text-ink"
                                    onClick={() => setShowNew(!showNew)}
                                >
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            
                            {/* Strength Indicator */}
                            <div className="mt-2 flex h-1 w-full gap-1">
                                <div className={cn("h-full flex-1 rounded-full transition-colors", strength >= 1 ? "bg-red-500" : "bg-gray-200")} />
                                <div className={cn("h-full flex-1 rounded-full transition-colors", strength >= 2 ? "bg-amber-500" : "bg-gray-200")} />
                                <div className={cn("h-full flex-1 rounded-full transition-colors", strength >= 3 ? "bg-green-500" : "bg-gray-200")} />
                                <div className={cn("h-full flex-1 rounded-full transition-colors", strength >= 4 ? "bg-green-600" : "bg-gray-200")} />
                            </div>
                            
                            {form.formState.errors.newPassword && (
                                <p className="text-xs text-red-500">{form.formState.errors.newPassword.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Re-enter your new password"
                                    {...form.register("confirmPassword")}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2.5 text-muted hover:text-ink"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {form.formState.errors.confirmPassword && (
                                <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button type="submit" variant="primary" fullWidth loading={isPending}>
                                Save New Password
                            </Button>
                        </div>
                    </form>
                </PanelBody>
            </Panel>
        </div>
    );
}
