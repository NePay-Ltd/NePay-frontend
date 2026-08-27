/**
 * Notifications — derived from real ledger data.
 *
 * The backend has no dedicated customer notification endpoint; notifications
 * are synthesised from the user's actual ledger entries so that every
 * notification reflects a real event (deposit, withdrawal, referral reward,
 * KYC approval, utility purchase, etc.) rather than fabricated mock data.
 *
 * Unread state is managed locally in sessionStorage so it survives page
 * refreshes but resets between sessions — an acceptable trade-off until a
 * real server-side read-tracking endpoint is built.
 */

import { useInfiniteQuery, useQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { LedgerEntryDto, ApiPaginated, ApiResponse } from "@/lib/types/api";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = "deposit" | "withdrawal" | "referral" | "kyc" | "utility" | "gift_card" | "flight" | "security" | "credit";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    timestamp: string;
    read: boolean;
}

export interface PaginatedNotifications {
    items: Notification[];
    nextCursor: string | null;
    /** Raw page number so we can fetch the next page of ledger entries. */
    nextPage: number | null;
}

// ─── Local read-state helpers ─────────────────────────────────────────────────

const READ_KEY = "nepay-read-notifs";

function getReadSet(): Set<string> {
    try {
        const raw = sessionStorage.getItem(READ_KEY);
        return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
        return new Set();
    }
}

function saveReadSet(ids: Set<string>) {
    try {
        sessionStorage.setItem(READ_KEY, JSON.stringify([...ids]));
    } catch { /* storage full — ignore */ }
}

// ─── Ledger → Notification mapper ────────────────────────────────────────────

function ledgerToNotification(entry: LedgerEntryDto, readSet: Set<string>): Notification {
    const desc = entry.description ?? "";
    const amount = parseFloat(entry.amount).toLocaleString("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 });

    let type: NotificationType;
    let title: string;
    let body: string;

    switch (entry.type) {
        case "DEPOSIT":
        case "BANK_DEPOSIT":
            type = "deposit";
            title = "Money received";
            body = `${amount} has been credited to your wallet.`;
            break;

        case "WITHDRAWAL":
            type = "withdrawal";
            title = "Withdrawal successful";
            body = `${amount} sent to your bank account.${desc ? ` ${desc}` : ""}`;
            break;

        case "REFERRAL_REWARD":
            type = "referral";
            title = "Referral reward";
            body = `${amount} earned from your referral network.`;
            break;

        case "UTILITY_PURCHASE": {
            type = "utility";
            const d = desc.toLowerCase();
            if (d.includes("airtime") || d.includes("vtu")) {
                title = "Airtime purchase";
            } else if (d.includes("data")) {
                title = "Data purchase";
            } else if (d.includes("electricity") || d.includes("power") || d.includes("disco")) {
                title = "Electricity token";
            } else if (d.includes("tv") || d.includes("cable") || d.includes("dstv") || d.includes("gotv")) {
                title = "TV subscription";
            } else {
                title = "Bill payment";
            }
            body = desc || `${amount} deducted for utility payment.`;
            break;
        }

        case "GIFT_CARD_SALE":
            type = "gift_card";
            title = "Gift card sold";
            body = `${amount} credited for your gift card submission.`;
            break;

        case "FLIGHT_BOOKING":
            type = "flight";
            title = "Flight booked";
            body = `${amount} deducted for your flight booking.`;
            break;

        case "PROMO_CREDIT":
        case "GOODWILL_CREDIT":
            type = "credit";
            title = "Promotional credit";
            body = `${amount} credited to your wallet.${desc ? ` ${desc}` : ""}`;
            break;

        case "CASHBACK":
            type = "credit";
            title = "Cashback received";
            body = `${amount} cashback added to your wallet.`;
            break;

        case "ADMIN_ADJUSTMENT":
        case "ERROR_CORRECTION":
            type = entry.direction === "CREDIT" ? "credit" : "withdrawal";
            title = entry.direction === "CREDIT" ? "Account credit" : "Account debit";
            body = desc || `${amount} ${entry.direction === "CREDIT" ? "added to" : "deducted from"} your wallet.`;
            break;

        default:
            type = "credit";
            title = "Account activity";
            body = desc || `${amount} ${entry.direction === "CREDIT" ? "received" : "sent"}.`;
    }

    // Treat anything older than the most recent session's first load as "read"
    const read = readSet.has(entry.id);

    return { id: entry.id, type, title, body, timestamp: entry.createdAt, read };
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const notificationKeys = {
    all: ["notifications"] as const,
    list: () => [...notificationKeys.all, "list"] as const,
    unreadCount: () => [...notificationKeys.all, "unreadCount"] as const,
};

const LIMIT = 20;

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useNotifications() {
    return useInfiniteQuery<PaginatedNotifications>({
        queryKey: notificationKeys.list(),
        queryFn: async ({ pageParam }) => {
            const page = (pageParam as number) ?? 1;
            const readSet = getReadSet();

            const res = await apiClient.get<ApiResponse<ApiPaginated<LedgerEntryDto>>>(
                `/wallet/transactions?page=${page}&limit=${LIMIT}`
            );
            const paginated = res.data.data;

            const items = paginated.items.map((entry) => ledgerToNotification(entry, readSet));

            return {
                items,
                nextCursor: paginated.page < paginated.pages ? String(paginated.page + 1) : null,
                nextPage: paginated.page < paginated.pages ? paginated.page + 1 : null,
            };
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    });
}

export function useUnreadNotificationCount() {
    return useQuery<number>({
        queryKey: notificationKeys.unreadCount(),
        queryFn: async () => {
            // Fetch the first page and count entries newer than the last-seen marker
            const readSet = getReadSet();
            const res = await apiClient.get<ApiResponse<ApiPaginated<LedgerEntryDto>>>(
                `/wallet/transactions?page=1&limit=${LIMIT}`
            );
            const items = res.data.data.items;
            // Any entry not in the local read set is "unread"
            return items.filter((entry) => !readSet.has(entry.id)).length;
        },
        refetchInterval: 60_000, // Poll every minute for new transactions
    });
}

export function useMarkAllRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            // Collect all notification IDs currently in the cache and mark them read locally
            const cached = queryClient.getQueryData<InfiniteData<PaginatedNotifications>>(notificationKeys.list());
            if (!cached) return;

            const readSet = getReadSet();
            cached.pages.forEach((page) => page.items.forEach((n) => readSet.add(n.id)));
            saveReadSet(readSet);
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: notificationKeys.all });

            const previousUnreadCount = queryClient.getQueryData<number>(notificationKeys.unreadCount());
            const previousList = queryClient.getQueryData<InfiniteData<PaginatedNotifications>>(notificationKeys.list());

            queryClient.setQueryData(notificationKeys.unreadCount(), 0);

            if (previousList) {
                queryClient.setQueryData<InfiniteData<PaginatedNotifications>>(notificationKeys.list(), {
                    ...previousList,
                    pages: previousList.pages.map((page) => ({
                        ...page,
                        items: page.items.map((item) => ({ ...item, read: true })),
                    })),
                });
            }

            return { previousUnreadCount, previousList };
        },
        onError: (err, _variables, context) => {
            if (context?.previousUnreadCount !== undefined) {
                queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount);
            }
            if (context?.previousList !== undefined) {
                queryClient.setQueryData(notificationKeys.list(), context.previousList);
            }
            toast.error("Failed to mark notifications as read. Please try again.");
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}
