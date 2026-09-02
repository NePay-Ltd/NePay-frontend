"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Phone } from "lucide-react";

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
        },
    });

    const onSubmit = (values: RegisterStepOneValues) => {
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
                    aria-invalid={!!errors.phone}
                    className="pr-10"
                />
            </Field>

            <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="mt-6"
            >
                Next Step
                <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
        </form>
    );
}
