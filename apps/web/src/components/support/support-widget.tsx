"use client";

import * as React from "react";
import { ArrowRight, MessageCircle, Send, X } from "lucide-react";
import { io, type Socket } from "socket.io-client";

import { apiClient, getTokens } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types/api";

interface SupportMessage { id: string; body: string; senderType: "customer" | "agent" | "system"; createdAt: string; }
interface AssignedAgent { id: string; name: string; avatarUrl: string | null; }
interface SupportConversation { id: string; status: "waiting" | "active" | "closed"; intakeName: string | null; intakeEmail: string | null; purpose: string | null; messages: SupportMessage[]; assignedAgent: AssignedAgent | null; }

const STARTED_KEY = "support-chat-started";

const INTAKE_STAGES: { field: "name" | "email" | "purpose"; placeholder: string; type: string }[] = [
    { field: "name", placeholder: "Your name", type: "text" },
    { field: "email", placeholder: "Email address", type: "email" },
    { field: "purpose", placeholder: "What can we help with?", type: "text" },
];

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

export function SupportWidget() {
    const [open, setOpen] = React.useState(false);
    const [started, setStarted] = React.useState(false);
    const [conversation, setConversation] = React.useState<SupportConversation | null>(null);
    const [form, setForm] = React.useState({ name: "", email: "", purpose: "" });
    const [stage, setStage] = React.useState<number | "done">(0);
    const [message, setMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [agentTyping, setAgentTyping] = React.useState(false);
    const [, setTick] = React.useState(0);
    const socketRef = React.useRef<Socket | null>(null);
    const typingTimeoutRef = React.useRef<number | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // Whether the visitor has already tapped "Start a chat" this browser
    // session — read once on mount so a widget re-open (without a page
    // reload) doesn't force them through the landing screen twice.
    React.useEffect(() => {
        if (typeof window !== "undefined" && window.sessionStorage.getItem(STARTED_KEY) === "1") setStarted(true);
    }, []);

    const loadConversation = React.useCallback(async () => {
        setLoading(true);
        try {
            const result = await apiClient.get<ApiResponse<SupportConversation>>("/support/conversation");
            const data = result.data.data;
            setConversation(data);
            setForm({ name: data.intakeName ?? "", email: data.intakeEmail ?? "", purpose: data.purpose ?? "" });
            const dismissed = typeof window !== "undefined" && window.sessionStorage.getItem(`support-intake-dismissed:${data.id}`) === "1";
            setStage(dismissed || data.status !== "waiting" || data.intakeName || data.intakeEmail || data.purpose ? "done" : 0);
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
        if (!conversation || conversation.status === "closed") return;
        const token = getTokens()?.accessToken;
        if (!token) return;
        const socket = io(`${socketOrigin()}/support`, { auth: { token }, transports: ["websocket"] });
        socketRef.current = socket;
        socket.on("connect", () => socket.emit("join_conversation", { conversationId: conversation.id }));
        socket.on("message", (incoming: SupportMessage) => setConversation((current) => current ? { ...current, messages: current.messages.some((item) => item.id === incoming.id) ? current.messages : [...current.messages, incoming] } : current));
        socket.on("typing", (payload: { senderType: "customer" | "agent"; isTyping: boolean }) => { if (payload.senderType === "agent") setAgentTyping(payload.isTyping); });
        socket.on("conversation_claimed", (agent: AssignedAgent) => setConversation((current) => current ? { ...current, assignedAgent: agent, status: "active" } : current));
        socket.on("conversation_closed", () => { setAgentTyping(false); setConversation((current) => current ? { ...current, status: "closed" } : current); });
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

    async function advanceStage() {
        if (stage === "done") return;
        if (stage < INTAKE_STAGES.length - 1) { setStage(stage + 1); return; }
        await dismissIntake();
    }

    const currentStage = typeof stage === "number" ? INTAKE_STAGES[stage] : undefined;

    async function dismissIntake() {
        if (conversation) {
            await apiClient.patch<ApiResponse<SupportConversation>>("/support/conversation/intake", { name: form.name || undefined, email: form.email || undefined, purpose: form.purpose || undefined });
            if (typeof window !== "undefined") window.sessionStorage.setItem(`support-intake-dismissed:${conversation.id}`, "1");
        }
        setStage("done");
    }

    async function sendViaRest(conversationId: string, body: string) {
        const result = await apiClient.post<ApiResponse<SupportMessage>>(`/support/conversation/${conversationId}/messages`, { body });
        setConversation((current) => current && !current.messages.some((item) => item.id === result.data.data.id) ? { ...current, messages: [...current.messages, result.data.data] } : current);
    }

    async function sendMessage() {
        if (!conversation || !message.trim() || conversation.status === "closed") return;
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

    async function closeConversation() {
        if (!conversation) return;
        await apiClient.post(`/support/conversation/${conversation.id}/close`);
        setConversation({ ...conversation, status: "closed" });
    }

    return <>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open support chat" className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-700 text-white shadow-xl shadow-violet-900/30 transition hover:scale-105 hover:bg-violet-800 active:scale-95 lg:bottom-8 lg:right-8"><MessageCircle className="h-6 w-6" /></button>
        {open && <div className="fixed inset-0 z-50 bg-black/20 lg:pointer-events-none lg:bg-transparent">
            <section className="pointer-events-auto absolute bottom-0 right-0 flex h-[min(720px,100vh)] w-full flex-col overflow-hidden bg-white shadow-2xl lg:bottom-8 lg:right-8 lg:h-[620px] lg:w-[390px] lg:rounded-3xl lg:border lg:border-border">
                <header className="flex items-center justify-between bg-gradient-to-r from-violet-950 to-violet-900 px-5 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"><MessageCircle className="h-4 w-4" /></span>
                        <div><p className="text-sm font-bold leading-tight">NePay support</p><p className="text-xs text-white/60">Private conversation with our team</p></div>
                    </div>
                    <div className="flex items-center gap-1">
                        {started && conversation && conversation.status !== "closed" && <button type="button" onClick={() => void closeConversation()} className="rounded-full px-2.5 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white">End chat</button>}
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close support chat" className="rounded-full p-1.5 transition hover:bg-white/10"><X className="h-4 w-4" /></button>
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
                </div>}

                {started && loading && <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-muted">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-100 border-t-violet-700" />
                    Connecting you to support...
                </div>}

                {started && !loading && conversation && <>
                    {conversation.status === "active" && conversation.assignedAgent && <div className="flex items-center gap-2 border-b border-border bg-violet-50/80 px-4 py-2.5 text-xs font-medium text-violet-900">
                        {conversation.assignedAgent.avatarUrl
                            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, not a local/next asset
                            ? <img src={conversation.assignedAgent.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover ring-2 ring-white" />
                            : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-200 text-[10px] font-semibold text-violet-700 ring-2 ring-white">{conversation.assignedAgent.name.charAt(0)}</span>}
                        <span>You are chatting with {conversation.assignedAgent.name}</span>
                    </div>}
                    <div className="flex-1 space-y-3.5 overflow-y-auto bg-[#fbfaff] p-4">
                        {conversation.messages.map((item) => <div key={item.id} className={item.senderType === "customer" ? "ml-10" : item.senderType === "system" ? "" : "mr-10"}>
                            <div className={item.senderType === "customer" ? "rounded-2xl rounded-br-sm bg-violet-700 px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-sm" : item.senderType === "system" ? "rounded-xl bg-violet-50 px-3 py-2 text-center text-xs text-violet-900" : "rounded-2xl rounded-bl-sm border border-border bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-sm"}>{item.body}</div>
                            {item.senderType !== "system" && <div className={`mt-1 text-[10px] text-muted/70 ${item.senderType === "customer" ? "text-right" : ""}`}>{timeAgoLabel(item.createdAt)}</div>}
                        </div>)}
                        {agentTyping && <TypingBubble />}
                        {conversation.status === "waiting" && <div className="rounded-xl border border-dashed border-violet-200 bg-white p-3 text-center text-xs text-muted">You are in the support queue. An agent will join here.</div>}
                        <div ref={messagesEndRef} />
                    </div>
                    {conversation.status !== "closed" && <div className="border-t border-border bg-white p-4">
                        {typeof stage === "number" && currentStage && <div className="mb-3.5">
                            <div className="mb-2.5 flex items-center gap-1.5">
                                {INTAKE_STAGES.map((item, index) => <span key={item.field} className={`h-1 flex-1 rounded-full transition-colors ${index <= stage ? "bg-violet-600" : "bg-violet-100"}`} />)}
                            </div>
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
                                <button type="button" onClick={() => void dismissIntake()} className="text-xs text-muted transition hover:text-ink">Skip and join queue</button>
                                <button type="button" onClick={() => void advanceStage()} className="rounded-full bg-violet-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-800">{stage === INTAKE_STAGES.length - 1 ? "Start chatting" : "Next"}</button>
                            </div>
                        </div>}
                        <div className="flex items-center gap-2 rounded-full border border-border bg-white py-1.5 pl-4 pr-1.5 shadow-sm transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
                            <input value={message} onChange={(event) => handleMessageChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendMessage(); }} placeholder="Write a message..." className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted" />
                            <button type="button" onClick={() => void sendMessage()} disabled={!message.trim()} aria-label="Send message" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-700 text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
                        </div>
                    </div>}
                    {conversation.status === "closed" && <div className="border-t border-border p-4 text-center text-sm text-muted">This conversation is closed.</div>}
                </>}
            </section>
        </div>}
    </>;
}
