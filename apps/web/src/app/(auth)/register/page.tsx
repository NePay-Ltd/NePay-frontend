"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconEye as Eye, IconEyeOff as EyeOff, IconLock as Lock, IconCheck as Check } from "@/components/icons";
import { UserPlus, Phone, AtSign } from "lucide-react";;
import { toast } from "sonner";

import { registerSchema, type RegisterValues } from "@/lib/schemas/auth";
import { useAuth } from "@/lib/auth-context";
import { RegisterStepOne } from "@/components/auth/RegisterStepOne";
import { RegisterStepTwo } from "@/components/auth/RegisterStepTwo";
import { RegisterStepThree } from "@/components/auth/RegisterStepThree";
import type { RegisterStepOneValues, RegisterStepTwoValues } from "@/lib/schemas/auth";
import type { ApiError } from "@/lib/api";
import type { AuthTokensDto } from "@/lib/types/api";

export default function RegisterPage() {
    const { register: registerUser, login } = useAuth();
    const [step, setStep] = React.useState<1 | 2 | 3>(1);
    const [stepOneData, setStepOneData] = React.useState<RegisterStepOneValues | null>(null);
    const [tempCredentials, setTempCredentials] = React.useState<{email: string; password: string} | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const onStepOneSuccess = (data: RegisterStepOneValues) => {
        setStepOneData(data);
        setStep(2);
    };

    const onSubmitFinal = async (stepTwoData: RegisterStepTwoValues) => {
        if (!stepOneData) return;
        setIsSubmitting(true);
        
        try {
            let formattedPhone = stepOneData.phone.trim();
            if (formattedPhone.startsWith("0")) {
                formattedPhone = "+234" + formattedPhone.substring(1);
            } else if (!formattedPhone.startsWith("+")) {
                formattedPhone = "+" + formattedPhone;
            }

            const user = await registerUser({
                firstName: stepOneData.firstName,
                lastName: stepOneData.lastName,
                phone: formattedPhone,
                username: stepTwoData.username,
                email: stepTwoData.email,
                password: stepTwoData.password,
            });

            if (user) {
                setTempCredentials({
                    email: stepTwoData.email,
                    password: stepTwoData.password,
                });
                setStep(3);
            }
        } catch (err) {
            const apiErr = err as ApiError;
            // toast is already handled in auth-context or can be caught
        } finally {
            setIsSubmitting(false);
        }
    };

    const onVerifySuccess = () => {
        if (tempCredentials) {
            // After successfully verifying email, log them in automatically
            login({ identifier: tempCredentials.email, password: tempCredentials.password }).catch(() => {
                // If auto-login fails, they can just sign in manually
                window.location.href = "/login";
            });
        }
    };

    return (
        <div className="space-y-8">
            {/* Heading & Stepper */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-violet-600' : 'bg-gray-200'}`} />
                    <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-violet-600' : 'bg-gray-200'}`} />
                    <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-violet-600' : 'bg-gray-200'}`} />
                </div>
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-bold tracking-tight text-ink">
                        {step === 1 && "Let's start with you"}
                        {step === 2 && "Secure your account"}
                        {step === 3 && "Verify your email"}
                    </h1>
                    <p className="text-sm text-body">
                        {step === 1 && "Step 1 of 3: Personal details"}
                        {step === 2 && "Step 2 of 3: Login credentials"}
                        {step === 3 && "Step 3 of 3: Email verification"}
                    </p>
                </div>
            </div>

            {step === 1 && (
                <RegisterStepOne 
                    defaultValues={stepOneData} 
                    onSuccess={onStepOneSuccess} 
                />
            )}
            
            {step === 2 && (
                <RegisterStepTwo 
                    isSubmitting={isSubmitting} 
                    onBack={() => setStep(1)} 
                    onSubmitFinal={onSubmitFinal} 
                />
            )}

            {step === 3 && tempCredentials && (
                <RegisterStepThree
                    email={tempCredentials.email}
                    isSubmitting={isSubmitting}
                    onVerifySuccess={onVerifySuccess}
                />
            )}

            <p className="text-center text-sm text-body">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-violet-600 hover:underline"
                >
                    Sign in
                </Link>
            </p>

            {/* Dev hint */}
            {process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true" && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700">
                    Mock mode — after registration you&apos;ll be redirected to{" "}
                    <code className="font-mono">/kyc</code>.
                    <br />
                    Use <code className="font-mono">taken@example.com</code> to test the duplicate-email error.
                </p>
            )}
        </div>
    );
}
