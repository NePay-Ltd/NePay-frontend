"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Phone } from "lucide-react";
import { toast } from "sonner";

import { registerStepOneSchema, type RegisterStepOneValues } from "@/lib/schemas/auth";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";

interface RegisterStepOneProps {
    defaultValues: RegisterStepOneValues | null;
    onSuccess: (data: RegisterStepOneValues) => void;
}

export function RegisterStepOne({ defaultValues, onSuccess }: RegisterStepOneProps) {
    const [isSendingOtp, setIsSendingOtp] = React.useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
    const [otpSent, setOtpSent] = React.useState(false);
    const [countdown, setCountdown] = React.useState(0);
    const [otpCode, setOtpCode] = React.useState("");

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<RegisterStepOneValues>({
        resolver: zodResolver(registerStepOneSchema),
        defaultValues: defaultValues || {
            firstName: "",
            lastName: "",
            phone: "",
            otpVerified: false,
        },
    });

    const phone = watch("phone");
    const otpVerified = watch("otpVerified");

    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const formatPhone = (rawPhone: string) => {
        let formattedPhone = rawPhone.trim();
        if (formattedPhone.startsWith("0")) {
            formattedPhone = "+234" + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith("+")) {
            formattedPhone = "+" + formattedPhone;
        }
        return formattedPhone;
    };

    const handleSendOtp = async () => {
        if (!phone || errors.phone) {
            toast.error("Please enter a valid phone number first.");
            return;
        }

        setIsSendingOtp(true);
        try {
            // Mocking the backend call since backend endpoints are not ready
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setOtpSent(true);
            setCountdown(60);
            toast.success("Verification code sent! (Mock: any 6 digits)");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to send code.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otpCode.length !== 6) return;

        setIsVerifyingOtp(true);
        try {
            // Mocking the backend call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setValue("otpVerified", true, { shouldValidate: true });
            toast.success("Phone number verified!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Invalid or expired code.");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const onSubmit = (values: RegisterStepOneValues) => {
        if (!values.otpVerified) {
            toast.error("Please verify your phone number to continue.");
            return;
        }
        onSuccess(values);
    };

    return (
        <form id="register-step-one" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" htmlFor="reg-first-name" error={errors.firstName?.message}>
                    <Input
                        id="reg-first-name"
                        type="text"
                        placeholder="Chinedu"
                        {...register("firstName")}
                        aria-invalid={!!errors.firstName}
                    />
                </Field>
                <Field label="Last Name" htmlFor="reg-last-name" error={errors.lastName?.message}>
                    <Input
                        id="reg-last-name"
                        type="text"
                        placeholder="Okafor"
                        {...register("lastName")}
                        aria-invalid={!!errors.lastName}
                    />
                </Field>
            </div>

            <Field label="Phone Number" htmlFor="reg-phone" error={errors.phone?.message} trailing={<Phone className="h-4 w-4" aria-hidden />}>
                <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="08012345678"
                    inputMode="tel"
                    autoComplete="tel"
                    {...register("phone")}
                    disabled={otpVerified || isSendingOtp}
                    aria-invalid={!!errors.phone}
                    className="pr-10"
                />
            </Field>

            {!otpVerified && (
                <div className="flex items-center gap-3 mt-2">
                    <Button
                        type="button"
                        variant="quiet"
                        size="sm"
                        onClick={handleSendOtp}
                        disabled={!phone || !!errors.phone || countdown > 0 || isSendingOtp}
                        loading={isSendingOtp}
                    >
                        {countdown > 0 ? `Resend code in ${countdown}s` : "Send Code"}
                    </Button>
                </div>
            )}

            {/* OTP Input UI */}
            {otpSent && !otpVerified && (
                <div className="rounded-lg border border-border p-4 bg-gray-50 mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label htmlFor="reg-otp" className="block text-sm font-medium text-ink">
                        Enter the 6-digit code sent to your phone
                    </label>
                    <div className="flex gap-2 items-center">
                        <Input
                            id="reg-otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            className="w-32 tracking-widest text-center"
                        />
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleVerifyOtp}
                            disabled={otpCode.length !== 6 || isVerifyingOtp}
                            loading={isVerifyingOtp}
                        >
                            Verify
                        </Button>
                    </div>
                </div>
            )}

            {otpVerified && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 mt-4 text-green-700 text-sm font-medium flex items-center gap-2 animate-in fade-in">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-xs">✓</span>
                    Phone number verified
                </div>
            )}

            <input type="hidden" {...register("otpVerified")} />
            {errors.otpVerified && (
                <p className="text-red-500 text-sm font-medium mt-1">{errors.otpVerified.message}</p>
            )}

            <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!otpVerified}
                className="mt-6"
            >
                Next Step
                <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
        </form>
    );
}
