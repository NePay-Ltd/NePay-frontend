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

    const markConversationSeen = React.useCallback((data: SupportConversation) => {
        setUnreadCount(0);
        setReplyToast(false);
        if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
        const lastMessage = data.messages.at(-1);
        if (lastMessage) setLastSeenMessageId(data.id, lastMessage.id);
    }, []);

    const applyConversation = React.useCallback((data: SupportConversation, opts?: { markSeenIfOpen?: boolean }) => {
        setConversation(data);
        setForm({ name: data.intakeName ?? "", email: data.intakeEmail ?? "", category: data.category ?? "", urgent: data.priority === "urgent" });
        setStage(data.status !== "waiting" || (data.intakeName && data.intakeEmail) ? "done" : 0);
        if (opts?.markSeenIfOpen && isActivelyViewing()) {
            markConversationSeen(data);
        } else {
            setUnreadCount(countUnread(data.messages, getLastSeenMessageId(data.id)));
        }
    }, [isActivelyViewing, markConversationSeen]);

    // Tracks tab/window visibility for isActivelyViewing above, and re-checks "have they now
    // seen it" the moment the tab comes back into view while the panel is still open — e.g.
    // they alt-tabbed away mid-conversation and a reply arrived while they were gone.
    React.useEffect(() => {
        tabVisibleRef.current = document.visibilityState === "visible";
        const handleVisibilityChange = () => {
            tabVisibleRef.current = document.visibilityState === "visible";
            if (tabVisibleRef.current && panelOpenRef.current) {
                setConversation((current) => { if (current) markConversationSeen(current); return current; });
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [markConversationSeen]);

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
        socket.on("connect", () => socket.emit("join_conversation", { conversationId: conversation.id }));
        socket.on("message", (incoming: SupportMessage) => {
            setConversation((current) => current ? { ...current, messages: current.messages.some((item) => item.id === incoming.id) ? current.messages : [...current.messages, incoming] } : current);
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
        return () => { socket.disconnect(); socketRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- conversationEnded is the intentionally-narrowed dependency; see its own comment.
    }, [conversation?.id, conversationEnded]);

    function markPanelOpen(open: boolean) {
        panelOpenRef.current = open;
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

    async function sendViaRest(conversationId: string, body: string) {
        try {
            const result = await apiClient.post<ApiResponse<SupportMessage>>(`/support/conversation/${conversationId}/messages`, { body });
            setConversation((current) => current && !current.messages.some((item) => item.id === result.data.data.id) ? { ...current, messages: [...current.messages, result.data.data] } : current);
        } catch (err) {
            setMessage(body);
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
            socketRef.current.timeout(4000).emit("send_message", { conversationId, text: body }, (err: unknown, response?: { ok: boolean }) => {
                if (err || !response?.ok) void sendViaRest(conversationId, body);
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
            const result = await apiClient.post<ApiResponse<SupportMessage>>(`/support/conversation/${conversation.id}/attachments`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setConversation((current) => current && !current.messages.some((item) => item.id === result.data.data.id) ? { ...current, messages: [...current.messages, result.data.data] } : current);
        } catch (err) {
            toast.error(getApiErrorMessage(err, "We couldn't send that attachment. Please try again."));
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
            await apiClient.post(`/support/conversation/${conversation.id}/close`);
            setConversation({ ...conversation, status: "closed" });
        } catch (err) {
            toast.error(getApiErrorMessage(err, "We couldn't end this conversation. Please try again."));
        }
    }

    async function startNewConversation() {
        setMessage("");
        setAgentTyping(false);
        await loadOrStartConversation();
    }

    return {
        conversation, loading, checkedForExisting, unreadCount, replyToast, agentTyping,
        message, uploadingAttachment, form, setForm, stage,
        loadOrStartConversation, markPanelOpen, handleMessageChange, sendMessage,
        handleAttachmentSelected, advanceStage, dismissIntake, closeConversation, startNewConversation,
    };
}
