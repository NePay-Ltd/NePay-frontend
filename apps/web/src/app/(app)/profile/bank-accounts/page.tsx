"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconBuilding as Building2, IconPlus as Plus } from "@/components/icons";
import { ChevronLeft, Trash2, AlertCircle } from "lucide-react";;
import { toast } from "sonner";

import { 
    useSavedBankAccounts, 
    useDeleteBankAccount, 
    useBankList, 
    useResolveBankAccount, 
    useSaveBankAccount 
} from "@/lib/queries/withdraw";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { RowItem } from "@/components/shared/row-item";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";

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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ─── Add Bank Account Form ───────────────────────────────────────────────────

const addBankSchema = z.object({
    bankCode: z.string().min(1, "Please select a bank"),
    accountNumber: z.string().length(10, "Account number must be 10 digits"),
});

type AddBankFormValues = z.infer<typeof addBankSchema>;

export default function BankAccountsPage() {
    const router = useRouter();

    // Queries
    const { data: accounts, isLoading: accountsLoading } = useSavedBankAccounts();
    const { data: banks, isLoading: banksLoading } = useBankList();

    // Mutations
    const { mutate: deleteAccount, isPending: isDeleting } = useDeleteBankAccount();
    const { mutateAsync: resolveAccount, isPending: isResolving } = useResolveBankAccount();
    const { mutateAsync: saveAccount, isPending: isSaving } = useSaveBankAccount();

    // State
    const [accountToDelete, setAccountToDelete] = React.useState<string | null>(null);
    const [addModalOpen, setAddModalOpen] = React.useState(false);
    const [resolvedName, setResolvedName] = React.useState<string | null>(null);

    // Form
    const form = useForm<AddBankFormValues>({
        resolver: zodResolver(addBankSchema),
        defaultValues: {
            bankCode: "",
            accountNumber: "",
        },
    });

    const accountNumber = form.watch("accountNumber");
    const bankCode = form.watch("bankCode");

    // Automatically resolve when we have 10 digits and a bank code
    React.useEffect(() => {
        if (accountNumber?.length === 10 && bankCode) {
            resolveAccount({ accountNumber, bankCode })
                .then((res) => {
                    setResolvedName(res.accountName);
                })
                .catch(() => {
                    setResolvedName(null);
                    toast.error("Could not resolve account name. Please check details.");
                });
        } else {
            setResolvedName(null);
        }
    }, [accountNumber, bankCode, resolveAccount]);

    // Handlers
    const onDeleteConfirm = () => {
        if (!accountToDelete) return;
        deleteAccount(accountToDelete, {
            onSuccess: () => {
                toast.success("Bank account removed");
                setAccountToDelete(null);
            },
            onError: () => {
                toast.error("Failed to remove account");
            }
        });
    };

    const onAddSubmit = async (data: AddBankFormValues) => {
        if (!resolvedName) {
            toast.error("Please wait for account name to resolve.");
            return;
        }

        try {
            await saveAccount({
                accountNumber: data.accountNumber,
                bankCode: data.bankCode,
                accountName: resolvedName,
            });
            toast.success("Bank account added successfully!");
            setAddModalOpen(false);
            form.reset();
            setResolvedName(null);
        } catch {
            toast.error("Failed to save bank account.");
        }
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* ── Page Header ── */}
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
                    <h1 className="text-2xl font-bold text-ink">Saved Bank Accounts</h1>
                    <p className="mt-0.5 text-sm text-body">
                        Manage accounts for your withdrawals.
                    </p>
                </div>
            </div>

            {/* ── Bank Accounts List ── */}
            <Panel>
                <PanelBody className="p-0">
                    {accountsLoading ? (
                        <div className="flex flex-col divide-y divide-border">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-5">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : accounts?.length === 0 ? (
                        <div className="py-12">
                            <EmptyState
                                icon={Building2}
                                heading="No saved accounts"
                                description="Add a bank account to enable withdrawals from your wallet."
                            />
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {accounts?.map((acc) => (
                                <RowItem
                                    key={acc.id}
                                    leading={
                                        <img 
                                            src={acc.iconUrl} 
                                            alt={acc.bankName} 
                                            className="h-10 w-10 rounded-full border border-border object-cover bg-white" 
                                        />
                                    }
                                    title={acc.bankName}
                                    subtitle={`${acc.accountName} • ${acc.accountNumber}`}
                                    className="px-5"
                                    trailing={
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setAccountToDelete(acc.id)}
                                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </PanelBody>
            </Panel>

            <Button
                variant="ghost"
                fullWidth
                className="h-12 border-dashed border-2 border-border text-muted hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50"
                onClick={() => setAddModalOpen(true)}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add New Bank Account
            </Button>

            {/* ── Delete Confirmation Dialog ── */}
            <AlertDialog open={!!accountToDelete} onOpenChange={(o) => !o && setAccountToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <AlertDialogTitle>Remove bank account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this account? You can always add it back later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onDeleteConfirm}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        >
                            {isDeleting ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Add Bank Account Modal ── */}
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Bank Account</DialogTitle>
                        <DialogDescription>
                            Enter your account details to add a new withdrawal destination.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="bankCode">Bank Name</Label>
                            <Select
                                value={form.watch("bankCode")}
                                onValueChange={(val) => form.setValue("bankCode", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {banksLoading ? (
                                        <div className="p-2 text-sm text-muted">Loading banks...</div>
                                    ) : (
                                        banks?.map((bank) => (
                                            <SelectItem key={bank.bankCode} value={bank.bankCode}>
                                                {bank.bankName}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.bankCode && (
                                <p className="text-xs text-red-500">{form.formState.errors.bankCode.message}</p>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input
                                id="accountNumber"
                                placeholder="0123456789"
                                maxLength={10}
                                {...form.register("accountNumber")}
                            />
                            {form.formState.errors.accountNumber && (
                                <p className="text-xs text-red-500">{form.formState.errors.accountNumber.message}</p>
                            )}
                        </div>

                        {/* Resolved Name Preview */}
                        {isResolving ? (
                            <div className="rounded-md bg-gray-50 p-3 text-sm text-muted animate-pulse flex items-center justify-center">
                                Resolving account name...
                            </div>
                        ) : resolvedName ? (
                            <div className="rounded-md bg-green-50/50 p-3 text-sm font-medium text-green-700 border border-green-200">
                                {resolvedName}
                            </div>
                        ) : null}

                        <div className="pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                disabled={!resolvedName || isResolving}
                                loading={isSaving}
                            >
                                Add Account
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
