"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconBuilding as Building2, IconClock as Clock, IconCopy as Copy } from "@/components/icons";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Receipt, ShieldAlert, Upload } from "lucide-react";
import { toast } from "sonner";

import { RequireKyc } from "@/components/shared/require-kyc";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";
import { Field } from "@/components/shared/field";
import { Modal } from "@/components/shared/modal";
import { Tag, type TagVariant } from "@/components/shared/tag";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { formatByCurrency } from "@/lib/format";
import { formatDate } from "@/lib/date";
import {
    useBridgeAccounts,
    useBridgeCustomer,
    useBridgeDeposits,
    useCreateBridgeCustomer,
    useRefreshBridgeCustomer,
    useRequestBridgeAccount,
} from "@/lib/queries/bridge";
import type { BridgeCurrency, BridgeVirtualAccountDto, CreateBridgeCustomerDto } from "@/lib/types/api";

const CURRENCIES: { code: BridgeCurrency; label: string }[] = [
    { code: "USD", label: "USD" },
    { code: "EUR", label: "EUR" },
    { code: "GBP", label: "GBP" },
];

function copy(value: string, label: string) {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
}

const DEPOSIT_STATUS_TAG: Record<string, { variant: TagVariant; label: string }> = {
    RECEIVED: { variant: "warn", label: "Incoming" },
    CREDITED: { variant: "ok", label: "Credited" },
};

export default function ForeignAccountsPage() {
    const router = useRouter();
    const { data: customer, isPending: customerLoading } = useBridgeCustomer();
    const { data: accounts, isPending: accountsLoading } = useBridgeAccounts();
    const { data: deposits } = useBridgeDeposits();

    const [activeCurrency, setActiveCurrency] = React.useState<BridgeCurrency>("USD");

    const accountsByCurrency = React.useMemo(() => {
        const map = new Map<BridgeCurrency, BridgeVirtualAccountDto>();
        for (const account of accounts ?? []) map.set(account.currency, account);
        return map;
    }, [accounts]);

    return (
        <RequireKyc>
            <div className="mx-auto max-w-5xl pb-12 md:pb-20 space-y-6 px-6 pt-6">
                <div className="mb-2">
                    <h1 className="text-3xl font-black text-ink tracking-tight">Foreign Accounts</h1>
                    <p className="mt-2 text-base font-medium text-muted">
                        Get paid in USD, EUR or GBP — it lands in your Naira wallet automatically.
                    </p>
                </div>

                {customerLoading ? (
                    <Skeleton className="h-64 w-full rounded-2xl" />
                ) : !customer || customer.status === "rejected" ? (
                    <OnboardingForm rejectedCustomer={customer ?? undefined} />
                ) : customer.status !== "active" ? (
                    <StatusPanel customer={customer} />
                ) : (
                    <>
                        <Panel>
                            <PanelBody>
                                <Tabs value={activeCurrency} onValueChange={(v) => setActiveCurrency(v as BridgeCurrency)}>
                                    <TabsList className="w-full grid grid-cols-3">
                                        {CURRENCIES.map((c) => (
                                            <TabsTrigger key={c.code} value={c.code}>
                                                {c.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {CURRENCIES.map((c) => (
                                        <TabsContent key={c.code} value={c.code} className="pt-5">
                                            {accountsLoading ? (
                                                <Skeleton className="h-40 w-full rounded-xl" />
                                            ) : (
                                                <CurrencyPanel currency={c.code} account={accountsByCurrency.get(c.code) ?? null} />
                                            )}
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </PanelBody>
                        </Panel>

                        <Panel flush>
                            <PanelHeader
                                className="px-4 pt-4 sm:px-6 sm:pt-6"
                                title="Recent deposits"
                                description="Money received into your foreign accounts — credited to your Naira wallet automatically"
                            />
                            <PanelBody className="px-4 pb-3 pt-1 sm:px-6 sm:pb-4">
                                {(deposits ?? []).length === 0 ? (
                                    <EmptyState icon={Receipt} heading="No deposits yet" description="Once money arrives, it'll show up here." className="py-8" />
                                ) : (
                                    <div className="divide-y divide-border">
                                        {deposits!.map((deposit) => {
                                            const tag = DEPOSIT_STATUS_TAG[deposit.status] ?? { variant: "neutral" as TagVariant, label: deposit.status };
                                            return (
                                                <div key={deposit.id} className="flex items-center justify-between gap-3 py-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-ink">
                                                            {formatByCurrency(deposit.sourceAmount, deposit.sourceCurrency)}
                                                            {deposit.ngnAmountCredited ? (
                                                                <span className="text-muted font-medium"> → ₦{Number(deposit.ngnAmountCredited).toLocaleString()}</span>
                                                            ) : null}
                                                        </p>
                                                        <p className="text-xs text-muted mt-0.5">{formatDate(deposit.createdAt)}</p>
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
                    </>
                )}
            </div>
        </RequireKyc>
    );
}

// ─── Status panel (pending verification / ToS / rejected) ──────────────────

/** `rejected` never reaches here — page.tsx routes it straight back to OnboardingForm so the user can actually correct and resubmit. */
function StatusPanel({ customer }: { customer: NonNullable<ReturnType<typeof useBridgeCustomer>["data"]> }) {
    const { mutate: refresh, isPending } = useRefreshBridgeCustomer();
    const [tosOpen, setTosOpen] = React.useState(false);

    // Bridge's hosted ToS page sends no X-Frame-Options/CSP header (confirmed
    // live), so it can be embedded directly instead of sending the user to a
    // separate tab. There's no postMessage/redirect callback from Bridge to
    // hook into, so this polls the same refresh() the manual button used —
    // just automatically, closing itself the moment Bridge confirms.
    React.useEffect(() => {
        if (!tosOpen) return;
        const interval = setInterval(() => refresh(), 4000);
        return () => clearInterval(interval);
    }, [tosOpen, refresh]);

    React.useEffect(() => {
        if (tosOpen && customer.hasAcceptedTermsOfService) {
            setTosOpen(false);
            toast.success("Terms of service accepted");
        }
    }, [tosOpen, customer.hasAcceptedTermsOfService]);

    if (!customer.hasAcceptedTermsOfService && customer.tosLink) {
        return (
            <>
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 p-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">One more step</h4>
                            <p className="mt-1 text-sm font-medium text-amber-800 dark:text-amber-500">
                                Accept the terms of service to finish setting up your foreign accounts.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="primary" onClick={() => setTosOpen(true)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Accept terms of service
                        </Button>
                        <Button variant="quiet" loading={isPending} onClick={() => refresh()}>
                            I&apos;ve completed it
                        </Button>
                    </div>
                </div>

                <Modal
                    open={tosOpen}
                    onOpenChange={setTosOpen}
                    title="Bridge terms of service"
                    description="Accept the terms below — this closes automatically once it's done."
                    size="lg"
                >
                    <div className="h-[65vh] max-h-[600px] w-full overflow-hidden rounded-lg border border-border">
                        <iframe src={customer.tosLink} title="Bridge terms of service" className="h-full w-full" />
                    </div>
                </Modal>
            </>
        );
    }

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 p-5 flex items-start gap-3">
            <Clock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Verification in progress</h4>
                <p className="mt-1 text-sm font-medium text-amber-800 dark:text-amber-500">
                    This usually resolves within a few minutes. This page updates automatically.
                </p>
            </div>
            <Button size="sm" variant="quiet" loading={isPending} onClick={() => refresh()}>
                Check now
            </Button>
        </div>
    );
}

// ─── Per-currency panel ──────────────────────────────────────────────────────

function CurrencyPanel({ currency, account }: { currency: BridgeCurrency; account: BridgeVirtualAccountDto | null }) {
    const { mutate: requestAccount, isPending } = useRequestBridgeAccount();

    if (!account) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-gray-50/60 dark:bg-white/5 p-6 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                    <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                    <p className="text-sm font-bold text-ink">No {currency} account yet</p>
                    <p className="mt-1 text-sm text-muted">
                        Get a real {currency} account number you can share with clients or employers abroad.
                    </p>
                </div>
                <Button
                    variant="primary"
                    loading={isPending}
                    onClick={() =>
                        requestAccount(
                            { currency },
                            {
                                onSuccess: () => toast.success(`${currency} account issued`),
                                onError: (err) => toast.error(err.message || `Could not issue a ${currency} account.`),
                            },
                        )
                    }
                >
                    <Building2 className="mr-2 h-4 w-4" />
                    Get {currency} Account
                </Button>
            </div>
        );
    }

    const instructions = account.sourceDepositInstructions as Record<string, unknown>;
    const fieldLabels: Record<string, string> = {
        bank_name: "Bank name",
        bank_address: "Bank address",
        bank_account_number: "Account number",
        bank_routing_number: "Routing number",
        bank_beneficiary_name: "Beneficiary name",
        bank_beneficiary_address: "Beneficiary address",
        iban: "IBAN",
        bic: "BIC / SWIFT",
        account_number: "Account number",
        sort_code: "Sort code",
    };

    const displayFields = Object.entries(instructions).filter(
        ([key, value]) => typeof value === "string" && fieldLabels[key],
    ) as [string, string][];

    return (
        <div className="rounded-xl border border-border bg-gray-50 dark:bg-white/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
                <Tag variant="ok" dot>
                    Active
                </Tag>
                <span className="text-xs text-muted">Issued {formatDate(account.createdAt)}</span>
            </div>

            {displayFields.map(([key, value]) => (
                <div key={key}>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1.5">{fieldLabels[key]}</p>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-white dark:bg-gray-900 px-3 py-2.5">
                        <span className="font-mono text-sm font-semibold text-ink truncate">{value}</span>
                        <Button size="sm" variant="quiet" onClick={() => copy(value, fieldLabels[key] ?? key)}>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy
                        </Button>
                    </div>
                </div>
            ))}

            <p className="text-xs text-muted">
                Money sent here converts automatically and lands in your Naira wallet — no extra step needed.
            </p>
        </div>
    );
}

// ─── Onboarding form ─────────────────────────────────────────────────────────

const EMPLOYMENT_STATUSES: { value: CreateBridgeCustomerDto["employmentStatus"]; label: string }[] = [
    { value: "employed", label: "Employed" },
    { value: "self_employed", label: "Self-employed" },
    { value: "unemployed", label: "Unemployed" },
    { value: "student", label: "Student" },
    { value: "retired", label: "Retired" },
    { value: "homemaker", label: "Homemaker" },
];

const EXPECTED_MONTHLY_PAYMENTS: { value: CreateBridgeCustomerDto["expectedMonthlyPaymentsUsd"]; label: string }[] = [
    { value: "0_4999", label: "$0 – $4,999" },
    { value: "5000_9999", label: "$5,000 – $9,999" },
    { value: "10000_49999", label: "$10,000 – $49,999" },
    { value: "50000_plus", label: "$50,000+" },
];

const ACCOUNT_PURPOSES: { value: CreateBridgeCustomerDto["accountPurpose"]; label: string }[] = [
    { value: "receive_salary", label: "Receive salary" },
    { value: "receive_payment_for_freelancing", label: "Receive freelance payments" },
    { value: "business_transactions", label: "Business transactions" },
    { value: "purchase_goods_and_services", label: "Purchase goods & services" },
    { value: "payments_to_friends_or_family_abroad", label: "Payments to/from family abroad" },
    { value: "personal_or_living_expenses", label: "Personal / living expenses" },
    { value: "ecommerce_retail_payments", label: "E-commerce / retail payments" },
    { value: "investment_purposes", label: "Investment purposes" },
    { value: "protect_wealth", label: "Protect wealth" },
    { value: "operating_a_company", label: "Operating a company" },
    { value: "charitable_donations", label: "Charitable donations" },
    { value: "other", label: "Other" },
];

/** "business_income" deliberately excluded — confirmed live 2026-09-04 that Bridge rejects it despite listing it as valid in their own error messages. "company_funds" is the closest working substitute for a business owner's income. */
const SOURCES_OF_FUNDS: { value: CreateBridgeCustomerDto["sourceOfFunds"]; label: string }[] = [
    { value: "salary", label: "Salary" },
    { value: "company_funds", label: "Business / company funds" },
    { value: "ecommerce_reseller", label: "E-commerce reselling" },
    { value: "savings", label: "Savings" },
    { value: "investments_loans", label: "Investments / loans" },
    { value: "pension_retirement", label: "Pension / retirement" },
    { value: "inheritance", label: "Inheritance" },
    { value: "gifts", label: "Gifts" },
    { value: "sale_of_assets_real_estate", label: "Sale of assets / real estate" },
    { value: "government_benefits", label: "Government benefits" },
    { value: "someone_elses_funds", label: "Someone else's funds" },
    { value: "gambling_proceeds", label: "Gambling proceeds" },
];

const IDENTITY_DOCUMENT_TYPES: { value: CreateBridgeCustomerDto["identityDocumentType"]; label: string }[] = [
    { value: "passport", label: "Passport" },
    { value: "national_id", label: "National ID" },
    { value: "drivers_license", label: "Driver's licence" },
];

type FormState = Omit<CreateBridgeCustomerDto, "actingAsIntermediary"> & { actingAsIntermediary: "yes" | "no" };

function emptyForm(): FormState {
    return {
        birthDate: "",
        streetLine1: "",
        city: "",
        postalCode: "",
        country: "NGA",
        employmentStatus: "employed",
        expectedMonthlyPaymentsUsd: "0_4999",
        mostRecentOccupation: "",
        accountPurpose: "receive_payment_for_freelancing",
        sourceOfFunds: "salary",
        actingAsIntermediary: "no",
        identityDocumentType: "national_id",
        identityDocumentIssuingCountry: "NGA",
        identityDocumentNumber: "",
    };
}

function DocumentPicker({ label, file, onChange }: { label: string; file: File | null; onChange: (file: File) => void }) {
    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
        <Field label={label} hint="JPEG or PNG — max 10MB">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onChange(f);
                    e.target.value = "";
                }}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-11 w-full items-center gap-2.5 rounded-sm border border-border bg-white px-3 text-sm text-ink transition-colors hover:border-violet-400"
            >
                {file ? (
                    <>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                        <span className="truncate font-medium text-ink">{file.name}</span>
                        <span className="ml-auto shrink-0 text-xs font-semibold text-violet-600">Replace</span>
                    </>
                ) : (
                    <>
                        <Upload className="h-4 w-4 shrink-0 text-muted" />
                        <span className="text-muted">Choose a file</span>
                    </>
                )}
            </button>
        </Field>
    );
}

/**
 * Bridge's rejection detail. `reason` is the generic customer-facing text
 * (almost always "Your information could not be verified" — not actionable
 * on its own); `developer_reason` is the specific one (e.g. names
 * `acting_as_intermediary` outright) — surfaced here too since this is
 * still an actively-tested flow and the generic text alone gives no way to
 * tell one rejection cause from another.
 */
function rejectionMessage(customer?: { rawPayload: Record<string, unknown> | null }): { reason: string; detail: string | null } | null {
    const reasons = customer?.rawPayload?.rejection_reasons as { reason?: string; developer_reason?: string }[] | undefined;
    const first = reasons?.[0];
    if (!first?.reason) return null;
    return { reason: first.reason, detail: first.developer_reason ?? null };
}

function OnboardingForm({ rejectedCustomer }: { rejectedCustomer?: { rawPayload: Record<string, unknown> | null } }) {
    const [form, setForm] = React.useState<FormState>(emptyForm());
    const [front, setFront] = React.useState<File | null>(null);
    const [back, setBack] = React.useState<File | null>(null);
    const { mutate: createCustomer, isPending } = useCreateBridgeCustomer();

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = () => {
        const required: (keyof FormState)[] = [
            "birthDate",
            "streetLine1",
            "city",
            "postalCode",
            "mostRecentOccupation",
            "identityDocumentNumber",
        ];
        for (const key of required) {
            if (!String(form[key] ?? "").trim()) {
                toast.error("Fill in all fields.");
                return;
            }
        }
        if (!front) {
            toast.error("Upload the front of your identity document.");
            return;
        }
        if (form.identityDocumentType !== "passport" && !back) {
            toast.error("Upload the back of your identity document.");
            return;
        }

        createCustomer(
            {
                dto: { ...form, actingAsIntermediary: form.actingAsIntermediary === "yes" },
                front,
                back: back ?? undefined,
            },
            {
                onSuccess: () => toast.success("Verification submitted — this updates automatically."),
                onError: (err) => toast.error(err.message || "Could not submit verification."),
            },
        );
    };

    const rejection = rejectionMessage(rejectedCustomer);

    return (
        <Panel>
            <PanelBody className="space-y-5">
                {rejection ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-4 flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-red-900 dark:text-red-300">Previous submission wasn&apos;t approved</p>
                            <p className="mt-0.5 text-xs font-medium text-red-800 dark:text-red-400">{rejection.reason}</p>
                            {rejection.detail ? (
                                <p className="mt-0.5 text-xs text-red-700 dark:text-red-500">{rejection.detail}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-red-700 dark:text-red-500">Correct the details below and submit again.</p>
                        </div>
                    </div>
                ) : null}

                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">Personal details</p>
                    <Field label="Date of birth">
                        <Input type="date" value={form.birthDate} onChange={(e) => update("birthDate", e.target.value)} />
                    </Field>
                    <Field label="Occupation code" hint="O*NET/SOC numeric code, e.g. 151254 for Software Developers">
                        <Input value={form.mostRecentOccupation} onChange={(e) => update("mostRecentOccupation", e.target.value)} placeholder="151254" />
                    </Field>
                    <Field label="Employment status">
                        <Select value={form.employmentStatus} onValueChange={(v) => update("employmentStatus", v as FormState["employmentStatus"])}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {EMPLOYMENT_STATUSES.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">Residential address</p>
                    <Field label="Street address">
                        <Input value={form.streetLine1} onChange={(e) => update("streetLine1", e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="City">
                            <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
                        </Field>
                        <Field label="Postal code">
                            <Input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
                        </Field>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">Account usage</p>
                    <Field label="Expected monthly payments (USD)">
                        <Select value={form.expectedMonthlyPaymentsUsd} onValueChange={(v) => update("expectedMonthlyPaymentsUsd", v as FormState["expectedMonthlyPaymentsUsd"])}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {EXPECTED_MONTHLY_PAYMENTS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Purpose of account">
                        <Select value={form.accountPurpose} onValueChange={(v) => update("accountPurpose", v as FormState["accountPurpose"])}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {ACCOUNT_PURPOSES.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Source of funds">
                        <Select value={form.sourceOfFunds} onValueChange={(v) => update("sourceOfFunds", v as FormState["sourceOfFunds"])}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {SOURCES_OF_FUNDS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Are you receiving funds on behalf of someone else?">
                        <Select value={form.actingAsIntermediary} onValueChange={(v) => update("actingAsIntermediary", v as "yes" | "no")}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no">No</SelectItem>
                                <SelectItem value="yes">Yes</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">Identity document</p>
                    <Field label="Document type">
                        <Select value={form.identityDocumentType} onValueChange={(v) => update("identityDocumentType", v as FormState["identityDocumentType"])}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {IDENTITY_DOCUMENT_TYPES.map((d) => (
                                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Document number">
                        <Input value={form.identityDocumentNumber} onChange={(e) => update("identityDocumentNumber", e.target.value)} placeholder="e.g. A1234567" />
                    </Field>
                    <DocumentPicker label={form.identityDocumentType === "passport" ? "Document scan" : "Document scan (front)"} file={front} onChange={setFront} />
                    {form.identityDocumentType !== "passport" ? (
                        <DocumentPicker label="Document scan (back)" file={back} onChange={setBack} />
                    ) : null}
                </div>

                <Button fullWidth variant="primary" loading={isPending} onClick={handleSubmit}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
                    Submit verification
                </Button>
            </PanelBody>
        </Panel>
    );
}
