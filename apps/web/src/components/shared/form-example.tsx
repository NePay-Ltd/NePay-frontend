"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatNaira, formatNairaString } from "@/lib/format";

/**
 * Example Add Money form demonstrating React Hook Form + Zod.
 * This shows the standard pattern every form in this app should follow.
 */

const addMoneySchema = z.object({
    amount: z
        .string()
        .min(1, "Enter an amount")
        .refine((val) => !Number.isNaN(Number(val)), "Must be a valid number")
        .refine((val) => Number(val) > 0, "Amount must be greater than 0")
        .refine((val) => Number(val) >= 100, "Minimum deposit is ₦100"),
    source: z.string().min(1, "Select a source"),
    reference: z.string().max(50, "Reference too long").optional(),
});

type AddMoneyValues = z.infer<typeof addMoneySchema>;

export function AddMoneyForm() {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<AddMoneyValues>({
        resolver: zodResolver(addMoneySchema),
        defaultValues: {
            amount: "",
            source: "",
            reference: "",
        },
    });

    const source = watch("source");

    const onSubmit = async (values: AddMoneyValues) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success(`Deposited ${formatNairaString(values.amount)} successfully`);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field
                label="Amount"
                htmlFor="amount"
                error={errors.amount?.message}
                hint="Minimum ₦100"
            >
                <Input
                    id="amount"
                    type="number"
                    placeholder="5000"
                    className="font-mono"
                    {...register("amount")}
                />
            </Field>

            <Field
                label="Source Account"
                htmlFor="source"
                error={errors.source?.message}
            >
                <Select
                    value={source}
                    onValueChange={(val) => setValue("source", val)}
                >
                    <SelectTrigger id="source">
                        <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gtb">GTBank — 0123456789</SelectItem>
                        <SelectItem value="zenith">Zenith Bank — 0987654321</SelectItem>
                        <SelectItem value="access">Access Bank — 0555342211</SelectItem>
                        <SelectItem value="uba">UBA — 0112233445</SelectItem>
                    </SelectContent>
                </Select>
            </Field>

            <Field
                label="Reference (optional)"
                htmlFor="reference"
                error={errors.reference?.message}
            >
                <Input
                    id="reference"
                    placeholder="August rent deposit"
                    {...register("reference")}
                />
            </Field>

            <Button type="submit" loading={isSubmitting} fullWidth>
                Add Money
            </Button>
        </form>
    );
}
