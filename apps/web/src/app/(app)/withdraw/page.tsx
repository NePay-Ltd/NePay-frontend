"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconCheck as Check, IconPlus as Plus, IconBuilding as Landmark, IconBuilding as Building2 } from "@/components/icons";
import { ChevronsUpDown, Loader2, Search } from "lucide-react";;
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
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { Switch } from "@/components/ui/switch";

const PRESET_AMOUNTS = [10000, 50000, 100000];

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const formSchema = z.object({
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
            amount: 0,
        },
    });

    const watchAmount = form.watch("amount");
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

    // ── Bank Account State ──
    const [bankCode, setBankCode] = React.useState("");
    const [accountNumber, setAccountNumber] = React.useState("");
    const [resolvedName, setResolvedName] = React.useState("");
    const [saveAccount, setSaveAccount] = React.useState(true);

    const [bankPickerOpen, setBankPickerOpen] = React.useState(false);
    const [bankSearchQuery, setBankSearchQuery] = React.useState("");
    
    const selectedBank = bankList.find(b => b.bankCode === bankCode);
    const filteredBankList = React.useMemo(() => {
        const q = bankSearchQuery.trim().toLowerCase();
        if (!q) return bankList;
        return bankList.filter(b => b.bankName.toLowerCase().includes(q));
    }, [bankList, bankSearchQuery]);

    // Auto-resolve when 10 digits are typed and a bank is selected
    React.useEffect(() => {
        if (bankCode && accountNumber.length === 10) {
            resolveMutation.mutate(
                { accountNumber, bankCode },
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
    }, [bankCode, accountNumber]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelectSavedAccount = (acc: any) => {
        setBankCode(acc.bankCode);
        setAccountNumber(acc.accountNumber);
        setResolvedName(acc.accountName);
    };

    const handleConfirm = async () => {
        if (!isValidAmount || !bankCode || !accountNumber || !resolvedName) return;
        setTxState("processing"); // Show loading briefly while resolving
        try {
            const data = await resolveMutation.mutateAsync({
                accountNumber,
                bankCode
            });
            setResolutionToken(data.resolutionToken);
            setTxState("pin");
        } catch (err) {
            toast.error("Failed to verify bank account for withdrawal");
            setTxState("error");
        }
    };

    const handlePinSubmit = (pin: string) => {
        if (!resolutionToken || !selectedBank) return;
        setTxState("processing");
        initiateMutation.mutate(
            {
                amount: watchAmount.toString(),
                resolutionToken,
                pin,
                bankCode,
                accountNumber,
                accountName: resolvedName,
            },
            {
                onSuccess: (res) => {
                    setTxId(res.id); // Triggers success since we mock the polling
                    
                    if (saveAccount) {
                        const isAlreadySaved = savedAccounts.some(a => a.accountNumber === accountNumber && a.bankCode === bankCode);
                        if (!isAlreadySaved) {
                            saveBankMutation.mutate({
                                bankCode, accountNumber, accountName: resolvedName
                            });
                        }
                    }

                    setTxState("success");
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Withdrawal failed");
                    setTxState("error");
                }
            }
        );
    };

    const isFormValid = isValidAmount && !!bankCode && accountNumber.length === 10 && !!resolvedName;

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
                        <Panel flush className="border-none bg-transparent shadow-none sm:border-solid sm:bg-white sm:shadow-sm -mx-4 sm:mx-0 px-4 sm:px-6 py-2 sm:py-6">
                            <PanelBody className="space-y-6 sm:space-y-8">
                                {/* Available Balance Display */}
                                <div className="rounded-xl bg-violet-500/10 p-5 sm:p-6 border border-violet-500/20">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                                        Available Balance
                                    </p>
                                    <p className="mt-2 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-ink break-all drop-shadow-sm">
                                        {formatNaira(withdrawable)}
                                    </p>
                                </div>

                                {/* Bank Selector UI */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Select Bank</Label>
                                        <Popover open={bankPickerOpen} onOpenChange={setBankPickerOpen}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="flex h-12 w-full items-center justify-between rounded-md border border-border bg-white px-3 text-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                                                >
                                                    <span className={selectedBank ? "text-ink" : "text-muted"}>
                                                        {selectedBank ? selectedBank.bankName : "Select a bank"}
                                                    </span>
                                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[340px] p-0 md:w-[400px]">
                                                <div className="rounded-md border-0 bg-white shadow-none">
                                                    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                                                        <Search className="h-4 w-4 shrink-0 text-muted" />
                                                        <input
                                                            autoFocus
                                                            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted"
                                                            placeholder="Search banks..."
                                                            value={bankSearchQuery}
                                                            onChange={(e) => setBankSearchQuery(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="max-h-[250px] overflow-y-auto p-1">
                                                        {filteredBankList.length === 0 ? (
                                                            <p className="px-2 py-3 text-center text-xs text-muted">No banks found.</p>
                                                        ) : (
                                                            filteredBankList.map(b => (
                                                                <button
                                                                    key={b.bankCode}
                                                                    type="button"
                                                                    className={cn(
                                                                        "flex w-full items-center rounded-sm px-2 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                                                                        bankCode === b.bankCode && "bg-violet-50 dark:bg-violet-500/20 font-medium text-violet-700 dark:text-violet-300"
                                                                    )}
                                                                    onClick={() => {
                                                                        setBankCode(b.bankCode);
                                                                        setBankPickerOpen(false);
                                                                        setBankSearchQuery("");
                                                                    }}
                                                                >
                                                                    {b.bankName}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Account Number</Label>
                                        <div className="relative">
                                            <Input 
                                                className="h-12"
                                                placeholder="e.g. 0123456789" 
                                                maxLength={10}
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                            />
                                            {resolveMutation.isPending && (
                                                <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-muted" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Account Name</Label>
                                        <div className="flex h-12 w-full items-center rounded-md border border-border bg-gray-50 px-3 text-sm text-body">
                                            {resolvedName ? (
                                                <span className="font-medium text-ink">{resolvedName}</span>
                                            ) : (
                                                <span className="text-muted/50">—</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl bg-white p-4 border border-border">
                                        <div>
                                            <p className="text-sm font-bold text-ink">Save account</p>
                                            <p className="text-xs text-muted">Save this account for future withdrawals</p>
                                        </div>
                                        <Switch checked={saveAccount} onCheckedChange={setSaveAccount} />
                                    </div>
                                    
                                    {savedAccounts.length > 0 && (
                                        <div className="pt-4 border-t border-border">
                                            <p className="text-xs font-semibold text-muted mb-3 uppercase tracking-wider">Saved Accounts</p>
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                {savedAccounts.map(acc => (
                                                    <button
                                                        key={acc.id}
                                                        onClick={() => handleSelectSavedAccount(acc)}
                                                        className={cn(
                                                            "flex-shrink-0 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                                                            bankCode === acc.bankCode && accountNumber === acc.accountNumber 
                                                                ? "border-violet-600 bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300" 
                                                                : "border-border bg-white text-ink hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-900"
                                                        )}
                                                    >
                                                        {acc.iconUrl ? (
                                                            <img src={acc.iconUrl} alt="" className="h-5 w-5 rounded-full object-cover bg-gray-100" />
                                                        ) : (
                                                            <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <Landmark className="h-3 w-3 text-gray-500" />
                                                            </div>
                                                        )}
                                                        <span className="font-medium">{acc.accountName.split(' ')[0]}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
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
                                            className="font-semibold text-violet-600 dark:text-violet-400"
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
                                        A processing fee applies, deducted separately once the transfer completes. The exact amount depends on the destination bank.
                                    </p>
                                </div>
                            </PanelBody>
                        </Panel>
                    </div>

                    {/* ── Right Column (Summary & Submit) ── */}
                    <div className="space-y-6 md:col-span-5 px-4 sm:px-0">
                        <Panel flush className="border-none bg-transparent shadow-none sm:border-solid sm:bg-white sm:shadow-sm sm:p-5">
                            <PanelHeader title="Transaction Summary" className="px-2 sm:px-0" />
                            <PanelBody className="px-2 sm:px-0">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-base font-bold">
                                        <span className="text-ink">You withdraw</span>
                                        <span className="font-mono text-violet-600 dark:text-violet-400">
                                            {formatNaira(watchAmount || 0)}
                                        </span>
                                    </div>

                                    <div className="my-2 border-t border-dashed border-border" />

                                    <p className="text-xs text-body">
                                        A processing fee is charged separately once the transfer completes. The exact amount is set by the destination bank, not a fixed rate.
                                    </p>
                                </div>
                            </PanelBody>
                        </Panel>

                        <Button 
                            variant="primary" 
                            size="lg" 
                            fullWidth
                            disabled={!isFormValid}
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
                                    {selectedBank?.bankName}<br/>
                                    <span className="text-xs text-body font-mono">•••{accountNumber.slice(-4)}</span>
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Account Name</span>
                                <span className="font-medium text-ink truncate max-w-[150px]">
                                    {resolvedName}
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
