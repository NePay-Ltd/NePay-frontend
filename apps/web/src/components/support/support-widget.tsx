"use client";

import * as React from "react";
import { ArrowRight, MessageCircle, Paperclip, Send, X } from "lucide-react";
import { io, type Socket } from "socket.io-client";

import { apiClient, getTokens } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types/api";

type Status = "waiting" | "active" | "pending_agent" | "pending_customer" | "resolved" | "closed";
type Category = "deposit_issue" | "withdrawal_issue" | "kyc_verification" | "gift_card" | "other";

interface SupportMessage { id: string; body: string; attachmentUrl: string | null; senderType: "customer" | "agent" | "system"; createdAt: string; }
interface AssignedAgent { id: string; name: string; avatarUrl: string | null; }
interface SupportConversation { id: string; status: Status; referenceNumber: string; category: Category; priority: "normal" | "urgent"; intakeName: string | null; intakeEmail: string | null; purpose: string | null; messages: SupportMessage[]; assignedAgent: AssignedAgent | null; queuePosition: number | null; }

const STARTED_KEY = "support-chat-started";
const QUEUE_GREETING_PREFIX = "Tell us how we can help";
/** A conversation in either of these is done — no more replies expected, only "start a new one" from here. */
function isEndedStatus(status: Status): boolean { return status === "closed" || status === "resolved"; }
/** Still an assigned, ongoing relationship with an agent — as opposed to still waiting in the queue, or over. */
function isAssignedStatus(status: Status): boolean { return status === "active" || status === "pending_agent" || status === "pending_customer"; }

const INTAKE_STAGES: { field: "name" | "email"; placeholder: string; type: string }[] = [
    { field: "name", placeholder: "Your name", type: "text" },
    { field: "email", placeholder: "Email address", type: "email" },
];
const TOTAL_INTAKE_STAGES = INTAKE_STAGES.length + 1; // + the category stage

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
    { value: "deposit_issue", label: "Deposit issue" },
    { value: "withdrawal_issue", label: "Withdrawal issue" },
    { value: "kyc_verification", label: "KYC / Verification" },
    { value: "gift_card", label: "Gift card" },
    { value: "other", label: "Something else" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Name/email must actually be filled in (email format-checked) before advancing. An agent must always have a real name and email to work with. */
function isStageValid(field: "name" | "email", value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return field === "email" ? EMAIL_PATTERN.test(trimmed) : true;
}

function socketOrigin() {
    const configured = process.env.NEXT_PUBLIC_API_URL;
    return configured ? new URL(configured).origin : window.location.origin;
}

function timeAgoLabel(iso: string): string {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 1) return "0 min ago";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function TypingBubble() {
    return <div className="mr-10 flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-white px-3.5 py-2.5 shadow-sm">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-300" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-300" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-300" style={{ animationDelay: "300ms" }} />
    </div>;
}

function IntakeProgress({ current }: { current: number }) {
    return <div className="mb-2.5 flex items-center gap-1.5">
        {Array.from({ length: TOTAL_INTAKE_STAGES }, (_, index) => <span key={index} className={`h-1 flex-1 rounded-full transition-colors ${index <= current ? "bg-violet-600" : "bg-violet-100"}`} />)}
    </div>;
}

export function SupportWidget() {
    const [open, setOpen] = React.useState(false);
    const [started, setStarted] = React.useState(false);
    const [conversation, setConversation] = React.useState<SupportConversation | null>(null);
    const [form, setForm] = React.useState<{ name: string; email: string; category: Category | ""; urgent: boolean }>({ name: "", email: "", category: "", urgent: false });
    const [stage, setStage] = React.useState<number | "done">(0);
    const [message, setMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [agentTyping, setAgentTyping] = React.useState(false);
    const [uploadingAttachment, setUploadingAttachment] = React.useState(false);
    const [, setTick] = React.useState(0);
    const socketRef = React.useRef<Socket | null>(null);
    const typingTimeoutRef = React.useRef<number | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Whether the visitor has already tapped "Start a chat" this browser
    // session — read once on mount so a widget re-open (without a page
    // reload) doesn't force them through the landing screen twice.
    React.useEffect(() => {
        if (typeof window !== "undefined" && window.sessionStorage.getItem(STARTED_KEY) === "1") setStarted(true);
    }, []);

    // Global event listener so we can open the chat programmatically from other components.
    React.useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener("open-support-chat", handleOpen);
        return () => window.removeEventListener("open-support-chat", handleOpen);
    }, []);

    const loadConversation = React.useCallback(async () => {
        setLoading(true);
        try {
            const result = await apiClient.get<ApiResponse<SupportConversation>>("/support/conversation");
            const data = result.data.data;
            setConversation(data);
            setForm({ name: data.intakeName ?? "", email: data.intakeEmail ?? "", category: data.category ?? "", urgent: data.priority === "urgent" });
            // Name AND email specifically (not "any intake field") — a conversation
            // from before this requirement existed might only have a purpose set,
            // which should still gate on name/email like any other conversation.
            setStage(data.status !== "waiting" || (data.intakeName && data.intakeEmail) ? "done" : 0);
        } finally { setLoading(false); }
    }, []);

    React.useEffect(() => {
        if (!open || !started) return;
        void loadConversation();
    }, [open, started, loadConversation]);

    function startChat() {
        if (typeof window !== "undefined") window.sessionStorage.setItem(STARTED_KEY, "1");
        setStarted(true);
    }

    // Live "X min ago" labels need a periodic re-render — they aren't driven by any state change of their own.
    React.useEffect(() => {
        const timer = window.setInterval(() => setTick((t) => t + 1), 30000);
        return () => window.clearInterval(timer);
    }, []);

    React.useEffect(() => {
        if (!conversation || isEndedStatus(conversation.status)) return;
        const token = getTokens()?.accessToken;
        if (!token) return;
        const socket = io(`${socketOrigin()}/support`, { auth: { token }, transports: ["websocket"] });
        socketRef.current = socket;
        socket.on("connect", () => socket.emit("join_conversation", { conversationId: conversation.id }));
        socket.on("message", (incoming: SupportMessage) => setConversation((current) => current ? { ...current, messages: current.messages.some((item) => item.id === incoming.id) ? current.messages : [...current.messages, incoming] } : current));
        socket.on("typing", (payload: { senderType: "customer" | "agent"; isTyping: boolean }) => { if (payload.senderType === "agent") setAgentTyping(payload.isTyping); });
        socket.on("conversation_claimed", (agent: AssignedAgent) => setConversation((current) => current ? { ...current, assignedAgent: agent, status: "active" } : current));
        socket.on("queue_position", (payload: { position: number }) => setConversation((current) => current ? { ...current, queuePosition: payload.position } : current));
        socket.on("conversation_closed", () => { setAgentTyping(false); setConversation((current) => current ? { ...current, status: "closed" } : current); });
        socket.on("conversation_status_changed", (payload: { status: Status }) => setConversation((current) => current ? { ...current, status: payload.status } : current));
        return () => { socket.disconnect(); socketRef.current = null; };
    }, [conversation?.id, conversation?.status]);

    React.useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation?.messages.length]);

    function handleMessageChange(value: string) {
        setMessage(value);
        const socket = socketRef.current;
        if (!socket?.connected || !conversation) return;
        socket.emit("typing", { conversationId: conversation.id, isTyping: true });
        if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => socket.emit("typing", { conversationId: conversation.id, isTyping: false }), 1500);
    }

    const currentStage = typeof stage === "number" && stage < INTAKE_STAGES.length ? INTAKE_STAGES[stage] : undefined;

    async function advanceStage() {
        if (typeof stage !== "number" || !currentStage) return;
        if (!isStageValid(currentStage.field, form[currentStage.field])) return;
        setStage(stage + 1);
    }

    async function dismissIntake() {
        if (conversation) {
            await apiClient.patch<ApiResponse<SupportConversation>>("/support/conversation/intake", {
                name: form.name || undefined,
                email: form.email || undefined,
                category: form.category || undefined,
                priority: form.urgent ? "urgent" : undefined,
            });
        }
        setStage("done");
    }

    async function sendViaRest(conversationId: string, body: string) {
        const result = await apiClient.post<ApiResponse<SupportMessage>>(`/support/conversation/${conversationId}/messages`, { body });
        setConversation((current) => current && !current.messages.some((item) => item.id === result.data.data.id) ? { ...current, messages: [...current.messages, result.data.data] } : current);
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

    // File attachments are REST-only (no sane way to multipart a file over a
    // socket event), unlike text which tries the socket first — the backend
    // broadcasts the resulting message itself, so the agent sees it live.
    async function handleAttachmentSelected(file: File | undefined) {
        if (!file || !conversation || isEndedStatus(conversation.status)) return;
        setUploadingAttachment(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const result = await apiClient.post<ApiResponse<SupportMessage>>(`/support/conversation/${conversation.id}/attachments`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setConversation((current) =>
                current && !current.messages.some((item) => item.id === result.data.data.id) ? { ...current, messages: [...current.messages, result.data.data] } : current,
            );
        } finally {
            setUploadingAttachment(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function closeConversation() {
        if (!conversation) return;
        await apiClient.post(`/support/conversation/${conversation.id}/close`);
        setConversation({ ...conversation, status: "closed" });
    }

    // The closed conversation stays closed server-side, so re-fetching
    // /support/conversation naturally creates a fresh waiting one — same
    // path as opening the widget for the first time.
    async function startNewConversation() {
        setMessage("");
        setAgentTyping(false);
        await loadConversation();
    }

    return <>
        {open && <div className="fixed inset-0 z-50 bg-black/20 lg:pointer-events-none lg:bg-transparent">
            <section className="pointer-events-auto absolute bottom-0 right-0 flex h-[min(720px,100vh)] w-full flex-col overflow-hidden bg-white shadow-2xl lg:bottom-8 lg:right-8 lg:h-[620px] lg:w-[390px] lg:rounded-3xl lg:border lg:border-border">
                <header className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-white">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15"><MessageCircle className="h-4 w-4" /></span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold leading-tight">NePay support</p>
                            <p className="truncate text-[11px] text-white/70">{conversation?.referenceNumber ? `Ref ${conversation.referenceNumber} · Saved for quality & training` : "Saved for quality & training"}</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        {started && conversation && !isEndedStatus(conversation.status) && <button type="button" onClick={() => void closeConversation()} className="shrink-0 whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-violet-800 shadow-sm transition hover:bg-violet-50 active:scale-95">End chat</button>}
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close support chat" className="shrink-0 rounded-full p-1.5 transition hover:bg-white/15"><X className="h-4 w-4" /></button>
                    </div>
                </header>

                {!started && <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#fbfaff] to-white px-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700"><MessageCircle className="h-7 w-7" /></div>
                    <div>
                        <p className="text-base font-semibold text-ink">Need a hand?</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">Our support team is ready to help. Start a conversation and we&apos;ll take it from there.</p>
                    </div>
                    <button type="button" onClick={startChat} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-violet-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-700/25 transition hover:bg-violet-800 active:scale-[0.98]">
                        Start a chat <ArrowRight className="h-4 w-4" />
                    </button>
                    <a href="/faq" className="mt-1 text-sm text-muted transition hover:text-ink">Or browse the FAQ →</a>
                </div>}

                {started && loading && <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-muted">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-100 border-t-violet-700" />
                    Connecting you to support...
                </div>}

                {started && !loading && conversation && <>
                    {isAssignedStatus(conversation.status) && conversation.assignedAgent && <div className="flex items-center gap-2 border-b border-border bg-violet-50/80 px-4 py-2.5 text-xs font-medium text-violet-900">
                        {conversation.assignedAgent.avatarUrl
                            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, not a local/next asset
                            ? <img src={conversation.assignedAgent.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover ring-2 ring-white" />
                            : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-200 text-[10px] font-semibold text-violet-700 ring-2 ring-white">{conversation.assignedAgent.name.charAt(0)}</span>}
                        <span>You are chatting with {conversation.assignedAgent.name}</span>
                    </div>}
                    <div className="flex-1 space-y-3.5 overflow-y-auto bg-[#fbfaff] p-4">
                        {conversation.messages
                            .filter((item) => !(item.senderType === "system" && item.body.startsWith(QUEUE_GREETING_PREFIX) && conversation.messages.some((other) => other.senderType !== "system")))
                            .map((item) => <div key={item.id} className={`flex flex-col ${item.senderType === "customer" ? "items-end" : item.senderType === "system" ? "items-center" : "items-start"}`}>
                                {item.attachmentUrl
                                    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, not a local/next asset
                                    ? <img src={item.attachmentUrl} alt="Attachment" className="h-[200px] w-[200px] rounded-2xl object-cover shadow-sm" />
                                    : <div className={item.senderType === "customer" ? "w-fit max-w-[80%] break-words rounded-2xl rounded-br-sm bg-violet-700 px-3.5 py-2 text-sm leading-relaxed text-white shadow-sm" : item.senderType === "system" ? "w-fit max-w-[90%] break-words rounded-xl bg-violet-50 px-3 py-2 text-center text-xs text-violet-900" : "w-fit max-w-[80%] break-words rounded-2xl rounded-bl-sm border border-border bg-white px-3.5 py-2 text-sm leading-relaxed text-ink shadow-sm"}>{item.body}</div>}
                                {item.senderType !== "system" && <div className="mt-1 text-[10px] text-muted/70">{timeAgoLabel(item.createdAt)}</div>}
                            </div>)}
                        {agentTyping && <TypingBubble />}
                        {conversation.status === "waiting" && <div className="rounded-xl border border-dashed border-violet-200 bg-white p-3 text-center text-xs text-muted">{conversation.queuePosition === 1 ? "You're next — a real person will join this chat shortly." : conversation.queuePosition ? `You're #${conversation.queuePosition} in line — a real person will join this chat shortly.` : "You're in the queue — a real person will join this chat shortly."} Thanks for your patience!</div>}
                        {conversation.status === "pending_agent" && <div className="rounded-xl border border-dashed border-violet-200 bg-white p-3 text-center text-xs text-muted">We&apos;re still looking into this and will follow up right here — no need to keep this window open.</div>}
                        <div ref={messagesEndRef} />
                    </div>
                    {!isEndedStatus(conversation.status) && <div className="border-t border-border bg-white p-4">
                        {currentStage && <div className="mb-3.5">
                            <IntakeProgress current={typeof stage === "number" ? stage : 0} />
                            <input
                                autoFocus
                                value={form[currentStage.field]}
                                onChange={(event) => setForm({ ...form, [currentStage.field]: event.target.value })}
                                onKeyDown={(event) => { if (event.key === "Enter") void advanceStage(); }}
                                type={currentStage.type}
                                placeholder={currentStage.placeholder}
                                className="mb-2.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted">Required to chat with an agent</span>
                                <button
                                    type="button"
                                    onClick={() => void advanceStage()}
                                    disabled={!isStageValid(currentStage.field, form[currentStage.field])}
                                    className="rounded-full bg-violet-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40"
                                >Next</button>
                            </div>
                        </div>}
                        {stage === INTAKE_STAGES.length && <div className="mb-3.5">
                            <IntakeProgress current={INTAKE_STAGES.length} />
                            <p className="mb-2 text-xs font-medium text-ink">What&apos;s this about?</p>
                            <div className="mb-2.5 grid grid-cols-2 gap-1.5">
                                {CATEGORY_OPTIONS.map((option) => <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, category: option.value })}
                                    className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition ${form.category === option.value ? "border-violet-600 bg-violet-50 text-violet-800" : "border-border text-ink hover:border-violet-200"}`}
                                >{option.label}</button>)}
                            </div>
                            <label className="mb-2.5 flex items-center gap-2 text-xs text-muted">
                                <input type="checkbox" checked={form.urgent} onChange={(event) => setForm({ ...form, urgent: event.target.checked })} className="h-3.5 w-3.5 rounded border-border text-violet-700 focus:ring-violet-400" />
                                This is urgent
                            </label>
                            <div className="flex items-center justify-between">
                                <button type="button" onClick={() => void dismissIntake()} className="text-xs text-muted transition hover:text-ink">Skip</button>
                                <button type="button" onClick={() => void dismissIntake()} className="rounded-full bg-violet-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-800">Start chatting</button>
                            </div>
                        </div>}
                        {stage === "done" && <div className="flex items-end gap-2">
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => void handleAttachmentSelected(event.target.files?.[0])} />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAttachment}
                                aria-label="Attach an image"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {uploadingAttachment ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-100 border-t-violet-700" /> : <Paperclip className="h-4 w-4" />}
                            </button>
                            <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-white py-1.5 pl-4 pr-1.5 shadow-sm transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
                                <input value={message} onChange={(event) => handleMessageChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendMessage(); }} placeholder="Write a message..." className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted" />
                                <button type="button" onClick={() => void sendMessage()} disabled={!message.trim()} aria-label="Send message" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-700 text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
                            </div>
                        </div>}
                    </div>}
                    {isEndedStatus(conversation.status) && <div className="border-t border-border p-4 text-center">
                        <p className="mb-3 text-sm text-muted">{conversation.status === "resolved" ? "This conversation was marked resolved. Glad we could help — reach out again any time." : "This conversation has ended. We hope we sorted things out — reach out again any time."}</p>
                        <button type="button" onClick={() => void startNewConversation()} className="rounded-full bg-violet-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-800">Start a new conversation</button>
                    </div>}
                </>}
            </section>
        </div>}
    </>;
}
