"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconBuilding as Building2, IconClock as Clock, IconCopy as Copy } from "@/components/icons";
import { ExternalLink, Receipt, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { RequireKyc } from "@/components/shared/require-kyc";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeletons";
import { Modal } from "@/components/shared/modal";
import { Tag, type TagVariant } from "@/components/shared/tag";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BridgeOnboardingForm } from "@/components/shared/bridge-onboarding-form";

import { formatByCurrency } from "@/lib/format";
import { formatDate } from "@/lib/date";
import {
    useBridgeAccounts,
    useBridgeCustomer,
    useBridgeDeposits,
    useRefreshBridgeCustomer,
    useRequestBridgeAccount,
} from "@/lib/queries/bridge";
import type { BridgeCurrency, BridgeVirtualAccountDto } from "@/lib/types/api";

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
                    <BridgeOnboardingForm rejectedCustomer={customer ?? undefined} />
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

/** `rejected` never reaches here — page.tsx routes it straight back to BridgeOnboardingForm so the user can actually correct and resubmit. */
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
