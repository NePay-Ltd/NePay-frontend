"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    ArrowRightLeft,
    Building2,
    Clock,
    Copy,
    FlaskConical,
    Mail,
    Receipt,
    ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { RequireKyc } from "@/components/shared/require-kyc";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";
import { Field } from "@/components/shared/field";
import { Tag, type TagVariant } from "@/components/shared/tag";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

import { formatByCurrency, formatNaira } from "@/lib/format";
import { formatDate, formatRelativeTime } from "@/lib/date";
import {
    useFcyAccounts,
    useRequestFcyAccount,
    useSimulateCadCollection,
    useFcyCollections,
    useFcyConversions,
    useInitiateFcyConversion,
    useFcyRfiCases,
    useSubmitRfiResponse,
} from "@/lib/queries/fcy";
import type {
    FcyAccountDto,
    FcyCurrency,
    FcyIdentityDocumentType,
} from "@/lib/types/api";

const CURRENCIES: { code: FcyCurrency; label: string; note?: string }[] = [
    { code: "USD", label: "USD", note: "Requires a passport — not testable in sandbox yet" },
    { code: "EUR", label: "EUR" },
    { code: "GBP", label: "GBP", note: "Not testable in sandbox yet" },
    { code: "CAD", label: "CAD", note: "Fully testable — collections can be simulated" },
];

const DOCUMENT_TYPES: { value: FcyIdentityDocumentType; label: string }[] = [
    { value: "PASSPORT", label: "Passport" },
    { value: "NATIONAL_ID", label: "National ID" },
    { value: "DRIVERS_LICENSE", label: "Driver's licence" },
];

function copy(value: string, label: string) {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
}

const ACCOUNT_STATUS_TAG: Record<FcyAccountDto["status"], { variant: TagVariant; label: string }> = {
    REQUESTED: { variant: "warn", label: "Requested" },
    APPROVED: { variant: "warn", label: "Provisioning" },
    ISSUED: { variant: "ok", label: "Active" },
    DECLINED: { variant: "error", label: "Declined" },
    CLOSED: { variant: "neutral", label: "Closed" },
};

const COLLECTION_STATUS_TAG: Record<string, { variant: TagVariant; label: string }> = {
    PENDING: { variant: "warn", label: "Pending" },
    SUCCESSFUL: { variant: "ok", label: "Successful" },
    FAILED: { variant: "error", label: "Failed" },
    AWAITING_INFO: { variant: "warn", label: "Info requested" },
};

const CONVERSION_STATUS_TAG: Record<string, { variant: TagVariant; label: string }> = {
    INITIATED: { variant: "warn", label: "Processing" },
    SUCCESSFUL: { variant: "ok", label: "Completed" },
    FAILED: { variant: "error", label: "Failed" },
};

const RFI_STATUS_TAG: Record<string, { variant: TagVariant; label: string }> = {
    OPEN: { variant: "error", label: "Response needed" },
    RESPONSE_SUBMITTED: { variant: "warn", label: "Under review" },
    RESOLVED: { variant: "ok", label: "Resolved" },
    EXPIRED: { variant: "error", label: "Expired" },
};

export default function ForeignAccountsPage() {
    const router = useRouter();

    const { data: accounts, isPending: accountsLoading, isError: accountsError } = useFcyAccounts();
    const { data: collections } = useFcyCollections();
    const { data: conversions } = useFcyConversions();
    const { data: rfiCases } = useFcyRfiCases();

    const [activeCurrency, setActiveCurrency] = React.useState<FcyCurrency>("EUR");
    const [convertingAccount, setConvertingAccount] = React.useState<FcyAccountDto | null>(null);
    const [respondingCase, setRespondingCase] = React.useState<string | null>(null);

    const accountsByCurrency = React.useMemo(() => {
        const map = new Map<FcyCurrency, FcyAccountDto>();
        for (const account of accounts ?? []) {
            const existing = map.get(account.currency);
            if (!existing || new Date(account.createdAt) > new Date(existing.createdAt)) {
                map.set(account.currency, account);
            }
        }
        return map;
    }, [accounts]);

    const actionableRfiCases = (rfiCases ?? []).filter(
        (r) => r.status === "OPEN" || r.status === "RESPONSE_SUBMITTED",
    );

    return (
        <RequireKyc>
            <div className="mx-auto max-w-5xl pb-12 md:pb-20 space-y-6 px-6 pt-6">
                <div className="mb-2">
                    <h1 className="text-3xl font-black text-ink tracking-tight">Foreign Currency Accounts</h1>
                    <p className="mt-2 text-base font-medium text-muted">
                        Receive USD, EUR, GBP or CAD, then convert to Naira whenever you&apos;re ready.
                    </p>
                </div>

                {/* ── Action needed: open RFI cases ─────────────────────────────── */}
                {actionableRfiCases.length > 0 ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-5 space-y-4">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-red-900 dark:text-red-300">
                                    {actionableRfiCases.length === 1 ? "A collection needs more information" : `${actionableRfiCases.length} collections need more information`}
                                </h3>
                                <p className="mt-1 text-xs font-medium text-red-800 dark:text-red-400">
                                    Respond before the deadline — these are same-day, not multi-day.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {actionableRfiCases.map((rfiCase) => {
                                const overdue = new Date(rfiCase.deadlineAt).getTime() < Date.now();
                                return (
                                    <div
                                        key={rfiCase.id}
                                        className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/20 px-4 py-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-ink truncate">
                                                {rfiCase.requestedInfo || "Additional information requested"}
                                            </p>
                                            <p className={`text-xs font-semibold mt-0.5 ${overdue ? "text-red-600" : "text-amber-600"}`}>
                                                <Clock className="inline h-3 w-3 mr-1 -mt-0.5" />
                                                Deadline {formatRelativeTime(rfiCase.deadlineAt)}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={rfiCase.status === "RESPONSE_SUBMITTED" ? "quiet" : "primary"}
                                            disabled={rfiCase.status === "RESPONSE_SUBMITTED"}
                                            onClick={() => setRespondingCase(rfiCase.id)}
                                        >
                                            {rfiCase.status === "RESPONSE_SUBMITTED" ? "Submitted" : "Respond"}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {/* ── Currency tabs ──────────────────────────────────────────────── */}
                <Panel>
                    <PanelBody>
                        <Tabs value={activeCurrency} onValueChange={(v) => setActiveCurrency(v as FcyCurrency)}>
                            <TabsList className="w-full grid grid-cols-4">
                                {CURRENCIES.map((c) => (
                                    <TabsTrigger key={c.code} value={c.code}>
                                        {c.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {CURRENCIES.map((c) => (
                                <TabsContent key={c.code} value={c.code} className="pt-5">
                                    {c.note ? (
                                        <p className="mb-4 text-xs font-medium text-muted flex items-center gap-1.5">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            {c.note}
                                        </p>
                                    ) : null}

                                    {accountsLoading ? (
                                        <Skeleton className="h-40 w-full rounded-xl" />
                                    ) : accountsError ? (
                                        <EmptyState icon={AlertCircle} heading="Couldn't load your accounts" description="Please try again shortly." />
                                    ) : (
                                        <CurrencyPanel
                                            currency={c.code}
                                            account={accountsByCurrency.get(c.code) ?? null}
                                            onConvert={(account) => setConvertingAccount(account)}
                                        />
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </PanelBody>
                </Panel>

                {/* ── Recent collections ─────────────────────────────────────────── */}
                <Panel flush>
                    <PanelHeader
                        className="px-4 pt-4 sm:px-6 sm:pt-6"
                        title="Recent collections"
                        description="Money received into your foreign currency accounts"
                    />
                    <PanelBody className="px-4 pb-3 pt-1 sm:px-6 sm:pb-4">
                        {(collections ?? []).length === 0 ? (
                            <EmptyState icon={Receipt} heading="No collections yet" description="Once money arrives in an issued account, it'll show up here." className="py-8" />
                        ) : (
                            <div className="divide-y divide-border">
                                {collections!.map((collection) => {
                                    const tag = COLLECTION_STATUS_TAG[collection.status] ?? { variant: "neutral" as TagVariant, label: collection.status };
                                    return (
                                        <div key={collection.id} className="flex items-center justify-between gap-3 py-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-ink">
                                                    {formatByCurrency(collection.amount, collection.currency)}
                                                </p>
                                                <p className="text-xs text-muted mt-0.5">
                                                    {collection.payerName ?? "Unknown payer"} · {formatDate(collection.createdAt)}
                                                </p>
                                            </div>
                                            <Tag variant={tag.variant}>{tag.label}</Tag>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </PanelBody>
                </Panel>

                {/* ── Recent conversions ─────────────────────────────────────────── */}
                <Panel flush>
                    <PanelHeader
                        className="px-4 pt-4 sm:px-6 sm:pt-6"
                        title="Recent conversions"
                        description="Foreign currency converted to Naira"
                    />
                    <PanelBody className="px-4 pb-3 pt-1 sm:px-6 sm:pb-4">
                        {(conversions ?? []).length === 0 ? (
                            <EmptyState icon={ArrowRightLeft} heading="No conversions yet" description="Convert an issued account's balance to Naira and it'll show up here." className="py-8" />
                        ) : (
                            <div className="divide-y divide-border">
                                {conversions!.map((conversion) => {
                                    const tag = CONVERSION_STATUS_TAG[conversion.status] ?? { variant: "neutral" as TagVariant, label: conversion.status };
                                    return (
                                        <div key={conversion.id} className="flex items-center justify-between gap-3 py-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-ink">
                                                    {formatByCurrency(conversion.sourceAmount, conversion.sourceCurrency)}
                                                    <span className="text-muted font-medium"> → </span>
                                                    {conversion.convertedNgnAmount ? formatNaira(conversion.convertedNgnAmount) : "—"}
                                                </p>
                                                <p className="text-xs text-muted mt-0.5">{formatDate(conversion.createdAt)}</p>
                                            </div>
                                            <Tag variant={tag.variant}>{tag.label}</Tag>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </PanelBody>
                </Panel>

                <Button
                    variant="ghost"
                    className="w-full font-bold h-12 rounded-xl text-sm border-2 border-border text-ink hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    onClick={() => router.push("/transactions")}
                >
                    View Full Transaction History
                </Button>
            </div>

            <ConvertDialog account={convertingAccount} onClose={() => setConvertingAccount(null)} />
            <RespondDialog rfiCaseId={respondingCase} onClose={() => setRespondingCase(null)} />
        </RequireKyc>
    );
}

// ─── Per-currency panel ──────────────────────────────────────────────────────

function CurrencyPanel({
    currency,
    account,
    onConvert,
}: {
    currency: FcyCurrency;
    account: FcyAccountDto | null;
    onConvert: (account: FcyAccountDto) => void;
}) {
    if (!account || account.status === "DECLINED") {
        return <RequestAccountForm currency={currency} previousDecline={account?.status === "DECLINED" ? account : null} />;
    }

    if (account.status === "REQUESTED" || account.status === "APPROVED") {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 p-5 flex items-start gap-3">
                <Clock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">
                        {account.status === "REQUESTED" ? "Request submitted" : "Provisioning your account"}
                    </h4>
                    <p className="mt-1 text-sm font-medium text-amber-800 dark:text-amber-500">
                        This updates automatically once Fincra finishes setting up your {currency} account — usually within a few minutes in sandbox.
                    </p>
                </div>
            </div>
        );
    }

    // ISSUED
    return (
        <div className="space-y-5">
            <AccountDetails account={account} />
            {currency === "CAD" ? <SimulateCollection account={account} /> : null}
            <Button fullWidth variant="primary" onClick={() => onConvert(account)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Convert to Naira
            </Button>
        </div>
    );
}

function AccountDetails({ account }: { account: FcyAccountDto }) {
    return (
        <div className="rounded-xl border border-border bg-gray-50 dark:bg-white/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
                <Tag variant={ACCOUNT_STATUS_TAG[account.status].variant} dot>
                    {ACCOUNT_STATUS_TAG[account.status].label}
                </Tag>
                <span className="text-xs text-muted">Issued {formatDate(account.issuedAt ?? account.createdAt)}</span>
            </div>

            {account.interacEmail ? (
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1.5">Interac email alias</p>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-white dark:bg-gray-900 px-3 py-2.5">
                        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <Mail className="h-4 w-4 text-muted" />
                            {account.interacEmail}
                        </span>
                        <Button size="sm" variant="quiet" onClick={() => copy(account.interacEmail!, "Interac email")}>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy
                        </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                        CAD accounts have no account number — payers send an Interac e-Transfer to this alias.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted">Bank name</p>
                        <p className="font-semibold text-ink">{account.bankName ?? "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted">Account name</p>
                        <p className="font-semibold text-ink">{account.accountName ?? "—"}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-xs text-muted">Account number</p>
                        <div className="mt-1 flex items-center justify-between rounded-lg border border-border bg-white dark:bg-gray-900 px-3 py-2">
                            <span className="font-mono text-base font-bold tracking-wider text-ink">
                                {account.accountNumber ?? "—"}
                            </span>
                            {account.accountNumber ? (
                                <Button size="sm" variant="quiet" onClick={() => copy(account.accountNumber!, "Account number")}>
                                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                                    Copy
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const SIMULATE_PRESETS = [
    { amount: "5000.00", label: "₦5,000 → Success", tone: "green" as const },
    { amount: "999.00", label: "₦999 → Fails", tone: "red" as const },
    { amount: "11000.00", label: "₦11,000 → Needs info (RFI)", tone: "amber" as const },
];

function SimulateCollection({ account }: { account: FcyAccountDto }) {
    const [expanded, setExpanded] = React.useState(false);
    const { mutate: simulate, isPending } = useSimulateCadCollection();

    const handleSimulate = (amount: string) => {
        simulate(
            { fcyAccountId: account.id, amount },
            {
                onSuccess: () => toast.success("Simulated collection triggered — settling via Fincra's sandbox webhook."),
                onError: (err) => toast.error(err.message || "Simulation requires Fincra sandbox credentials to be configured."),
            },
        );
    };

    return (
        <div className="rounded-xl border border-violet-200 bg-violet-050 dark:border-violet-900/30 dark:bg-violet-900/10 overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <FlaskConical className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">Simulate a collection (sandbox)</p>
                    <p className="text-xs text-muted">Test the success / failure / RFI paths end to end</p>
                </div>
            </button>
            {expanded ? (
                <div className="px-4 pb-4 pt-1 space-y-2">
                    {SIMULATE_PRESETS.map((preset) => (
                        <Button
                            key={preset.amount}
                            fullWidth
                            variant="quiet"
                            loading={isPending}
                            onClick={() => handleSimulate(preset.amount)}
                            className="justify-between"
                        >
                            {preset.label}
                        </Button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function RequestAccountForm({
    currency,
    previousDecline,
}: {
    currency: FcyCurrency;
    previousDecline: FcyAccountDto | null;
}) {
    const defaultDocType: FcyIdentityDocumentType = currency === "USD" ? "PASSPORT" : "NATIONAL_ID";
    const [docType, setDocType] = React.useState<FcyIdentityDocumentType>(defaultDocType);
    const [docNumber, setDocNumber] = React.useState("");
    const { mutate: requestAccount, isPending } = useRequestFcyAccount();

    const handleSubmit = () => {
        if (!docNumber.trim()) {
            toast.error("Enter your identity document number.");
            return;
        }
        requestAccount(
            { currency, identityDocumentType: docType, identityDocumentNumber: docNumber.trim() },
            {
                onSuccess: () => toast.success(`${currency} account requested — this updates automatically.`),
                onError: (err) => toast.error(err.message || "Could not request this account."),
            },
        );
    };

    return (
        <div className="space-y-4">
            {previousDecline ? (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-4 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-900 dark:text-red-300">Previous request declined</p>
                        {previousDecline.declineReason ? (
                            <p className="text-xs font-medium text-red-800 dark:text-red-400 mt-0.5">{previousDecline.declineReason}</p>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <Field label="Identity document type">
                <Select value={docType} onValueChange={(v) => setDocType(v as FcyIdentityDocumentType)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {DOCUMENT_TYPES.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                                {d.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            {currency === "USD" && docType !== "PASSPORT" ? (
                <p className="text-xs font-semibold text-amber-600">A USD account requires a passport specifically.</p>
            ) : null}

            <Field label="Document number">
                <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="e.g. A1234567" />
            </Field>

            <Button fullWidth variant="primary" loading={isPending} onClick={handleSubmit}>
                <Building2 className="mr-2 h-4 w-4" />
                Request {currency} Account
            </Button>
        </div>
    );
}

// ─── Convert dialog ──────────────────────────────────────────────────────────

function ConvertDialog({ account, onClose }: { account: FcyAccountDto | null; onClose: () => void }) {
    const [amount, setAmount] = React.useState("");
    const { mutate: convert, isPending } = useInitiateFcyConversion();

    React.useEffect(() => {
        if (account) setAmount("");
    }, [account]);

    const handleConvert = () => {
        if (!account) return;
        const numeric = Number(amount);
        if (!numeric || numeric <= 0) {
            toast.error("Enter a valid amount.");
            return;
        }
        convert(
            { fcyAccountId: account.id, amount: numeric.toFixed(2) },
            {
                onSuccess: () => {
                    toast.success("Conversion started — the Naira credit lands once Fincra confirms it.");
                    onClose();
                },
                onError: (err) => toast.error(err.message || "Could not start this conversion."),
            },
        );
    };

    return (
        <Dialog open={!!account} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Convert {account?.currency} to Naira</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <Field label={`Amount (${account?.currency ?? ""})`}>
                        <Input
                            type="number"
                            min={0}
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </Field>
                    <p className="text-xs text-muted">
                        A live FX quote is generated at the moment you confirm — the amount credited to your wallet may differ slightly from a pre-quoted estimate.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="quiet" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" loading={isPending} onClick={handleConvert}>Convert</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── RFI respond dialog ──────────────────────────────────────────────────────

function RespondDialog({ rfiCaseId, onClose }: { rfiCaseId: string | null; onClose: () => void }) {
    const [note, setNote] = React.useState("");
    const { mutate: submitResponse, isPending } = useSubmitRfiResponse();

    React.useEffect(() => {
        if (rfiCaseId) setNote("");
    }, [rfiCaseId]);

    const handleSubmit = () => {
        if (!rfiCaseId) return;
        if (note.trim().length < 1) {
            toast.error("Enter a response.");
            return;
        }
        submitResponse(
            { id: rfiCaseId, note: note.trim() },
            {
                onSuccess: () => {
                    toast.success("Response submitted — this is reviewed manually and can take a while to clear.");
                    onClose();
                },
                onError: (err) => toast.error(err.message || "Could not submit this response."),
            },
        );
    };

    return (
        <Dialog open={!!rfiCaseId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Respond to information request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <Field label="Your response">
                        <textarea
                            className="flex min-h-[120px] w-full rounded-sm border border-border bg-white px-3 py-2 text-sm text-ink transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
                            placeholder="Describe the source of funds, purpose of the transfer, etc."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </Field>
                    <p className="text-xs font-medium text-amber-600 flex items-start gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        This is reviewed manually — submitting doesn&apos;t clear the case immediately.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="quiet" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" loading={isPending} onClick={handleSubmit}>Submit response</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
