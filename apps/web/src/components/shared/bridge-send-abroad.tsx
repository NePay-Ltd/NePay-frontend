"use client";

/**
 * Recipients + payout history for sending money abroad. The actual send
 * form (amount entry, quote, PIN, submit) moved into /transfer's "Abroad"
 * tab (2026-11-17) so sending Naira and sending abroad share one page; this
 * component is now reference/management only — view and add recipients,
 * edit a USD address, see payout history. Tapping a recipient (or the
 * "Send money abroad" button) hands off to /transfer with that recipient
 * pre-selected.
 *
 * Native entry (2026-11-16): the customer enters the amount directly in the
 * recipient's own currency (USD/EUR/GBP/MXN/COP), priced by the backend's
 * Rate Book. A separate, live, non-margin reference rate is used server-side
 * only to tell Bridge how much USD-equivalent to move — never shown here.
 *
 * Every payout is queued for an admin to approve (treasury-liquidity check)
 * before Bridge is ever called — see PAYOUT_STATUS_TAG's PENDING_APPROVAL
 * entry. Deliberately invisible to the customer: SendForm's copy only ever
 * says the payout is "on its way", never that anyone is reviewing it, and
 * never that it has actually reached the recipient's bank yet.
 *
 * Gated behind the server's own `bridge.payoutsEnabled` flag — every call
 * here 404s/503s until that's flipped on, which only happens once Bridge
 * has confirmed the open questions from the 2026-11-11 research pass.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconBuilding as Building2 } from "@/components/icons";
import { ChevronRight, Loader2, Plus, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/shared/button";
import { Field } from "@/components/shared/field";
import { Modal } from "@/components/shared/modal";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";
import { Tag, type TagVariant } from "@/components/shared/tag";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/receipt-config";
import { useWalletBalance } from "@/lib/queries/wallet";
import {
    useBridgeExternalAccounts,
    useBridgePayoutQuote,
    useBridgePayouts,
    useCreateBridgeExternalAccount,
    useInitiateBridgePayout,
    useUpdateBridgeExternalAccountAddress,
} from "@/lib/queries/bridge";
import type {
    BridgeExternalAccountDto,
    BridgePayoutCurrency,
    BridgePayoutStatus,
    BridgeUsdPayoutRail,
    CreateBridgeExternalAccountDto,
    UpdateBridgeExternalAccountAddressDto,
} from "@/lib/types/api";

/** Condition copy per USD rail — confirmed against Bridge's own docs 2026-11-14, mirrors the backend's BRIDGE_USD_RAIL_INFO exactly. Not offered for any other currency — see that constant's own note on why. Exported: the /transfer page's abroad tab needs this for its own rail picker. */
export const USD_RAIL_INFO: Record<BridgeUsdPayoutRail, { label: string; timing: string; note: string }> = {
    ach: { label: "Standard (ACH)", timing: "Usually 1–2 business days", note: "The default, lowest-cost option." },
    ach_same_day: {
        label: "Same Day ACH",
        timing: "Usually arrives the same business day",
        note: "Only if sent before the daily cutoff. Falls back to standard ACH automatically if the recipient's bank doesn't support same-day.",
    },
    wire: {
        label: "Wire",
        timing: "Usually within about 2 hours",
        note: "Fastest option, but not every bank can receive a wire — we'll tell you if this recipient's bank can't.",
    },
    fednow: {
        label: "FedNow",
        timing: "Usually within about 20 seconds",
        note: "The fastest option, available for this recipient's bank.",
    },
};

/** Only the 6 of 11 accepted document_type values Bridge actually documents — see the backend's COP_DOCUMENT_TYPES own note on why the rest aren't offered here. */
const COP_DOCUMENT_TYPE_LABELS: Record<string, string> = {
    cc: "Cédula de Ciudadanía",
    ce: "Cédula de Extranjería",
    nit: "NIT (tax ID)",
    rut: "RUT (worker registration)",
    pa: "Passport",
    ppt: "Permiso de Protección Temporal",
};

/** Every currency Bridge approves for payouts — wider than what NePay receives in (USD/EUR only). See BridgePayoutCurrency's own note. */
const SEND_CURRENCIES: { code: BridgePayoutCurrency; label: string }[] = [
    { code: "USD", label: "USD" },
    { code: "EUR", label: "EUR" },
    { code: "GBP", label: "GBP" },
    { code: "MXN", label: "MXN (Mexican Peso)" },
    { code: "COP", label: "COP (Colombian Peso)" },
];

/** Readable label for a payout's rail in history — USD_RAIL_INFO's label where it's a USD rail, else just the raw Bridge string humanized (e.g. "faster_payments" → "Faster payments"). */
function railLabel(rail: string): string {
    const usd = USD_RAIL_INFO[rail as BridgeUsdPayoutRail];
    if (usd) return usd.label;
    return rail.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

const PAYOUT_STATUS_TAG: Record<BridgePayoutStatus, { variant: TagVariant; label: string }> = {
    PENDING_APPROVAL: { variant: "neutral", label: "Processing" },
    PROCESSING: { variant: "neutral", label: "Processing" },
    COMPLETED: { variant: "ok", label: "Completed" },
    FAILED: { variant: "error", label: "Failed, refunded" },
    REJECTED: { variant: "error", label: "Declined" },
};

type RecipientForm = Omit<CreateBridgeExternalAccountDto, "isSelf"> & { isSelf: "yes" | "no" };

function emptyRecipientForm(): RecipientForm {
    return {
        currency: "USD",
        accountOwnerName: "",
        accountOwnerType: "individual",
        isSelf: "no",
    };
}

export function SendAbroadContent() {
    const router = useRouter();
    const { data: recipients, isPending: recipientsLoading } = useBridgeExternalAccounts();
    const { data: payouts } = useBridgePayouts();
    const [addOpen, setAddOpen] = React.useState(false);
    const [editAddressId, setEditAddressId] = React.useState<string | null>(null);

    const editingRecipient = recipients?.find((r) => r.id === editAddressId) ?? null;

    const sendTo = (externalAccountId?: string) =>
        router.push(externalAccountId ? `/transfer?tab=abroad&external=${externalAccountId}` : "/transfer?tab=abroad");

    return (
        <div className="space-y-6">
            <Button fullWidth variant="primary" onClick={() => sendTo()}>
                <Send className="mr-2 h-4 w-4" />
                Send money abroad
            </Button>

            <Panel>
                <PanelHeader
                    title="Recipients"
                    description="Bank accounts you can send money to. Registered once, reused for every send"
                    action={
                        <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Add recipient
                        </Button>
                    }
                />
                <PanelBody>
                    {recipientsLoading ? (
                        <Skeleton className="h-16 w-full rounded-xl" />
                    ) : !recipients || recipients.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            heading="No recipients yet"
                            description="Add the bank details of whoever you want to send money to."
                            className="py-8"
                        />
                    ) : (
                        <div className="space-y-2">
                            {recipients.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex w-full items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5 transition-colors hover:border-violet-300 dark:bg-gray-900"
                                >
                                    <button type="button" onClick={() => sendTo(r.id)} className="flex-1 text-left">
                                        <p className="text-sm font-bold text-ink">{r.accountOwnerName}</p>
                                        <p className="text-xs text-muted">
                                            {r.currency} account ending •••• {r.last4}
                                            {r.isSelf ? " · Your own account" : ""}
                                        </p>
                                    </button>
                                    {r.currency === "USD" ? (
                                        <button
                                            type="button"
                                            onClick={() => setEditAddressId(r.id)}
                                            className="shrink-0 px-2 text-xs font-semibold text-violet-600 hover:underline"
                                        >
                                            Edit address
                                        </button>
                                    ) : null}
                                    <button type="button" onClick={() => sendTo(r.id)} className="shrink-0 pl-2" aria-label={`Send to ${r.accountOwnerName}`}>
                                        <ChevronRight className="h-4 w-4 text-violet-600" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </PanelBody>
            </Panel>

            <Panel flush>
                <PanelHeader
                    className="px-4 pt-4 sm:px-6 sm:pt-6"
                    title="Payout history"
                    description="Money you've sent abroad"
                />
                <PanelBody className="px-4 pb-3 pt-1 sm:px-6 sm:pb-4">
                    {(payouts ?? []).length === 0 ? (
                        <EmptyState icon={Send} heading="No payouts yet" description="Once you send money, it'll show up here." className="py-8" />
                    ) : (
                        <div className="divide-y divide-border">
                            {payouts!.map((payout) => {
                                const tag = PAYOUT_STATUS_TAG[payout.status];
                                return (
                                    <div key={payout.id} className="flex items-center justify-between gap-3 py-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-ink">
                                                {payout.sourceAmount} {payout.sourceCurrency}
                                                <span className="text-muted font-medium"> · {formatMoney(payout.ngnAmount, "NGN")}</span>
                                            </p>
                                            <p className="text-xs text-muted mt-0.5">
                                                {formatDate(payout.createdAt)} · {railLabel(payout.rail)}
                                                {payout.failureReason ? <> · {payout.failureReason}</> : null}
                                                {payout.decisionNote ? <> · {payout.decisionNote}</> : null}
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

            <AddRecipientModal open={addOpen} onOpenChange={setAddOpen} onCreated={(id) => sendTo(id)} />
            <EditAddressModal
                recipient={editingRecipient}
                onOpenChange={(open) => !open && setEditAddressId(null)}
            />
        </div>
    );
}

// ─── Edit a USD recipient's address ──────────────────────────────────────────

/** Fixes a too-long (over 35 characters) or otherwise wrong address on an already-registered USD recipient, instead of trying to re-register it — Bridge dedupes a second create against the same account/routing number. */
function EditAddressModal({
    recipient,
    onOpenChange,
}: {
    recipient: BridgeExternalAccountDto | null;
    onOpenChange: (open: boolean) => void;
}) {
    const [form, setForm] = React.useState<UpdateBridgeExternalAccountAddressDto>({
        streetLine1: "",
        streetLine2: "",
        city: "",
        state: "",
        postalCode: "",
    });
    const { mutate: updateAddress, isPending } = useUpdateBridgeExternalAccountAddress();

    React.useEffect(() => {
        if (recipient) {
            setForm({ streetLine1: "", streetLine2: "", city: "", state: "", postalCode: "" });
        }
    }, [recipient?.id]);

    const update = <K extends keyof UpdateBridgeExternalAccountAddressDto>(key: K, value: UpdateBridgeExternalAccountAddressDto[K]) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = () => {
        if (!form.streetLine1.trim() || !form.city.trim() || !form.state.trim() || !form.postalCode.trim()) {
            toast.error("Fill in street address, city, state, and ZIP code.");
            return;
        }
        if (!recipient) return;

        updateAddress(
            { id: recipient.id, dto: form },
            {
                onSuccess: () => {
                    toast.success("Address updated.");
                    onOpenChange(false);
                },
                onError: (err: any) => toast.error(err.response?.data?.message || err.message || "Could not update this address."),
            },
        );
    };

    return (
        <Modal
            open={!!recipient}
            onOpenChange={onOpenChange}
            title={`Edit ${recipient?.accountOwnerName ?? ""}'s address`}
            description="Fixes a rejected or too-long address without needing to re-add this recipient"
            footer={
                <Button fullWidth variant="primary" loading={isPending} onClick={handleSubmit}>
                    Save address
                </Button>
            }
        >
            <div className="space-y-3">
                <Field label="Street address" hint="35 characters max">
                    <Input value={form.streetLine1} onChange={(e) => update("streetLine1", e.target.value)} maxLength={35} />
                </Field>
                <Field label="Street address line 2" hint="Optional — apartment/suite, 35 characters max">
                    <Input value={form.streetLine2 ?? ""} onChange={(e) => update("streetLine2", e.target.value)} maxLength={35} />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                    <Field label="City">
                        <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
                    </Field>
                    <Field label="State">
                        <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="e.g. NY" />
                    </Field>
                    <Field label="ZIP code">
                        <Input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
                    </Field>
                </div>
            </div>
        </Modal>
    );
}

// ─── Add recipient ──────────────────────────────────────────────────────────

/** Exported: /transfer's abroad tab reuses this exact form to add a recipient inline, rather than duplicating the per-currency field logic. */
export function AddRecipientModal({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (externalAccountId: string) => void;
}) {
    const [form, setForm] = React.useState<RecipientForm>(emptyRecipientForm());
    const { mutate: create, isPending } = useCreateBridgeExternalAccount();

    const update = <K extends keyof RecipientForm>(key: K, value: RecipientForm[K]) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = () => {
        if (!form.accountOwnerName.trim()) {
            toast.error("Enter the account owner's name.");
            return;
        }

        const requiredByCurrency: Record<Exclude<BridgePayoutCurrency, "COP">, (keyof RecipientForm)[]> = {
            USD: ["usAccountNumber", "usRoutingNumber", "usStreetLine1", "usCity", "usState", "usPostalCode"],
            EUR: ["iban", "ibanCountry"],
            GBP: ["gbAccountNumber", "gbSortCode"],
            MXN: ["mxnClabe"],
        };
        const required: (keyof RecipientForm)[] =
            form.currency === "COP"
                ? form.copMethod === "bank_transfer"
                    ? ["copAccountNumber", "copBankCode", "copAccountType", "copDocumentType", "copDocumentNumber", "copPhoneNumber"]
                    : ["copBreBKey"]
                : requiredByCurrency[form.currency];

        for (const key of required) {
            if (!String(form[key] ?? "").trim()) {
                toast.error("Fill in all fields for this currency.");
                return;
            }
        }

        create(
            { ...form, isSelf: form.isSelf === "yes", ...(form.currency === "COP" ? { copMethod: form.copMethod ?? "bre_b" } : {}) },
            {
                onSuccess: (account) => {
                    toast.success("Recipient added.");
                    setForm(emptyRecipientForm());
                    onOpenChange(false);
                    onCreated(account.id);
                },
                onError: (err) => toast.error(err.message || "Could not add this recipient."),
            },
        );
    };

    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Add a recipient"
            description="Their bank details — used only to send them money, never shown to anyone else"
            footer={
                <Button fullWidth variant="primary" loading={isPending} onClick={handleSubmit}>
                    Add recipient
                </Button>
            }
        >
            <div className="space-y-4">
                <Field label="Currency">
                    <Select value={form.currency} onValueChange={(v) => update("currency", v as BridgePayoutCurrency)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SEND_CURRENCIES.map((c) => (
                                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Account owner's full name">
                    <Input value={form.accountOwnerName} onChange={(e) => update("accountOwnerName", e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Account type">
                        <Select value={form.accountOwnerType} onValueChange={(v) => update("accountOwnerType", v as RecipientForm["accountOwnerType"])}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="individual">Individual</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Is this your own account?">
                        <Select value={form.isSelf} onValueChange={(v) => update("isSelf", v as "yes" | "no")}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no">No</SelectItem>
                                <SelectItem value="yes">Yes</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>

                {form.currency === "USD" && (
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted">Bank details (USD)</p>
                        <Field label="Account number">
                            <Input value={form.usAccountNumber ?? ""} onChange={(e) => update("usAccountNumber", e.target.value)} />
                        </Field>
                        <Field label="Routing number" hint="9 digits">
                            <Input value={form.usRoutingNumber ?? ""} onChange={(e) => update("usRoutingNumber", e.target.value)} maxLength={9} />
                        </Field>
                        <Field label="Street address" hint="35 characters max">
                            <Input value={form.usStreetLine1 ?? ""} onChange={(e) => update("usStreetLine1", e.target.value)} maxLength={35} />
                        </Field>
                        <Field label="Street address line 2" hint="Optional — apartment/suite, 35 characters max">
                            <Input value={form.usStreetLine2 ?? ""} onChange={(e) => update("usStreetLine2", e.target.value)} maxLength={35} />
                        </Field>
                        <div className="grid grid-cols-3 gap-3">
                            <Field label="City">
                                <Input value={form.usCity ?? ""} onChange={(e) => update("usCity", e.target.value)} />
                            </Field>
                            <Field label="State">
                                <Input value={form.usState ?? ""} onChange={(e) => update("usState", e.target.value)} placeholder="e.g. NY" />
                            </Field>
                            <Field label="ZIP code">
                                <Input value={form.usPostalCode ?? ""} onChange={(e) => update("usPostalCode", e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Bank name" hint="Optional — only needed if we can't detect it automatically from the routing number">
                            <Input value={form.usBankName ?? ""} onChange={(e) => update("usBankName", e.target.value)} />
                        </Field>
                    </div>
                )}

                {form.currency === "EUR" && (
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted">Bank details (EUR)</p>
                        <Field label="IBAN">
                            <Input value={form.iban ?? ""} onChange={(e) => update("iban", e.target.value.toUpperCase())} />
                        </Field>
                        <Field label="IBAN country" hint="ISO 3-letter code, e.g. IRL, DEU, FRA">
                            <Input value={form.ibanCountry ?? ""} onChange={(e) => update("ibanCountry", e.target.value.toUpperCase())} maxLength={3} />
                        </Field>
                        <Field label="BIC / SWIFT" hint="Optional — may improve delivery">
                            <Input value={form.bic ?? ""} onChange={(e) => update("bic", e.target.value.toUpperCase())} />
                        </Field>
                    </div>
                )}

                {form.currency === "GBP" && (
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted">Bank details (GBP)</p>
                        <Field label="Account number" hint="8 digits">
                            <Input value={form.gbAccountNumber ?? ""} onChange={(e) => update("gbAccountNumber", e.target.value)} maxLength={8} />
                        </Field>
                        <Field label="Sort code" hint="6 digits, no hyphens">
                            <Input value={form.gbSortCode ?? ""} onChange={(e) => update("gbSortCode", e.target.value)} maxLength={6} />
                        </Field>
                    </div>
                )}

                {form.currency === "MXN" && (
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted">Bank details (MXN)</p>
                        <Field label="CLABE" hint="18 digits">
                            <Input value={form.mxnClabe ?? ""} onChange={(e) => update("mxnClabe", e.target.value)} maxLength={18} />
                        </Field>
                    </div>
                )}

                {form.currency === "COP" && (
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted">Bank details (COP)</p>
                        <Field label="Method" hint="Bre-B needs only a key; Bank Transfer needs full account details but reaches recipients Bre-B can't">
                            <Select value={form.copMethod ?? "bre_b"} onValueChange={(v) => update("copMethod", v as "bre_b" | "bank_transfer")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bre_b">Bre-B</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>

                        {(form.copMethod ?? "bre_b") === "bre_b" ? (
                            <Field label="Bre-B key">
                                <Input value={form.copBreBKey ?? ""} onChange={(e) => update("copBreBKey", e.target.value)} />
                            </Field>
                        ) : (
                            <>
                                <Field label="Account number">
                                    <Input value={form.copAccountNumber ?? ""} onChange={(e) => update("copAccountNumber", e.target.value)} />
                                </Field>
                                <Field label="Bank code">
                                    <Input value={form.copBankCode ?? ""} onChange={(e) => update("copBankCode", e.target.value)} />
                                </Field>
                                <Field label="Account type">
                                    <Select value={form.copAccountType ?? ""} onValueChange={(v) => update("copAccountType", v as "checking" | "savings" | "electronic_deposit")}>
                                        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="checking">Checking</SelectItem>
                                            <SelectItem value="savings">Savings</SelectItem>
                                            <SelectItem value="electronic_deposit">Electronic deposit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Document type">
                                    <Select value={form.copDocumentType ?? ""} onValueChange={(v) => update("copDocumentType", v as RecipientForm["copDocumentType"])}>
                                        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(COP_DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Document number" hint="Digits only">
                                    <Input value={form.copDocumentNumber ?? ""} onChange={(e) => update("copDocumentNumber", e.target.value.replace(/\D/g, ""))} />
                                </Field>
                                <Field label="Phone number" hint="E.164 format, e.g. +573001234567">
                                    <Input value={form.copPhoneNumber ?? ""} onChange={(e) => update("copPhoneNumber", e.target.value)} />
                                </Field>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

// ─── Send form ──────────────────────────────────────────────────────────────

/** Native-entry symbol per currency — MXN/COP show their code instead, since "$" alone would be ambiguous against USD. Exported: /transfer's abroad tab needs this too. */
export const CURRENCY_SYMBOL: Record<BridgePayoutCurrency, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    MXN: "MXN ",
    COP: "COP ",
};

/** Exported: /transfer's abroad tab mounts this directly once a recipient is chosen. */
export function SendForm({ recipient, onSent }: { recipient: BridgeExternalAccountDto; onSent: () => void }) {
    const [amount, setAmount] = React.useState("");
    const [rail, setRail] = React.useState<BridgeUsdPayoutRail>("ach");
    const [modalOpen, setModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("confirm");
    const { data: quote, isFetching: quoteLoading } = useBridgePayoutQuote(recipient.currency, amount);
    const { data: wallet } = useWalletBalance();
    const sendPayout = useInitiateBridgePayout();

    const ngnLabel = quote?.totalNgn ? formatMoney(quote.totalNgn, "NGN") : null;
    const isUsd = recipient.currency === "USD";
    const symbol = CURRENCY_SYMBOL[recipient.currency];
    const availableRails = (Object.keys(USD_RAIL_INFO) as BridgeUsdPayoutRail[]).filter((r) => r !== "fednow" || recipient.fedNowSupported);
    const availableNgn = wallet ? Number(wallet.availableBalance) : null;
    const insufficientFunds = quote?.totalNgn != null && availableNgn != null && Number(quote.totalNgn) > availableNgn;
    const belowMin = quote?.minSendAmount != null && Number(amount) < Number(quote.minSendAmount);
    const aboveMax = quote?.maxSendAmount != null && Number(amount) > Number(quote.maxSendAmount);
    const outsideLimits = belowMin || aboveMax;

    const handlePinSubmit = (pin: string) => {
        setTxState("processing");
        sendPayout.mutate(
            { externalAccountId: recipient.id, amount, ...(isUsd ? { rail } : {}), pin },
            {
                onSuccess: () => setTxState("success"),
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || "Could not send this payout");
                    setTxState("error");
                },
            },
        );
    };

    return (
        <>
            <Panel>
                <PanelHeader title={`Send to ${recipient.accountOwnerName}`} description={`${recipient.currency} account ending •••• ${recipient.last4}`} />
                <PanelBody className="space-y-4">
                    <Field label={`Amount to send (${recipient.currency})`} hint="Entered directly in the recipient's own currency.">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">{symbol}</span>
                            <Input
                                className="pl-7"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                                placeholder="0.00"
                            />
                        </div>
                    </Field>

                    {isUsd ? (
                        <Field label="Delivery speed">
                            <Select value={rail} onValueChange={(v) => setRail(v as BridgeUsdPayoutRail)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableRails.map((r) => (
                                        <SelectItem key={r} value={r}>{USD_RAIL_INFO[r].label} — {USD_RAIL_INFO[r].timing}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="mt-1.5 text-xs text-muted">{USD_RAIL_INFO[rail].note}</p>
                        </Field>
                    ) : null}

                    {wallet ? (
                        <p className="text-xs text-muted">
                            Your NePay balance: <span className="font-semibold text-ink">{formatMoney(wallet.availableBalance, "NGN")}</span>
                        </p>
                    ) : null}

                    {amount && Number(amount) > 0 ? (
                        <div
                            className={`rounded-lg border px-3 py-2.5 text-sm ${
                                insufficientFunds || outsideLimits
                                    ? "border-red-300 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10"
                                    : "border-border bg-gray-50 dark:bg-white/5"
                            }`}
                        >
                            {quoteLoading ? (
                                <span className="text-muted">Getting a live quote…</span>
                            ) : ngnLabel ? (
                                <>
                                    <span className="font-bold text-ink">{ngnLabel}</span>
                                    <span className="text-muted"> total — {symbol}{amount} at {formatMoney(quote!.rate, "NGN")} per {recipient.currency}, plus a {quote!.fee ? `${formatMoney(quote!.fee, "NGN")} fee` : "fee"}</span>
                                    {(quote!.minSendAmount || quote!.maxSendAmount) ? (
                                        <p className="mt-1 text-xs text-muted">
                                            Allowed: {quote!.minSendAmount ?? "no min"} – {quote!.maxSendAmount ?? "no max"} {recipient.currency}
                                        </p>
                                    ) : null}
                                    {belowMin ? (
                                        <p className="mt-1 font-semibold text-red-600 dark:text-red-400">
                                            The minimum you can send in {recipient.currency} is {quote!.minSendAmount}.
                                        </p>
                                    ) : aboveMax ? (
                                        <p className="mt-1 font-semibold text-red-600 dark:text-red-400">
                                            The maximum you can send in {recipient.currency} is {quote!.maxSendAmount}.
                                        </p>
                                    ) : insufficientFunds ? (
                                        <p className="mt-1 font-semibold text-red-600 dark:text-red-400">
                                            This costs more than your {formatMoney(wallet!.availableBalance, "NGN")} balance. Top up before sending.
                                        </p>
                                    ) : null}
                                </>
                            ) : (
                                <span className="text-muted">Pricing is temporarily unavailable.</span>
                            )}
                        </div>
                    ) : null}

                    <Button
                        fullWidth
                        variant="primary"
                        disabled={!ngnLabel || !amount || insufficientFunds || outsideLimits}
                        onClick={() => {
                            setTxState("confirm");
                            setModalOpen(true);
                        }}
                    >
                        <Send className="mr-2 h-4 w-4" />
                        Send {symbol}{amount || "0.00"}
                    </Button>
                </PanelBody>
            </Panel>

            <TransactionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                state={txState}
                confirmTitle="Confirm this payout"
                confirmContent={
                    <div className="space-y-2 py-2 text-center">
                        <p className="text-3xl font-black text-ink">{ngnLabel ?? "Unavailable"}</p>
                        <p className="text-sm text-muted">
                            Sending {symbol}{amount} to {recipient.accountOwnerName}&apos;s {recipient.currency} account
                            {isUsd ? <> via {USD_RAIL_INFO[rail].label} ({USD_RAIL_INFO[rail].timing.toLowerCase()})</> : null}. This cannot be reversed once sent.
                        </p>
                    </div>
                }
                onConfirm={() => setTxState("pin")}
                onCancel={() => setModalOpen(false)}
                confirmButtonLabel="Continue"
                onPinSubmit={handlePinSubmit}
                pinDescription="Enter your 4-digit transaction PIN to confirm this payout."
                processingText="Sending your payout..."
                successTitle="Payout on its way"
                successDescription={`We're sending it to ${recipient.accountOwnerName}'s account. We'll notify you once it's confirmed.`}
                onSuccessAction={() => {
                    setModalOpen(false);
                    setAmount("");
                    onSent();
                }}
                errorTitle="Payout Failed"
                errorDescription={(sendPayout.error as any)?.response?.data?.message || "Something went wrong. Please try again."}
                onErrorAction={() => setModalOpen(false)}
            />
        </>
    );
}
