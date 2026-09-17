"use client";

import * as React from "react";
import { ArrowLeft, ChevronRight, MessageCircle } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types/api";
import type { SupportCategory, SupportMessage, SupportStatus, useSupportConversation } from "@/lib/hooks/use-support-conversation";

interface TicketSummary {
    id: string;
    referenceNumber: string;
    category: SupportCategory;
    priority: "normal" | "urgent";
    status: SupportStatus;
    intakeName: string | null;
    createdAt: string;
    updatedAt: string;
}

const CATEGORY_LABELS: Record<SupportCategory, string> = {
    deposit_issue: "Deposit issue",
    withdrawal_issue: "Withdrawal issue",
    kyc_verification: "KYC / Verification",
    gift_card: "Gift card",
    other: "Something else",
};

const STATUS_LABELS: Record<SupportStatus, string> = {
    waiting: "Waiting",
    active: "In progress",
    pending_agent: "In progress",
    pending_customer: "Awaiting your reply",
    resolved: "Resolved",
    closed: "Closed",
};

function statusTone(status: SupportStatus): string {
    if (status === "resolved") return "bg-emerald-100 text-emerald-700";
    if (status === "closed") return "bg-slate-100 text-slate-600";
    if (status === "pending_customer") return "bg-amber-100 text-amber-700";
    return "bg-violet-100 text-violet-700";
}

function dateLabel(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * "How can users track their support ticket" — this is the answer: every
 * conversation a customer has ever had, past and present, browsable by its
 * reference number. Read-only for ended tickets (there's nothing to reply
 * to); tapping the one that matches the CURRENTLY live conversation instead
 * hands off to the real chat panel via onOpenLive, since that one can still
 * be replied to and already has a live socket connection via the shared hook.
 */
export function SupportTicketHistory({ support, onBack, onOpenLive }: {
    support: ReturnType<typeof useSupportConversation>;
    onBack: () => void;
    onOpenLive: () => void;
}) {
    const [tickets, setTickets] = React.useState<TicketSummary[] | null>(null);
    const [selected, setSelected] = React.useState<TicketSummary | null>(null);
    const [messages, setMessages] = React.useState<SupportMessage[] | null>(null);

    React.useEffect(() => {
        apiClient.get<ApiResponse<TicketSummary[]>>("/support/conversations").then((result) => setTickets(result.data.data));
    }, []);

    async function openTicket(ticket: TicketSummary) {
        if (ticket.id === support.conversation?.id) { onOpenLive(); return; }
        setSelected(ticket);
        setMessages(null);
        const result = await apiClient.get<ApiResponse<SupportMessage[]>>(`/support/conversation/${ticket.id}/messages`);
        setMessages(result.data.data);
    }

    if (selected) {
        return <section className="flex h-[min(680px,calc(100vh-140px))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <header className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-white">
                <button type="button" onClick={() => setSelected(null)} aria-label="Back to my tickets" className="shrink-0 rounded-full p-1.5 transition hover:bg-white/15"><ArrowLeft className="h-4 w-4" /></button>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold leading-tight">{selected.referenceNumber}</p>
                    <p className="truncate text-[11px] text-white/70">{CATEGORY_LABELS[selected.category]} · {STATUS_LABELS[selected.status]}</p>
                </div>
            </header>
            <div className="flex-1 space-y-3.5 overflow-y-auto bg-[#fbfaff] p-4">
                {messages === null && <div className="flex h-full items-center justify-center text-sm text-muted">Loading transcript...</div>}
                {messages?.map((item) => <div key={item.id} className={`flex flex-col ${item.senderType === "customer" ? "items-end" : item.senderType === "system" ? "items-center" : "items-start"}`}>
                    {item.attachmentUrl
                        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, not a local/next asset
                        ? <img src={item.attachmentUrl} alt="Attachment" className="h-[200px] w-[200px] rounded-2xl object-cover shadow-sm" />
                        : <div className={item.senderType === "customer" ? "w-fit max-w-[80%] break-words rounded-2xl rounded-br-sm bg-violet-700 px-3.5 py-2 text-sm leading-relaxed text-white shadow-sm" : item.senderType === "system" ? "w-fit max-w-[90%] break-words rounded-xl bg-violet-50 px-3 py-2 text-center text-xs text-violet-900" : "w-fit max-w-[80%] break-words rounded-2xl rounded-bl-sm border border-border bg-white px-3.5 py-2 text-sm leading-relaxed text-ink shadow-sm"}>{item.body}</div>}
                </div>)}
            </div>
            <div className="border-t border-border p-4 text-center">
                <p className="text-xs text-muted">This conversation has ended. Read-only — start a new chat from Help &amp; Support for a new issue.</p>
            </div>
        </section>;
    }

    return <section className="flex h-[min(680px,calc(100vh-140px))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <header className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-white">
            <button type="button" onClick={onBack} aria-label="Back to Help and Support" className="shrink-0 rounded-full p-1.5 transition hover:bg-white/15"><ArrowLeft className="h-4 w-4" /></button>
            <p className="text-sm font-bold leading-tight">My tickets</p>
        </header>
        <div className="flex-1 overflow-y-auto">
            {tickets === null && <div className="flex h-full items-center justify-center text-sm text-muted">Loading your tickets...</div>}
            {tickets?.length === 0 && <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
                <MessageCircle className="h-8 w-8 text-muted" />
                <p className="text-sm text-muted">You haven&apos;t started a conversation with us yet.</p>
            </div>}
            {tickets?.map((ticket) => <button
                key={ticket.id}
                type="button"
                onClick={() => void openTicket(ticket)}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition hover:bg-slate-50"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-ink">{ticket.referenceNumber}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(ticket.status)}`}>{STATUS_LABELS[ticket.status]}</span>
                        {ticket.priority === "urgent" && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Urgent</span>}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">{CATEGORY_LABELS[ticket.category]} · {dateLabel(ticket.updatedAt)}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </button>)}
        </div>
    </section>;
}
