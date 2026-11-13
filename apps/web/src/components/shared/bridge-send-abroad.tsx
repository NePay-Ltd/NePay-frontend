"use client";

/**
 * Sending money OUT to a foreign bank account — the reverse of Foreign
 * Accounts' receiving flow, rendered as the "Send" tab of the same page.
 * Priced USD-flat (see useBridgePayoutQuote's own note): the customer picks
 * how much USD-equivalent value to send, and the recipient gets whatever
 * Bridge's own FX turns that into in their own currency — never an exact
 * foreign-currency figure this app promises, since there's no EUR/GBP rate
 * anywhere in this codebase to price one against.
 *
 * Gated behind the server's own `bridge.payoutsEnabled` flag — every call
 * here 404s/503s until that's flipped on, which only happens once Bridge
 * has confirmed the open questions from the 2026-11-11 research pass.
 */

import * as React from "react";
import { IconBuilding as Building2 } from "@/components/icons";
import { ArrowRight, Loader2, Plus, Send } from "lucide-react";
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
    CreateBridgeExternalAccountDto,
    UpdateBridgeExternalAccountAddressDto,
} from "@/lib/types/api";

/** Every currency Bridge approves for payouts — wider than what NePay receives in (USD/EUR only). See BridgePayoutCurrency's own note. */
const SEND_CURRENCIES: { code: BridgePayoutCurrency; label: string }[] = [
    { code: "USD", label: "USD" },
    { code: "EUR", label: "EUR" },
    { code: "GBP", label: "GBP" },
    { code: "MXN", label: "MXN (Mexican Peso)" },
    { code: "COP", label: "COP (Colombian Peso)" },
];

const PAYOUT_STATUS_TAG: Record<BridgePayoutStatus, { variant: TagVariant; label: string }> = {
    PROCESSING: { variant: "neutral", label: "Processing" },
    COMPLETED: { variant: "ok", label: "Completed" },
    FAILED: { variant: "error", label: "Failed, refunded" },
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
    const { data: recipients, isPending: recipientsLoading } = useBridgeExternalAccounts();
    const { data: payouts } = useBridgePayouts();
    const [addOpen, setAddOpen] = React.useState(false);
    const [selectedRecipientId, setSelectedRecipientId] = React.useState<string | null>(null);
    const [editAddressId, setEditAddressId] = React.useState<string | null>(null);

    const recipient = recipients?.find((r) => r.id === selectedRecipientId) ?? null;
    const editingRecipient = recipients?.find((r) => r.id === editAddressId) ?? null;

    return (
        <div className="space-y-6">
            <Panel>
                <PanelHeader
                    title="Recipients"
                    description="Bank accounts you can send money to — registered once, reused for every send"
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
                                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                                        selectedRecipientId === r.id
                                            ? "border-violet-400 bg-violet-50 dark:bg-violet-900/10"
                                            : "border-border bg-white dark:bg-gray-900 hover:border-violet-300"
                                    }`}
                                >
                                    <button type="button" onClick={() => setSelectedRecipientId(r.id)} className="flex-1 text-left">
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
                                    {selectedRecipientId === r.id ? (
                                        <ArrowRight className="h-4 w-4 shrink-0 text-violet-600" onClick={() => setSelectedRecipientId(r.id)} />
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </PanelBody>
            </Panel>

            {recipient ? <SendForm recipient={recipient} onSent={() => setSelectedRecipientId(null)} /> : null}

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
                                                ${payout.amountUsd} → {payout.destinationCurrency}
                                                <span className="text-muted font-medium"> · ₦{Number(payout.ngnAmount).toLocaleString()}</span>
                                            </p>
                                            <p className="text-xs text-muted mt-0.5">
                                                {formatDate(payout.createdAt)}
                                                {payout.failureReason ? <> · {payout.failureReason}</> : null}
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

            <AddRecipientModal open={addOpen} onOpenChange={setAddOpen} onCreated={(id) => setSelectedRecipientId(id)} />
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

function AddRecipientModal({
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

        const requiredByCurrency: Record<BridgePayoutCurrency, (keyof RecipientForm)[]> = {
            USD: ["usAccountNumber", "usRoutingNumber", "usStreetLine1", "usCity", "usState", "usPostalCode"],
            EUR: ["iban", "ibanCountry"],
            GBP: ["gbAccountNumber", "gbSortCode"],
            MXN: ["mxnClabe"],
            COP: ["copBreBKey"],
        };
        const required = requiredByCurrency[form.currency];

        for (const key of required) {
            if (!String(form[key] ?? "").trim()) {
                toast.error("Fill in all fields for this currency.");
                return;
            }
        }

        create(
            { ...form, isSelf: form.isSelf === "yes" },
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
                        <Field label="Bre-B key">
                            <Input value={form.copBreBKey ?? ""} onChange={(e) => update("copBreBKey", e.target.value)} />
                        </Field>
                    </div>
                )}
            </div>
        </Modal>
    );
}

// ─── Send form ──────────────────────────────────────────────────────────────

function SendForm({ recipient, onSent }: { recipient: BridgeExternalAccountDto; onSent: () => void }) {
    const [amountUsd, setAmountUsd] = React.useState("");
    const [modalOpen, setModalOpen] = React.useState(false);
    const [txState, setTxState] = React.useState<TransactionState>("confirm");
    const { data: quote, isFetching: quoteLoading } = useBridgePayoutQuote(amountUsd);
    const sendPayout = useInitiateBridgePayout();

    const ngnLabel = quote?.totalNgn ? `₦${Number(quote.totalNgn).toLocaleString()}` : null;

    const handlePinSubmit = (pin: string) => {
        setTxState("processing");
        sendPayout.mutate(
            { externalAccountId: recipient.id, amountUsd, pin },
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
                    <Field label="Amount to send (USD-equivalent)" hint="The recipient gets whatever this converts to in their own currency — not an exact figure we can promise.">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">$</span>
                            <Input
                                className="pl-7"
                                inputMode="decimal"
                                value={amountUsd}
                                onChange={(e) => setAmountUsd(e.target.value.replace(/[^0-9.]/g, ""))}
                                placeholder="0.00"
                            />
                        </div>
                    </Field>

                    {amountUsd && Number(amountUsd) > 0 ? (
                        <div className="rounded-lg border border-border bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm">
                            {quoteLoading ? (
                                <span className="text-muted">Getting a live quote…</span>
                            ) : ngnLabel ? (
                                <>
                                    <span className="font-bold text-ink">{ngnLabel}</span>
                                    <span className="text-muted"> total — ${amountUsd} at ₦{Number(quote!.rate).toLocaleString()}/$1, plus a {quote!.fee ? `₦${Number(quote!.fee).toLocaleString()} fee` : "fee"}</span>
                                </>
                            ) : (
                                <span className="text-muted">Pricing is temporarily unavailable.</span>
                            )}
                        </div>
                    ) : null}

                    <Button
                        fullWidth
                        variant="primary"
                        disabled={!ngnLabel || !amountUsd}
                        onClick={() => {
                            setTxState("confirm");
                            setModalOpen(true);
                        }}
                    >
                        <Send className="mr-2 h-4 w-4" />
                        Send ${amountUsd || "0.00"}
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
                            Sending ${amountUsd} to {recipient.accountOwnerName}&apos;s {recipient.currency} account. This cannot be reversed once sent.
                        </p>
                    </div>
                }
                onConfirm={() => setTxState("pin")}
                onCancel={() => setModalOpen(false)}
                confirmButtonLabel="Continue"
                onPinSubmit={handlePinSubmit}
                pinDescription="Enter your 4-digit transaction PIN to confirm this payout."
                processingText="Sending your payout..."
                successTitle="Payout Sent"
                successDescription="We'll let you know once it's delivered."
                onSuccessAction={() => {
                    setModalOpen(false);
                    setAmountUsd("");
                    onSent();
                }}
                errorTitle="Payout Failed"
                errorDescription={(sendPayout.error as any)?.response?.data?.message || "Something went wrong. Please try again."}
                onErrorAction={() => setModalOpen(false)}
            />
        </>
    );
}
