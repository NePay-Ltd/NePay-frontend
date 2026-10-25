/**
 * TanStack Query hooks for Transactions.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient, hasSession } from "@/lib/api-client";
import { LedgerEntryDto, ApiPaginated, ApiResponse } from "@/lib/types/api";
import { BaseTransaction } from "@/components/shared/transaction-row";
import { TxCategory } from "@/components/shared/tx-icon";
import { BankDepositReceiptDto, ForeignDepositReceiptDto, UtilityPurchaseResponseDto, WithdrawalReceiptDto } from "@/lib/types/api";
import { bankDepositRows, foreignDepositRows, genericRows, utilityRows, withdrawalRows, type UtilityKind } from "@/lib/receipt-model";

/**
 * UtilityCategory (AIRTIME/DATA/ELECTRICITY/CABLE/EDUCATION/BETTING) -> the
 * specific, customer-facing purchase name. Every UTILITY_PURCHASE ledger
 * entry uses this one shared type regardless of which utility it actually
 * was, so "Utility Purchase" alone would never say whether it was airtime,
 * data, electricity or an exam PIN â€” mirrors the backend's
 * getTransactionTypeLabel in email-templates.ts exactly, same source data.
 */
const UTILITY_CATEGORY_LABELS: Record<string, string> = {
    AIRTIME: "Airtime Purchase",
    DATA: "Data Purchase",
    ELECTRICITY: "Electricity Purchase",
    CABLE: "Cable TV Subscription",
    EDUCATION: "Exam PIN Purchase",
    BETTING: "Betting Wallet Funding",
};

/** Recovers the specific utility category from `description`, the only place UtilitiesService records it â€” "<CATEGORY> purchase: ..." or, for a reversal, "Refund: <CATEGORY> purchase ...". */
function utilityPurchaseLabel(description: string | null | undefined): string {
    const isRefund = /^Refund:/i.test(description ?? "");
    const category = description?.match(/([A-Z]+)\s+purchase/)?.[1];
    const base = (category && UTILITY_CATEGORY_LABELS[category]) || "Utility Purchase";
    return isRefund ? `${base} Refund` : base;
}

/** The specific, customer-facing name for a ledger entry's type â€” never the literal LedgerEntryType enum value. Shown as the "Type" field on every transaction row, detail view and downloadable receipt. */
function getTransactionTypeLabel(entry: LedgerEntryDto): string {
    switch (entry.type) {
        case "DEPOSIT": return "Crypto Deposit";
        case "BANK_DEPOSIT": return "Bank Deposit";
        case "FCY_CONVERSION_CREDIT": return "Foreign Currency Deposit";
        case "WITHDRAWAL": return "Withdrawal";
        case "UTILITY_PURCHASE": return utilityPurchaseLabel(entry.description);
        case "UTILITY_DISCOUNT": return "Utility Cashback";
        case "GIFT_CARD_SALE": return "Gift Card Sale";
        case "FLIGHT_BOOKING": return "Flight Booking";
        case "CASHBACK": return "Cashback";
        case "REFERRAL_REWARD": return "Referral Reward";
        case "PROMO_CREDIT": return "Promo Credit";
        case "GOODWILL_CREDIT": return "Goodwill Credit";
        case "ERROR_CORRECTION": return "Error Correction";
        // ADMIN_ADJUSTMENT is the true catch-all (AdminService's OTHER
        // category) â€” every named category above already has an honest
        // type of its own, so this is the only case left where showing the
        // literal type would read as "Admin Adjustment" to a customer.
        case "ADMIN_ADJUSTMENT": return entry.direction === "DEBIT" ? "Account Debit" : "Account Credit";
        default: return entry.type.replace(/_/g, " ").replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }
}

export function mapLedgerToTransaction(entry: LedgerEntryDto): BaseTransaction {
    let category: TxCategory = "payment";
    switch (entry.type) {
        case "DEPOSIT":
        case "BANK_DEPOSIT":
        // The NGN credit from a completed FCY conversion â€” same category as
        // any other deposit into the wallet, just a different source.
        case "FCY_CONVERSION_CREDIT": category = "deposit"; break;
        case "WITHDRAWAL": category = "transfer"; break;
        case "UTILITY_PURCHASE": 
            category = "payment"; 
            if (entry.description?.toLowerCase().includes("airtime") || entry.description?.toLowerCase().includes("vtu")) category = "airtime";
            if (entry.description?.toLowerCase().includes("data")) category = "data";
            if (entry.description?.toLowerCase().includes("tv") || entry.description?.toLowerCase().includes("cable")) category = "tv";
            if (entry.description?.toLowerCase().includes("electricity") || entry.description?.toLowerCase().includes("power")) category = "electricity";
            break;
        case "UTILITY_DISCOUNT": category = "cashback"; break;
        case "GIFT_CARD_SALE": category = "gift-card"; break;
        case "FLIGHT_BOOKING": category = "flight"; break;
        // ADMIN_ADJUSTMENT is the true catch-all (AdminService's OTHER
        // category) â€” everything with an actual name gets its own type and
        // its own icon below, precisely so a customer can never tell a
        // manual credit apart from an automated one just by looking at
        // their own transaction list.
        case "ADMIN_ADJUSTMENT": category = "admin"; break;
        case "PROMO_CREDIT": category = "promo-credit"; break;
        case "GOODWILL_CREDIT": category = "goodwill-credit"; break;
        case "ERROR_CORRECTION": category = "correction"; break;
        case "CASHBACK": category = "cashback"; break;
        case "REFERRAL_REWARD": category = "cashback"; break;
    }

    const cryptoAsset = entry.assetQuantity && entry.description
        ? entry.description.match(/\s([A-Za-z0-9_-]+)\s@\s/)?.[1]
        : undefined;

    const meta = getTransactionTypeLabel(entry);

    return {
        id: entry.id,
        label: entry.assetQuantity && cryptoAsset
            ? `Crypto deposit${entry.description?.includes("partial payment") ? " (partial payment)" : ""}`
            : entry.description || meta,
        meta: entry.assetQuantity && cryptoAsset
            ? `${entry.assetQuantity} ${cryptoAsset} Â· Crypto deposit`
            : meta,
        amount: entry.direction === "DEBIT" ? -parseFloat(entry.amount) : parseFloat(entry.amount),
        category,
        status: entry.status ?? "success",
        date: entry.createdAt,
        cryptoAmount: entry.assetQuantity ?? undefined,
        cryptoAsset,
        exchangeRate: entry.rate ?? undefined,
                fee: entry.fee ? parseFloat(entry.fee) : undefined,
        receiptRows: genericRows({
            typeLabel: meta,
            description: entry.description,
            transactionId: entry.id,
            cryptoAmount: entry.assetQuantity,
            cryptoAsset,
            exchangeRate: entry.rate,
        }),
    };
}

export const transactionKeys = {
    all: ["transactions"] as const,
    list: (page: number) => [...transactionKeys.all, "list", page] as const,
    detail: (id: string) => [...transactionKeys.all, "detail", id] as const,
};

/**
 * A single transaction by id, straight from GET /wallet/transactions/:id â€”
 * not a search through whatever page of the list happens to be cached.
 * Receipt views (the /transactions/[id] page, "View Full Receipt" from the
 * summary modal) must use this, not useInfiniteTransactions + .find(), which
 * only ever finds a transaction if it's within the pages already fetched â€”
 * silently "not found" for anything older than that.
 */
export function useTransaction(id: string | null) {
    return useQuery<BaseTransaction>({
        queryKey: transactionKeys.detail(id ?? ""),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<LedgerEntryDto>>(`/wallet/transactions/${id}`);
            const entry = res.data.data;
            const transaction = mapLedgerToTransaction(entry);

            // Per-type receipt details. Each is best-effort: if one can't be loaded (an older
            // transaction that predates the link, a provider hiccup) the receipt still prints
            // from the generic rows above — never an error page.
            if (entry.type === "WITHDRAWAL") {
                try {
                    const r = (await apiClient.get<ApiResponse<WithdrawalReceiptDto>>(`/withdrawals/receipt/${id}`)).data.data;
                    transaction.receiptRows = withdrawalRows({
                        recipientName: r.recipientName,
                        bankName: r.bankName,
                        accountNumberMasked: r.accountNumberMasked,
                        senderName: r.senderName,
                        narration: r.narration,
                        sessionId: r.sessionId,
                        transactionId: entry.id,
                        reference: r.reference,
                        isRefund: r.isRefund,
                    });
                } catch {
                    // keep the generic rows
                }
            } else if (entry.type === "BANK_DEPOSIT") {
                try {
                    const r = (await apiClient.get<ApiResponse<BankDepositReceiptDto>>(`/wallet/virtual-account/receipt/${id}`)).data.data;
                    transaction.receiptRows = bankDepositRows({
                        senderName: r.senderName,
                        senderBankName: r.senderBankName,
                        senderAccountMasked: r.senderAccountMasked,
                        narration: r.narration,
                        sessionId: r.sessionId,
                        recipientName: r.recipientName,
                        recipientBankName: r.recipientBankName,
                        recipientAccountMasked: r.recipientAccountMasked,
                        transactionId: entry.id,
                        reference: r.reference,
                    });
                } catch {
                    // keep the generic rows
                }
            } else if (entry.type === "FCY_CONVERSION_CREDIT") {
                try {
                    const r = (await apiClient.get<ApiResponse<ForeignDepositReceiptDto>>(`/bridge/accounts/receipt/${id}`)).data.data;
                    transaction.receiptRows = foreignDepositRows({
                        senderName: r.senderName,
                        paymentRail: r.paymentRail,
                        narration: r.narration,
                        sourceCurrency: r.sourceCurrency,
                        sourceAmount: r.sourceAmount,
                        usdAmount: r.usdAmount,
                        rateUsed: r.rateUsed,
                        recipientName: r.recipientName,
                        transactionId: entry.id,
                        reference: r.reference,
                    });
                } catch {
                    // keep the generic rows
                }
            } else if (entry.type === "UTILITY_PURCHASE") {
                try {
                    const data = (await apiClient.get<ApiResponse<UtilityPurchaseResponseDto>>(`/utilities/purchases/by-ledger/${id}`)).data.data;

                    if (transaction.category === "electricity") {
                        transaction.utilityToken = data.token ?? undefined;
                        transaction.utilityCustomerName = data.customerName ?? undefined;
                        transaction.utilityCustomerAddress = data.customerAddress ?? undefined;
                        transaction.utilityUnits = data.units ?? undefined;
                        transaction.utilityDisco = data.productName ?? undefined;
                        transaction.utilityMeterNumber = data.identifier;
                        transaction.utilityMeterType = data.variationCode ?? undefined;
                        transaction.utilityProviderTransactionId = data.providerTransactionId ?? undefined;
                        transaction.utilityTariff = data.tariff ?? undefined;
                    }

                    const kind = data.category as string;
                    if (["AIRTIME", "DATA", "ELECTRICITY", "CABLE", "EDUCATION"].includes(kind)) {
                        transaction.receiptRows = utilityRows({
                                                        kind: kind as UtilityKind,
                            // The purchase's own id — the same one shown on the receipt right after buying.
                            transactionId: data.id,
                            reference: data.providerReference,
                            identifier: data.identifier,
                            providerName: data.providerName ?? data.productName,
                            customerName: data.customerName,
                            customerAddress: data.customerAddress,
                            planName: data.planName,
                            meterType: data.variationCode,
                            tariff: data.tariff,
                            units: data.units,
                            providerTransactionId: data.providerTransactionId,
                            // The token has its own copyable block on screen; it stays in the rows for text/PDF shares.
                            token: data.token,
                        });
                    }
                } catch {
                    // Older transactions may predate the utility-purchase link.
                }
            }
            return transaction;
        },
        enabled: !!id,
    });
}

export function useTransactions(page: number = 1, limit: number = 20) {
    return useQuery<ApiPaginated<BaseTransaction>>({
        queryKey: transactionKeys.list(page),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ApiPaginated<LedgerEntryDto>>>(`/wallet/transactions?page=${page}&limit=${limit}`);
            const paginated = res.data.data;
            return {
                ...paginated,
                items: paginated.items.map(mapLedgerToTransaction),
            };
        },
        // Keep previous data while fetching new pages so the UI doesn't flash empty
        placeholderData: (previousData) => previousData,
        enabled: hasSession(),
    });
}

import { useInfiniteQuery } from "@tanstack/react-query";

export function useInfiniteTransactions(limit: number = 20) {
    return useInfiniteQuery<ApiPaginated<BaseTransaction>>({
        queryKey: ["transactions", "infinite"],
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1 }) => {
            const res = await apiClient.get<ApiResponse<ApiPaginated<LedgerEntryDto>>>(`/wallet/transactions?page=${pageParam}&limit=${limit}`);
            const paginated = res.data.data;
            return {
                ...paginated,
                items: paginated.items.map(mapLedgerToTransaction),
            };
        },
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.page < lastPage.pages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        enabled: hasSession(),
    });
}
