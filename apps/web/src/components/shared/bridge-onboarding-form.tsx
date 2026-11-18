"use client";

/**
 * The Bridge (foreign account) KYC form — shared between the standalone
 * Foreign Accounts page (a returning user who skipped this during signup)
 * and the main KYC page (offered as an optional step right after NIN
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
import { StepProgress } from "@/components/shared/step-progress";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OccupationPicker } from "@/components/shared/occupation-picker";

import { KYC_EXCLUDED_ACCOUNT_PURPOSE, KYC_EXCLUDED_SOURCE_OF_FUNDS } from "@/lib/bridge-kyc-coherence";
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
    { value: "0_4999", label: "$0-$4,999" },
    { value: "5000_9999", label: "$5,000-$9,999" },
    { value: "10000_49999", label: "$10,000-$49,999" },
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

/**
 * employmentStatus/sourceOfFunds/accountPurpose are widened to a bare
 * `string` here (not CreateBridgeCustomerDto's own enums) so an empty
 * string is a valid, distinct "not chosen yet" state — see emptyForm's own
 * note on why none of the three now has a pre-selected default.
 */
type FormState = Omit<CreateBridgeCustomerDto, "actingAsIntermediary" | "employmentStatus" | "sourceOfFunds" | "accountPurpose"> & {
    actingAsIntermediary: "yes" | "no";
    employmentStatus: string;
    sourceOfFunds: string;
    accountPurpose: string;
};

/**
 * Nothing pre-selected for employmentStatus/sourceOfFunds/accountPurpose —
 * the fix for a real Bridge compliance request (2026-11-17): the form used
 * to default to employed/salary/receive_payment_for_freelancing, and a user
 * who only changed employmentStatus (to self_employed, say) left the other
 * two sitting on a now-contradictory default they never consciously chose.
 * Forcing an explicit choice for all three, filtered by employmentStatus
 * (see the Select options below), is what actually closes that gap — see
 * src/lib/bridge-kyc-coherence.ts.
 */
function emptyForm(): FormState {
    return {
        birthDate: "",
        streetLine1: "",
        city: "",
        postalCode: "",
        country: "NGA",
        employmentStatus: "",
        expectedMonthlyPaymentsUsd: "0_4999",
        mostRecentOccupation: "",
        accountPurpose: "",
        sourceOfFunds: "",
        actingAsIntermediary: "no",
        identityDocumentType: "national_id",
        identityDocumentIssuingCountry: "NGA",
        identityDocumentNumber: "",
    };
}

function DocumentPicker({ label, file, onChange }: { label: string; file: File | null; onChange: (file: File) => void }) {
    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
        <Field label={label} hint="JPEG or PNG, max 10MB">
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
export function rejectionMessage(customer?: { rejectionReasons: { reason: string; developerReason: string | null }[] | null }): { reason: string; detail: string | null } | null {
    const first = customer?.rejectionReasons?.[0];
    if (!first?.reason) return null;
    return { reason: first.reason, detail: first.developerReason ?? null };
}

type Step = "about" | "address" | "usage" | "identity" | "review";
const STEP_ORDER: Step[] = ["about", "address", "usage", "identity", "review"];
const STEP_LABELS: Record<Step, string> = {
    about: "About you",
    address: "Where you live",
    usage: "How you'll use this account",
    identity: "Verify your identity",
    review: "Review",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isAboutValid(form: FormState): boolean {
    return !!form.employmentStatus && !!form.mostRecentOccupation.trim() && DATE_RE.test(form.birthDate);
}
function isAddressValid(form: FormState): boolean {
    return !!form.streetLine1.trim() && !!form.city.trim() && !!form.postalCode.trim();
}
function isUsageValid(form: FormState): boolean {
    return (
        !!form.sourceOfFunds &&
        !!form.accountPurpose &&
        !KYC_EXCLUDED_SOURCE_OF_FUNDS[form.employmentStatus]?.includes(form.sourceOfFunds) &&
        !KYC_EXCLUDED_ACCOUNT_PURPOSE[form.employmentStatus]?.includes(form.accountPurpose)
    );
}
function isIdentityValid(form: FormState, front: File | null, back: File | null): boolean {
    if (!form.identityDocumentNumber.trim() || !front) return false;
    return form.identityDocumentType !== "passport" ? !!back : true;
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-border py-3">
            <div>
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{value || "Not set"}</p>
            </div>
            <button type="button" onClick={onEdit} className="shrink-0 text-xs font-bold text-violet-600 hover:underline">
                Edit
            </button>
        </div>
    );
}

export function BridgeOnboardingForm({
    rejectedCustomer,
    onSubmitted,
    bare = false,
}: {
    rejectedCustomer?: { rejectionReasons: { reason: string; developerReason: string | null }[] | null };
    /** Called once the submission succeeds — e.g. to advance to the next step of a wizard. Doesn't wait for Bridge's actual review outcome, just that the request went through. */
    onSubmitted?: () => void;
    /** Skip the wrapping Panel — used when a parent (like the KYC step card) already provides one. */
    bare?: boolean;
}) {
    const [form, setForm] = React.useState<FormState>(emptyForm());
    const [front, setFront] = React.useState<File | null>(null);
    const [back, setBack] = React.useState<File | null>(null);
    const [step, setStep] = React.useState<Step>("about");
    const { mutate: createCustomer, isPending } = useCreateBridgeCustomer();

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

    /**
     * Changing employmentStatus re-filters which sourceOfFunds/accountPurpose
     * options are even offered (see the Select options below) — if either
     * already-selected value is no longer in that filtered list, it's
     * cleared rather than silently left sitting on a now-contradictory
     * choice. This is the actual fix for the real case: a form that instead
     * left stale values in place after a status change is exactly what
     * produced self_employed + salary.
     */
    const updateEmploymentStatus = (employmentStatus: string) => {
        setForm((f) => ({
            ...f,
            employmentStatus,
            sourceOfFunds: KYC_EXCLUDED_SOURCE_OF_FUNDS[employmentStatus]?.includes(f.sourceOfFunds) ? "" : f.sourceOfFunds,
            accountPurpose: KYC_EXCLUDED_ACCOUNT_PURPOSE[employmentStatus]?.includes(f.accountPurpose) ? "" : f.accountPurpose,
        }));
    };

    const availableSourcesOfFunds = SOURCES_OF_FUNDS.filter((s) => !KYC_EXCLUDED_SOURCE_OF_FUNDS[form.employmentStatus]?.includes(s.value));
    const availableAccountPurposes = ACCOUNT_PURPOSES.filter((p) => !KYC_EXCLUDED_ACCOUNT_PURPOSE[form.employmentStatus]?.includes(p.value));

    const stepIndex = STEP_ORDER.indexOf(step);
    const goTo = (s: Step) => setStep(s);
    const goNext = () => setStep(STEP_ORDER[stepIndex + 1]!);
    const goBack = () => setStep(STEP_ORDER[stepIndex - 1]!);

    const aboutValid = isAboutValid(form);
    const addressValid = isAddressValid(form);
    const usageValid = isUsageValid(form);
    const identityValid = isIdentityValid(form, front, back);
    const allValid = aboutValid && addressValid && usageValid && identityValid;

    const handleSubmit = () => {
        // Belt-and-suspenders only at this point — every field required to
        // get here was already gated per-step.
        if (!allValid || !front) {
            toast.error("Go back and finish every step first.");
            return;
        }

        createCustomer(
            {
                dto: {
                    ...form,
                    employmentStatus: form.employmentStatus as CreateBridgeCustomerDto["employmentStatus"],
                    sourceOfFunds: form.sourceOfFunds as CreateBridgeCustomerDto["sourceOfFunds"],
                    accountPurpose: form.accountPurpose as CreateBridgeCustomerDto["accountPurpose"],
                    actingAsIntermediary: form.actingAsIntermediary === "yes",
                },
                front,
                back: back ?? undefined,
            },
            {
                onSuccess: () => {
                    toast.success("Verification submitted. This updates automatically.");
                    onSubmitted?.();
                },
                onError: (err) => toast.error(err.message || "Could not submit verification."),
            },
        );
    };

    const rejection = rejectionMessage(rejectedCustomer);
    const employmentLabel = EMPLOYMENT_STATUSES.find((s) => s.value === form.employmentStatus)?.label ?? "";
    const accountPurposeLabel = ACCOUNT_PURPOSES.find((p) => p.value === form.accountPurpose)?.label ?? "";
    const sourceOfFundsLabel = SOURCES_OF_FUNDS.find((s) => s.value === form.sourceOfFunds)?.label ?? "";
    const documentTypeLabel = IDENTITY_DOCUMENT_TYPES.find((d) => d.value === form.identityDocumentType)?.label ?? "";

    const nextDisabled =
        (step === "about" && !aboutValid) ||
        (step === "address" && !addressValid) ||
        (step === "usage" && !usageValid) ||
        (step === "identity" && !identityValid);

    const content = (
        <div className="space-y-5">
            <StepProgress current={stepIndex + 1} total={STEP_ORDER.length} label={STEP_LABELS[step]} />

            {step === "about" && rejection ? (
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

            <div key={step} className="animate-in fade-in slide-in-from-right-2 duration-200 space-y-3">
                {step === "about" ? (
                    <>
                        <p className="text-lg font-bold text-ink">About you</p>
                        <Field label="Date of birth">
                            <DatePickerField value={form.birthDate} onChange={(v) => update("birthDate", v)} placeholder="Select date of birth" />
                        </Field>
                        <Field label="Occupation">
                            <OccupationPicker value={form.mostRecentOccupation} onChange={(code) => update("mostRecentOccupation", code)} />
                        </Field>
                        <Field label="Employment status">
                            <Select value={form.employmentStatus} onValueChange={updateEmploymentStatus}>
                                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                                <SelectContent>
                                    {EMPLOYMENT_STATUSES.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </>
                ) : step === "address" ? (
                    <>
                        <p className="text-lg font-bold text-ink">Where you live</p>
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
                    </>
                ) : step === "usage" ? (
                    <>
                        <p className="text-lg font-bold text-ink">How you&apos;ll use this account</p>
                        <p className="text-sm text-muted">
                            These answers need to line up with each other. Picking your employment status narrowed the options below down automatically, so whatever you pick here will always make sense together.
                        </p>
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
                            <Select value={form.accountPurpose} onValueChange={(v) => update("accountPurpose", v)}>
                                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                                <SelectContent>
                                    {availableAccountPurposes.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Source of funds">
                            <Select value={form.sourceOfFunds} onValueChange={(v) => update("sourceOfFunds", v)}>
                                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                                <SelectContent>
                                    {availableSourcesOfFunds.map((s) => (
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
                    </>
                ) : step === "identity" ? (
                    <>
                        <p className="text-lg font-bold text-ink">Verify your identity</p>
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
                    </>
                ) : (
                    <>
                        <p className="text-lg font-bold text-ink">Review</p>
                        <p className="text-sm text-muted">Everything below is what gets sent for verification. Tap Edit on anything that&apos;s wrong before you submit.</p>
                        <ReviewRow label="Date of birth" value={form.birthDate} onEdit={() => goTo("about")} />
                        <ReviewRow label="Employment status" value={employmentLabel} onEdit={() => goTo("about")} />
                        <ReviewRow label="Street address" value={form.streetLine1} onEdit={() => goTo("address")} />
                        <ReviewRow label="City / postal code" value={`${form.city}, ${form.postalCode}`} onEdit={() => goTo("address")} />
                        <ReviewRow label="Purpose of account" value={accountPurposeLabel} onEdit={() => goTo("usage")} />
                        <ReviewRow label="Source of funds" value={sourceOfFundsLabel} onEdit={() => goTo("usage")} />
                        <ReviewRow
                            label="Receiving on someone else's behalf"
                            value={form.actingAsIntermediary === "yes" ? "Yes" : "No"}
                            onEdit={() => goTo("usage")}
                        />
                        <ReviewRow label="Document type" value={documentTypeLabel} onEdit={() => goTo("identity")} />
                        <ReviewRow label="Document number" value={form.identityDocumentNumber} onEdit={() => goTo("identity")} />
                    </>
                )}
            </div>

            <div className="flex w-full flex-col gap-2 pt-1 sm:flex-row-reverse sm:gap-3">
                {step === "review" ? (
                    <Button fullWidth variant="primary" loading={isPending} onClick={handleSubmit}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
                        Submit verification
                    </Button>
                ) : (
                    <Button fullWidth variant="primary" disabled={nextDisabled} onClick={goNext}>
                        Continue
                    </Button>
                )}

                {stepIndex > 0 ? (
                    <Button fullWidth variant="ghost" onClick={goBack}>
                        Back
                    </Button>
                ) : null}
            </div>
        </div>
    );

    if (bare) return content;

    return (
        <Panel>
            <PanelBody>{content}</PanelBody>
        </Panel>
    );
}
