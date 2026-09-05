"use client";

/**
 * The Bridge (foreign account) KYC form — shared between the standalone
 * Foreign Accounts page (a returning user who skipped this during signup)
 * and the main KYC page (offered as an optional step right after BVN
 * approval, so a new user can do everything in one visit). Extracted here
 * specifically so neither page duplicates the field list/validation.
 */

import * as React from "react";
import { IconBuilding as Building2 } from "@/components/icons";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OccupationPicker } from "@/components/shared/occupation-picker";

import { useCreateBridgeCustomer } from "@/lib/queries/bridge";
import type { CreateBridgeCustomerDto } from "@/lib/types/api";

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
export function rejectionMessage(customer?: { rawPayload: Record<string, unknown> | null }): { reason: string; detail: string | null } | null {
    const reasons = customer?.rawPayload?.rejection_reasons as { reason?: string; developer_reason?: string }[] | undefined;
    const first = reasons?.[0];
    if (!first?.reason) return null;
    return { reason: first.reason, detail: first.developer_reason ?? null };
}

export function BridgeOnboardingForm({
    rejectedCustomer,
    onSubmitted,
    bare = false,
}: {
    rejectedCustomer?: { rawPayload: Record<string, unknown> | null };
    /** Called once the submission succeeds — e.g. to advance to the next step of a wizard. Doesn't wait for Bridge's actual review outcome, just that the request went through. */
    onSubmitted?: () => void;
    /** Skip the wrapping Panel — used when a parent (like the KYC step card) already provides one. */
    bare?: boolean;
}) {
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
                onSuccess: () => {
                    toast.success("Verification submitted — this updates automatically.");
                    onSubmitted?.();
                },
                onError: (err) => toast.error(err.message || "Could not submit verification."),
            },
        );
    };

    const rejection = rejectionMessage(rejectedCustomer);

    const content = (
        <div className="space-y-5">
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
                <Field label="Occupation">
                    <OccupationPicker value={form.mostRecentOccupation} onChange={(code) => update("mostRecentOccupation", code)} />
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
        </div>
    );

    if (bare) return content;

    return (
        <Panel>
            <PanelBody>{content}</PanelBody>
        </Panel>
    );
}
