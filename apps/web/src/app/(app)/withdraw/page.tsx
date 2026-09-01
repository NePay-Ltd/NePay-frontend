"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconCheck as Check, IconPlus as Plus, IconBuilding as Landmark, IconBuilding as Building2 } from "@/components/icons";
import { ChevronsUpDown, Loader2 } from "lucide-react";;
import { toast } from "sonner";

import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useOverviewSummary } from "@/lib/queries/overview";
import {
    useSavedBankAccounts,
    useBankList,
    useResolveBankAccount,
    useSaveBankAccount,
    useInitiateWithdrawal,
    useWithdrawalStatus
} from "@/lib/queries/withdraw";

import { RequireKyc } from "@/components/shared/require-kyc";
import { Button } from "@/components/shared/button";
import { Chip } from "@/components/shared/chip";
import { Panel, PanelHeader, PanelBody } from "@/components/shared/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";

const PRESET_AMOUNTS = [10000, 50000, 100000];

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const formSchema = z.object({
    bankAccountId: z.string().min(1, "Please select a bank account"),
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    amount: z.number().min(100, "Minimum withdrawal is ₦100").positive(),
});

type FormValues = z.infer<typeof formSchema>;

export default function WithdrawPage() {
    const router = useRouter();

    // ── Queries ──
    const { data: summary } = useOverviewSummary();
    const withdrawable = summary?.balance ?? 0;

    const { data: savedAccounts = [], isLoading: accountsLoading } = useSavedBankAccounts();
    const { data: bankList = [] } = useBankList();
    
    const resolveMutation = useResolveBankAccount();
    const saveBankMutation = useSaveBankAccount();
    const initiateMutation = useInitiateWithdrawal();

    // ── Form State ──
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bankAccountId: "",
            amount: 0,
        },
    });

    const watchAmount = form.watch("amount");
    const watchBankAccountId = form.watch("bankAccountId");
    const selectedAccount = savedAccounts.find((a) => a.id === watchBankAccountId);

    // No client-side fee estimate — the real fee is Korapay's own, only
    // known once the transfer completes (charged as a separate ledger
    // debit after the fact, see the backend's WithdrawalService.handleWebhook).
    const isValidAmount = watchAmount > 0 && watchAmount <= withdrawable;

    // ── Modal & Transaction State ──
    const [modalOpen, setModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("confirm");
    const [txId, setTxId] = React.useState<string | null>(null);
    const [resolutionToken, setResolutionToken] = React.useState<string | null>(null);

    // Poll the status if txId exists
    const { data: txStatus } = useWithdrawalStatus(txId);

    // Watch polling status and update modal state
    React.useEffect(() => {
        if (!txStatus) return;
        if (txStatus.status === "COMPLETED") setTxState("success");
        if (txStatus.status === "FAILED") setTxState("error");
    }, [txStatus]);

    // ── Popover State (Bank Selector vs Add New) ──
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const [isAddingNew, setIsAddingNew] = React.useState(false);
    
    // Add New Bank internal state
    const [newBankCode, setNewBankCode] = React.useState("");
    const [newAccountNumber, setNewAccountNumber] = React.useState("");
    const [resolvedName, setResolvedName] = React.useState("");

    // Auto-resolve when 10 digits are typed and a bank is selected
    React.useEffect(() => {
        if (newBankCode && newAccountNumber.length === 10) {
            resolveMutation.mutate(
                { accountNumber: newAccountNumber, bankCode: newBankCode },
                {
                    onSuccess: (data) => setResolvedName(data.accountName),
                    onError: () => {
                        toast.error("Could not resolve account details");
                        setResolvedName("");
                    }
                }
            );
        } else {
            setResolvedName("");
        }
    }, [newBankCode, newAccountNumber]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSaveNewBank = () => {
        if (!newBankCode || !newAccountNumber || !resolvedName) return;
        saveBankMutation.mutate(
            { accountNumber: newAccountNumber, bankCode: newBankCode, accountName: resolvedName },
            {
                onSuccess: (newAccount) => {
                    form.setValue("bankAccountId", newAccount.id, { shouldValidate: true });
                    setIsAddingNew(false);
                    setPopoverOpen(false);
                    toast.success("Bank account saved");
                }
            }
        );
    };

    const handleConfirm = async () => {
        if (!isValidAmount || !selectedAccount) return;
        setTxState("processing"); // Show loading briefly while resolving
        try {
            const data = await resolveMutation.mutateAsync({
                accountNumber: selectedAccount.accountNumber,
                bankCode: selectedAccount.bankCode
            });
            setResolutionToken(data.resolutionToken);
            setTxState("pin");
        } catch (err) {
            toast.error("Failed to verify bank account for withdrawal");
            setTxState("error");
        }
    };

    const handlePinSubmit = (pin: string) => {
        if (!resolutionToken || !selectedAccount) return;
        setTxState("processing");
        initiateMutation.mutate(
            {
                amount: watchAmount.toString(),
                resolutionToken,
                pin,
                bankCode: selectedAccount.bankCode,
                accountNumber: selectedAccount.accountNumber,
                accountName: selectedAccount.accountName,
            },
            {
                onSuccess: (res) => {
                    setTxId(res.id); // Triggers success since we mock the polling
                    setTxState("success");
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Withdrawal failed");
                    setTxState("error");
                }
            }
        );
    };

    return (
        <RequireKyc>
            <div className="mx-auto max-w-5xl space-y-8">
                {/* ── Top Header ── */}
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-ink">Withdraw Funds</h1>
                    <p className="mt-2 text-sm text-body">
                        Transfer money securely to your local bank account.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-10">
                    {/* ── Left Column (Form) ── */}
                    <div className="space-y-6 md:col-span-7">
                        <Panel>
                            <PanelBody className="space-y-6 p-6">
                                {/* Available Balance Display */}
                                <div className="rounded-xl bg-violet-050 p-4">
                                    <p className="text-xs font-medium uppercase tracking-wider text-violet-700/70">
                                        Available Balance
                                    </p>
                                    <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-violet-700">
                                        {formatNaira(withdrawable)}
                                    </p>
                                </div>

                                {/* Bank Selector */}
                                <div className="space-y-2">
                                    <Label>Select Bank Account</Label>
                                    <Popover open={popoverOpen} onOpenChange={(o) => {
                                        setPopoverOpen(o);
                                        if (!o) setIsAddingNew(false); // Reset view on close
                                    }}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="quiet"
                                                role="combobox"
                                                aria-expanded={popoverOpen}
                                                className="w-full justify-between h-14 bg-white hover:bg-gray-50 border-border"
                                            >
                                                {selectedAccount ? (
                                                    <div className="flex items-center gap-3 truncate">
                                                        <img src={selectedAccount.iconUrl} alt="" className="h-6 w-6 rounded-full object-cover bg-gray-100" />
                                                        <div className="flex flex-col items-start truncate">
                                                            <span className="text-sm font-semibold text-ink truncate">{selectedAccount.bankName}</span>
                                                            <span className="text-xs text-muted truncate">
                                                                {selectedAccount.accountNumber} • {selectedAccount.accountName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Select a saved bank...</span>
                                                )}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[340px] p-0 md:w-[400px]" align="start">
                                            {!isAddingNew ? (
                                                <Command>
                                                    <CommandInput placeholder="Search saved banks..." />
                                                    <CommandList>
                                                        <CommandEmpty>No saved accounts found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {savedAccounts.map((acc) => (
                                                                <CommandItem
                                                                    key={acc.id}
                                                                    value={`${acc.bankName} ${acc.accountNumber}`}
                                                                    onSelect={() => {
                                                                        form.setValue("bankAccountId", acc.id, { shouldValidate: true });
                                                                        setPopoverOpen(false);
                                                                    }}
                                                                    className="flex items-center gap-3 py-3"
                                                                >
                                                                    <img src={acc.iconUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium">{acc.bankName}</span>
                                                                        <span className="text-xs text-muted">{acc.accountNumber}</span>
                                                                    </div>
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto h-4 w-4 text-violet-600",
                                                                            watchBankAccountId === acc.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                    <div className="border-t border-border p-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            fullWidth 
                                                            className="justify-start text-violet-600"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setIsAddingNew(true);
                                                                setNewBankCode("");
                                                                setNewAccountNumber("");
                                                                setResolvedName("");
                                                            }}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Add new bank account
                                                        </Button>
                                                    </div>
                                                </Command>
                                            ) : (
                                                // Inline Add Bank Form
                                                <div className="p-4 space-y-4">
                                                    <h3 className="text-sm font-semibold text-ink">Add New Bank</h3>
                                                    
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted">Bank</Label>
                                                        <select 
                                                            className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                                                            value={newBankCode}
                                                            onChange={(e) => setNewBankCode(e.target.value)}
                                                        >
                                                            <option value="" disabled>Select a bank</option>
                                                            {bankList.map(b => (
                                                                <option key={b.bankCode} value={b.bankCode}>{b.bankName}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted">Account Number</Label>
                                                        <div className="relative">
                                                            <Input 
                                                                placeholder="e.g. 0123456789" 
                                                                maxLength={10}
                                                                value={newAccountNumber}
                                                                onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, ''))}
                                                            />
                                                            {resolveMutation.isPending && (
                                                                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted">Account Name</Label>
                                                        <div className="flex h-10 w-full items-center rounded-md border border-border bg-gray-50 px-3 text-sm text-body">
                                                            {resolvedName ? (
                                                                <span className="font-medium text-ink">{resolvedName}</span>
                                                            ) : (
                                                                <span className="text-muted/50">—</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 flex gap-2">
                                                        <Button 
                                                            variant="primary" 
                                                            className="flex-1"
                                                            disabled={!resolvedName || saveBankMutation.isPending}
                                                            onClick={handleSaveNewBank}
                                                        >
                                                            {saveBankMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Bank"}
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            className="flex-1"
                                                            onClick={() => setIsAddingNew(false)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </PopoverContent>
                                    </Popover>
                                    
                                    {form.formState.errors.bankAccountId && (
                                        <p className="text-xs text-red-500 mt-1">{form.formState.errors.bankAccountId.message}</p>
                                    )}
                                </div>

                                {/* Amount Selector */}
                                <div className="space-y-3 pt-4 border-t border-border">
                                    <Label>Amount (₦)</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg text-muted">
                                            ₦
                                        </span>
                                        <Input 
                                            type="number"
                                            className="h-16 pl-10 font-mono text-2xl"
                                            placeholder="0.00"
                                            {...form.register("amount", { valueAsNumber: true })}
                                            min={0}
                                        />
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_AMOUNTS.map(preset => (
                                            <Chip 
                                                key={preset}
                                                active={watchAmount === preset}
                                                onClick={() => form.setValue("amount", preset, { shouldValidate: true })}
                                            >
                                                +{formatNaira(preset)}
                                            </Chip>
                                        ))}
                                        <Chip
                                            active={watchAmount === withdrawable && withdrawable > 0}
                                            onClick={() => {
                                                if (withdrawable > 0) {
                                                    form.setValue("amount", withdrawable, { shouldValidate: true });
                                                }
                                            }}
                                            className="font-semibold text-violet-700"
                                        >
                                            Max
                                        </Chip>
                                    </div>

                                    {form.formState.errors.amount && (
                                        <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
                                    )}
                                    {watchAmount > 0 && !isValidAmount && !form.formState.errors.amount && (
                                        <p className="text-xs text-red-500">Insufficient funds for this amount.</p>
                                    )}
                                    <p className="text-xs text-muted">
                                        A processing fee applies, deducted separately once the transfer completes — the exact amount depends on the destination bank.
                                    </p>
                                </div>
                            </PanelBody>
                        </Panel>
                    </div>

                    {/* ── Right Column (Summary & Submit) ── */}
                    <div className="space-y-6 md:col-span-5">
                        <Panel>
                            <PanelHeader title="Transaction Summary" />
                            <PanelBody className="p-5">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-base font-bold">
                                        <span className="text-ink">You withdraw</span>
                                        <span className="font-mono text-violet-700">
                                            {formatNaira(watchAmount || 0)}
                                        </span>
                                    </div>

                                    <div className="my-2 border-t border-dashed border-border" />

                                    <p className="text-xs text-body">
                                        A processing fee is charged separately once the transfer completes — the exact amount is set by the destination bank, not a fixed rate.
                                    </p>
                                </div>
                            </PanelBody>
                        </Panel>

                        <Button 
                            variant="primary" 
                            size="lg" 
                            fullWidth
                            disabled={!isValidAmount || !watchBankAccountId}
                            onClick={() => {
                                // Reset state before opening modal
                                setTxId(null);
                                setTxState("confirm");
                                setModalOpen(true);
                            }}
                        >
                            Withdraw Now
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Confirmation Modal ── */}
            <TransactionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                state={txState}
                // Confirm UI
                confirmTitle="Review Withdrawal"
                confirmButtonLabel="Confirm & Send"
                onConfirm={handleConfirm}
                onCancel={() => setModalOpen(false)}
                confirmContent={
                    <div className="space-y-4 pt-2 pb-4">
                        <div className="rounded-xl border border-border bg-gray-50 p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">To</span>
                                <span className="font-medium text-ink text-right">
                                    {selectedAccount?.bankName}<br/>
                                    <span className="text-xs text-body font-mono">•••{selectedAccount?.accountNumber.slice(-4)}</span>
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Account Name</span>
                                <span className="font-medium text-ink truncate max-w-[150px]">
                                    {selectedAccount?.accountName}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between font-bold text-base px-1">
                            <span>Amount</span>
                            <span className="font-mono">{formatNaira(watchAmount)}</span>
                        </div>
                    </div>
                }
                // Processing UI
                processingText="Processing your withdrawal..."
                // Success UI
                successTitle="Withdrawal Successful"
                successDescription={
                    <p>
                        We have successfully sent <span className="font-bold">{formatNaira(watchAmount)}</span> to your bank account. It should arrive shortly.
                    </p>
                }
                successButtonLabel="View transactions"
                onSuccessAction={() => {
                    setModalOpen(false);
                    router.push("/transactions");
                }}
                // Error UI
                errorTitle="Withdrawal Failed"
                errorDescription={
                    <p>{txStatus?.failureReason || initiateMutation.error?.message || "We encountered an unexpected error."}</p>
                }
                errorButtonLabel="Edit Amount"
                onErrorAction={() => setModalOpen(false)}
                // PIN
                onPinSubmit={handlePinSubmit}
            />
        </RequireKyc>
    );
}
