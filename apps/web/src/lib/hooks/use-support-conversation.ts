import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";

import { apiClient, getApiErrorMessage, getTokens } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types/api";
import { playSupportReplySound } from "@/lib/support-notification-sound";

export type SupportStatus = "waiting" | "active" | "pending_agent" | "pending_customer" | "resolved" | "closed";
export type SupportCategory = "deposit_issue" | "withdrawal_issue" | "kyc_verification" | "gift_card" | "other";

export interface SupportMessage { id: string; body: string; attachmentUrl: string | null; senderType: "customer" | "agent" | "system"; createdAt: string; }
export interface AssignedAgent { id: string; name: string; avatarUrl: string | null; }
export interface SupportConversation { id: string; status: SupportStatus; referenceNumber: string; category: SupportCategory; priority: "normal" | "urgent"; intakeName: string | null; intakeEmail: string | null; purpose: string | null; messages: SupportMessage[]; assignedAgent: AssignedAgent | null; queuePosition: number | null; }

/**
 * Older conversations opened with "…Please share your name and email below…". The server now opens with a neutral
 * greeting (and a migration rewrites the old one), but until that has run, show the new wording so the transcript
 * never reads as if details are still missing after they were given.
 */
const LEGACY_GREETING = "Tell us how we can help. Please share your name and email below so an agent can reach you, then let us know what's going on.";
const GREETING = "Thanks for reaching out. Tell us what's going on and we'll get you to the right person.";
function withCurrentGreeting<T extends { senderType: string; body: string }>(message: T): T {
  return message.senderType === "system" && message.body === LEGACY_GREETING ? { ...message, body: GREETING } : message;
}

export function isEndedStatus(status: SupportStatus): boolean { return status === "closed" || status === "resolved"; }
export function isAssignedStatus(status: SupportStatus): boolean { return status === "active" || status === "pending_agent" || status === "pending_customer"; }

const LAST_SEEN_KEY_PREFIX = "support-last-seen-message-id:";

function getLastSeenMessageId(conversationId: string): string | null {
    try { return window.localStorage.getItem(LAST_SEEN_KEY_PREFIX + conversationId); } catch { return null; }
}
function setLastSeenMessageId(conversationId: string, messageId: string) {
    try { window.localStorage.setItem(LAST_SEEN_KEY_PREFIX + conversationId, messageId); } catch { /* best-effort */ }
}
/** Agent messages after the stored watermark — works both for a live increment (socket connected, panel closed) and a cold catch-up count (came back after being away, even a different browser session). */
function countUnread(messages: SupportMessage[], lastSeenId: string | null): number {
    const afterWatermark = lastSeenId ? messages.slice(messages.findIndex((item) => item.id === lastSeenId) + 1) : messages;
    return afterWatermark.filter((item) => item.senderType === "agent").length;
}

/** Adds what the server has to what is on screen, by id, oldest first - never replaces, so nothing already shown can disappear. */
function mergeMessages(current: SupportMessage[], incoming: SupportMessage[]): SupportMessage[] {
    const byId = new Map(current.map((item) => [item.id, item]));
    for (const item of incoming) byId.set(item.id, item);
    return [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function httpStatus(err: unknown): number | undefined {
    return (err as { response?: { status?: number } } | null)?.response?.status;
}

function socketOrigin() {
    const configured = process.env.NEXT_PUBLIC_API_URL;
    return configured ? new URL(configured).origin : window.location.origin;
}

export interface IntakeForm { name: string; email: string; category: SupportCategory | ""; urgent: boolean; }

/**
 * Owns the customer's support conversation end to end — fetching/creating it,
 * the live socket connection, sending messages/attachments/intake, and
 * unread tracking — independent of whether the chat panel UI is currently
 * shown. Mounted once at the /support page level (not inside the panel
 * itself) specifically so navigating within that page back to the contact-
 * options list doesn't drop the connection or lose live unread updates —
 * the panel is just a view over this hook's state, not its owner.
 *
 * Deliberately does NOT auto-create a conversation on mount: GET
 * /support/conversation creates one if none is open, which would leave a
 * phantom waiting conversation (with its system greeting) behind for anyone
 * who merely visits the Help & Support page without intending to chat. It
 * only auto-loads when history shows an existing OPEN (non-ended)
 * conversation — safe, since fetching that one back never creates a new one.
 */
export function useSupportConversation() {
    const [conversation, setConversation] = React.useState<SupportConversation | null>(null);
    const [checkedForExisting, setCheckedForExisting] = React.useState(false);
    // Whether support is currently staffed — a manual admin-side toggle, not
    // presence detection. Known even before any conversation (and its socket)
    // exists, so the landing screen can say so upfront.
    const [isOnline, setIsOnline] = React.useState(true);
    const [loading, setLoading] = React.useState(false);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [replyToast, setReplyToast] = React.useState(false);
    const [agentTyping, setAgentTyping] = React.useState(false);
    const [message, setMessage] = React.useState("");
    const [uploadingAttachment, setUploadingAttachment] = React.useState(false);
    const [form, setForm] = React.useState<IntakeForm>({ name: "", email: "", category: "", urgent: false });
    const [stage, setStage] = React.useState<number | "done">(0);
    const socketRef = React.useRef<Socket | null>(null);
    const typingTimeoutRef = React.useRef<number | null>(null);
    const toastTimeoutRef = React.useRef<number | null>(null);
    // Mirrors "is the chat panel currently the thing on screen" for the socket's message
    // handler, set up once per connection — reading React state directly there would close
    // over a stale value from whenever that connection was made.
    const panelOpenRef = React.useRef(false);
    // The panel can be mounted while the browser tab itself isn't the one being looked at
    // (switched tabs, minimized, another app in front on mobile web) — Page Visibility is
    // the standard signal for that, independent of whether our own component is mounted.
    const tabVisibleRef = React.useRef(true);

    /** True only when the panel is actually the thing being looked at right now — mounted AND the tab is in front. Anything else (including "panel mounted but tab hidden") counts as away for notification purposes. */
    const isActivelyViewing = React.useCallback(() => panelOpenRef.current && tabVisibleRef.current, []);

    /** Tells the server whether the chat is really being looked at, so it pushes an agent's reply to the customer's phone when it is not (being connected alone no longer counts as looking). */
    const conversationIdRef = React.useRef<string | null>(null);
    const reportViewing = React.useCallback(() => {
        const socket = socketRef.current;
        if (!socket?.connected || !conversationIdRef.current) return;
        socket.emit("viewing", { conversationId: conversationIdRef.current, viewing: isActivelyViewing() });
    }, [isActivelyViewing]);

    const markConversationSeen = React.useCallback((data: SupportConversation) => {
        setUnreadCount(0);
        setReplyToast(false);
        if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
        const lastMessage = data.messages.at(-1);
        if (lastMessage) setLastSeenMessageId(data.id, lastMessage.id);
    }, []);

    const applyConversation = React.useCallback((raw: SupportConversation, opts?: { markSeenIfOpen?: boolean }) => {
        const data = { ...raw, messages: raw.messages.map(withCurrentGreeting) };
        setConversation(data);
        setForm({ name: data.intakeName ?? "", email: data.intakeEmail ?? "", category: data.category ?? "", urgent: data.priority === "urgent" });
        // Open the chat only once the server has a name and email - it refuses messages without them, whatever the status.
        setStage(data.intakeName && data.intakeEmail ? "done" : 0);
        if (opts?.markSeenIfOpen && isActivelyViewing()) {
            markConversationSeen(data);
        } else {
            setUnreadCount(countUnread(data.messages, getLastSeenMessageId(data.id)));
        }
    }, [isActivelyViewing, markConversationSeen]);

    /**
     * Catches up with the server: loads this conversation again (read-only - it can never start a new one) and ADDS any
     * messages we are missing, plus its current status and agent. Called when the live connection comes back and when
     * the tab returns to the front, because anything an agent wrote while the connection was down would otherwise
     * never appear until a manual reload.
     */
    const resyncConversation = React.useCallback(async () => {
        const id = conversationIdRef.current;
        if (!id) return;
        try {
            const result = await apiClient.get<ApiResponse<SupportConversation>>(`/support/conversation/${id}`);
            const fresh = { ...result.data.data, messages: result.data.data.messages.map(withCurrentGreeting) };
            setConversation((current) => current && current.id === id
                ? { ...current, status: fresh.status, assignedAgent: fresh.assignedAgent ?? current.assignedAgent, queuePosition: fresh.queuePosition, messages: mergeMessages(current.messages, fresh.messages) }
                : current);
            if (isActivelyViewing()) markConversationSeen(fresh);
            else setUnreadCount(countUnread(fresh.messages, getLastSeenMessageId(id)));
        } catch {
            // Best-effort: the next reconnect or return to the tab tries again.
        }
    }, [isActivelyViewing, markConversationSeen]);

    // Tracks tab/window visibility for isActivelyViewing above, and re-checks "have they now
    // seen it" the moment the tab comes back into view while the panel is still open — e.g.
    // they alt-tabbed away mid-conversation and a reply arrived while they were gone.
    React.useEffect(() => {
        tabVisibleRef.current = document.visibilityState === "visible";
        const handleVisibilityChange = () => {
            tabVisibleRef.current = document.visibilityState === "visible";
            reportViewing();
            if (tabVisibleRef.current) void resyncConversation();
            if (tabVisibleRef.current && panelOpenRef.current) {
                setConversation((current) => { if (current) markConversationSeen(current); return current; });
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [markConversationSeen, reportViewing, resyncConversation]);

    // Fetched once on mount, independent of whether a conversation exists — the landing
    // screen needs to know this before the customer has even started a chat.
    React.useEffect(() => {
        let cancelled = false;
        apiClient.get<ApiResponse<{ isOnline: boolean }>>("/support/status")
            .then((result) => { if (!cancelled) setIsOnline(result.data.data.isOnline); })
            .catch(() => { /* best-effort — assume online rather than block on this */ });
        return () => { cancelled = true; };
    }, []);

    // Safe, non-creating check on mount: is there already an open conversation to resume?
    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const history = await apiClient.get<ApiResponse<SupportConversation[]>>("/support/conversations");
                const hasOpenOne = history.data.data.some((item) => !isEndedStatus(item.status));
                if (!hasOpenOne || cancelled) return;
                const result = await apiClient.get<ApiResponse<SupportConversation>>("/support/conversation");
                if (!cancelled) applyConversation(result.data.data);
            } finally {
                if (!cancelled) setCheckedForExisting(true);
            }
        })();
        return () => { cancelled = true; };
    }, [applyConversation]);

    const loadOrStartConversation = React.useCallback(async () => {
        setLoading(true);
        try {
            const result = await apiClient.get<ApiResponse<SupportConversation>>("/support/conversation");
            applyConversation(result.data.data, { markSeenIfOpen: true });
        } catch (err) {
            toast.error(getApiErrorMessage(err, "We couldn't reach support right now. Please try again."));
        } finally {
            setLoading(false);
        }
    }, [applyConversation]);

    const conversationEnded = conversation ? isEndedStatus(conversation.status) : true;
    React.useEffect(() => {
        if (!conversation || conversationEnded) return;
        const token = getTokens()?.accessToken;
        if (!token) return;
        const socket = io(`${socketOrigin()}/support`, { auth: { token }, transports: ["websocket"] });
        socketRef.current = socket;
        conversationIdRef.current = conversation.id;
        let connectedBefore = false;
        socket.on("connect", () => {
            socket.emit("join_conversation", { conversationId: conversation.id }, () => reportViewing());
            // Coming back after a drop (sleep, wifi change): fetch what was said in the meantime.
            if (connectedBefore) void resyncConversation();
            connectedBefore = true;
        });
        socket.on("message", (raw: SupportMessage) => {
            const incoming = withCurrentGreeting(raw);
            setConversation((current) => current ? { ...current, messages: mergeMessages(current.messages, [incoming]) } : current);
            if (incoming.senderType !== "agent") return;
            if (isActivelyViewing()) {
                setLastSeenMessageId(conversation.id, incoming.id);
                return;
            }
            // Not actually being looked at right now — panel closed, tab hidden, or both. This is the "left the chat" case.
            setUnreadCount((count) => count + 1);
            setReplyToast(true);
            playSupportReplySound();
            if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = window.setTimeout(() => setReplyToast(false), 6000);
        });
        socket.on("typing", (payload: { senderType: "customer" | "agent"; isTyping: boolean }) => { if (payload.senderType === "agent") setAgentTyping(payload.isTyping); });
        socket.on("conversation_claimed", (agent: AssignedAgent) => setConversation((current) => current ? { ...current, assignedAgent: agent, status: "active" } : current));
        socket.on("queue_position", (payload: { position: number }) => setConversation((current) => current ? { ...current, queuePosition: payload.position } : current));
        socket.on("conversation_closed", () => { setAgentTyping(false); setConversation((current) => current ? { ...current, status: "closed" } : current); });
        socket.on("conversation_status_changed", (payload: { status: SupportStatus }) => setConversation((current) => current ? { ...current, status: payload.status } : current));
        socket.on("support_status_changed", (payload: { isOnline: boolean }) => setIsOnline(payload.isOnline));
        return () => { socket.disconnect(); socketRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- conversationEnded is the intentionally-narrowed dependency; see its own comment.
    }, [conversation?.id, conversationEnded]);

    function markPanelOpen(open: boolean) {
        panelOpenRef.current = open;
        reportViewing();
        if (open && conversation && tabVisibleRef.current) markConversationSeen(conversation);
    }

    function handleMessageChange(value: string) {
        setMessage(value);
        const socket = socketRef.current;
        if (!socket?.connected || !conversation) return;
        socket.emit("typing", { conversationId: conversation.id, isTyping: true });
        if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => socket.emit("typing", { conversationId: conversation.id, isTyping: false }), 1500);
    }

    /** `isRetry`: the live connection was tried first and gave no confirmation - the server then hands back the copy it may already have saved instead of saving a second one. */
    async function sendViaRest(conversationId: string, body: string, isRetry = false) {
        try {
            // systemMessage carries the "we're offline" autoresponder, if this was the
            // conversation's first customer message and support is off — the socket path
            // gets it via the room broadcast instead, but a REST send (used when the socket
            // isn't connected) has no broadcast to fall back on, so it rides along here.
            const result = await apiClient.post<ApiResponse<SupportMessage> & { systemMessage?: SupportMessage }>(`/support/conversation/${conversationId}/messages`, { body, ...(isRetry ? { retry: true } : {}) });
            const { data: sent, systemMessage } = result.data;
            setConversation((current) => {
                if (!current) return current;
                return { ...current, messages: mergeMessages(current.messages, systemMessage ? [sent, systemMessage] : [sent]) };
            });
        } catch (err) {
            // Whatever went wrong, the words go back in the box (ahead of anything typed since): a failed send never costs the customer their message.
            setMessage((current) => current.trim() ? `${body} ${current}` : body);
            if (httpStatus(err) === 403 && /closed|not active/i.test(getApiErrorMessage(err, ""))) {
                // The conversation was ended while this screen was not looking (an agent resolved it, or it was ended on another device).
                setConversation((current) => current && current.id === conversationId ? { ...current, status: "closed" } : current);
                toast.error("This conversation has ended, so that message wasn't sent. It is still in the box: start a new conversation and send it there.");
                return;
            }
            toast.error(getApiErrorMessage(err, "We couldn't send that message. Please try again."));
        }
    }

    async function sendMessage() {
        if (!conversation || !message.trim() || isEndedStatus(conversation.status)) return;
        const conversationId = conversation.id;
        const body = message.trim();
        setMessage("");
        if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
        socketRef.current?.emit("typing", { conversationId, isTyping: false });
        if (socketRef.current?.connected) {
            // 10s, not the socket.io default 20s — but well above the ~3-4s round trip
            // this backend's remote (Supabase-pooler) DB actually takes per message, so a
            // slow-but-successful ack doesn't get raced by the REST fallback and double-create.
            socketRef.current.timeout(10000).emit("send_message", { conversationId, text: body }, (err: unknown, response?: { ok: boolean }) => {
                if (err || !response?.ok) void sendViaRest(conversationId, body, true);
            });
            return;
        }
        await sendViaRest(conversationId, body);
    }

    async function handleAttachmentSelected(file: File | undefined) {
        if (!file || !conversation || isEndedStatus(conversation.status)) return;
        setUploadingAttachment(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const result = await apiClient.post<ApiResponse<SupportMessage> & { systemMessage?: SupportMessage }>(`/support/conversation/${conversation.id}/attachments`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const { data: sent, systemMessage } = result.data;
            setConversation((current) => current ? { ...current, messages: mergeMessages(current.messages, systemMessage ? [sent, systemMessage] : [sent]) } : current);
        } catch (err) {
            if (httpStatus(err) === 403 && /closed|not active/i.test(getApiErrorMessage(err, ""))) {
                setConversation((current) => current && current.id === conversation.id ? { ...current, status: "closed" } : current);
                toast.error("This conversation has ended, so that image wasn't sent. Start a new conversation and send it there.");
            } else {
                toast.error(getApiErrorMessage(err, "We couldn't send that attachment. Please try again."));
            }
        } finally {
            setUploadingAttachment(false);
        }
    }

    const currentStageField: "name" | "email" | undefined = stage === 0 ? "name" : stage === 1 ? "email" : undefined;

    async function advanceStage() {
        if (typeof stage !== "number" || !currentStageField) return;
        setStage(stage + 1);
    }

    async function dismissIntake() {
        try {
            if (conversation) {
                await apiClient.patch<ApiResponse<SupportConversation>>("/support/conversation/intake", {
                    name: form.name || undefined,
                    email: form.email || undefined,
                    category: form.category || undefined,
                    priority: form.urgent ? "urgent" : undefined,
                });
            }
            setStage("done");
        } catch (err) {
            toast.error(getApiErrorMessage(err, "We couldn't save those details. Please try again."));
        }
    }

    async function closeConversation() {
        if (!conversation) return;
        try {
            const result = await apiClient.post<{ keptOpen?: boolean }>(`/support/conversation/${conversation.id}/close`);
            if (result.data?.keptOpen) {
                // Nobody has answered the customer's last message yet, so the ticket is not closed - it stays in support's queue.
                const email = conversation.intakeEmail || form.email;
                toast.success(`Ticket ${conversation.referenceNumber} stays open. We haven't replied to your last message yet, so we'll answer here${email ? ` and by email at ${email}` : ""}.`);
                return;
            }
            setConversation({ ...conversation, status: "closed" });
        } catch (err) {
            toast.error(getApiErrorMessage(err, "We couldn't end this conversation. Please try again."));
        }
    }

    async function startNewConversation() {
        // The draft is kept on purpose: it may be a message that could not be sent to the conversation that just ended.
        setAgentTyping(false);
        await loadOrStartConversation();
    }

    return {
        conversation, loading, checkedForExisting, isOnline, unreadCount, replyToast, agentTyping,
        message, uploadingAttachment, form, setForm, stage,
        loadOrStartConversation, markPanelOpen, handleMessageChange, sendMessage,
        handleAttachmentSelected, advanceStage, dismissIntake, closeConversation, startNewConversation,
    };
}
