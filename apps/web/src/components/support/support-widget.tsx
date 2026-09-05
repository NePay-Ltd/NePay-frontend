"use client";

import * as React from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { io, type Socket } from "socket.io-client";

import { apiClient, getTokens } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types/api";

interface SupportMessage { id: string; body: string; senderType: "customer" | "agent" | "system"; createdAt: string; }
interface SupportConversation { id: string; status: "waiting" | "active" | "closed"; intakeName: string | null; intakeEmail: string | null; purpose: string | null; messages: SupportMessage[]; }

function socketOrigin() {
    const configured = process.env.NEXT_PUBLIC_API_URL;
    return configured ? new URL(configured).origin : window.location.origin;
}

export function SupportWidget() {
    const [open, setOpen] = React.useState(false);
    const [conversation, setConversation] = React.useState<SupportConversation | null>(null);
    const [form, setForm] = React.useState({ name: "", email: "", purpose: "" });
    const [message, setMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const socketRef = React.useRef<Socket | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const loadConversation = React.useCallback(async () => {
        setLoading(true);
        try {
            const result = await apiClient.get<ApiResponse<SupportConversation>>("/support/conversation");
            setConversation(result.data.data);
            setForm({ name: result.data.data.intakeName ?? "", email: result.data.data.intakeEmail ?? "", purpose: result.data.data.purpose ?? "" });
        } finally { setLoading(false); }
    }, []);

    React.useEffect(() => {
        if (!open) return;
        void loadConversation();
    }, [open, loadConversation]);

    React.useEffect(() => {
        if (!conversation || conversation.status === "closed") return;
        const token = getTokens()?.accessToken;
        if (!token) return;
        const socket = io(`${socketOrigin()}/support`, { auth: { token }, transports: ["websocket"] });
        socketRef.current = socket;
        socket.on("connect", () => socket.emit("join_conversation", { conversationId: conversation.id }));
        socket.on("message", (incoming: SupportMessage) => setConversation((current) => current ? { ...current, messages: current.messages.some((item) => item.id === incoming.id) ? current.messages : [...current.messages, incoming] } : current));
        return () => { socket.disconnect(); socketRef.current = null; };
    }, [conversation?.id, conversation?.status]);

    React.useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation?.messages.length]);

    async function saveIntake(joinQueue = false) {
        if (!conversation) return;
        const result = await apiClient.patch<ApiResponse<SupportConversation>>("/support/conversation/intake", { name: form.name || undefined, email: form.email || undefined, purpose: form.purpose || undefined });
        setConversation((current) => current ? { ...current, ...result.data.data } : current);
        if (joinQueue) await loadConversation();
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
        <button type="button" onClick={() => setOpen(true)} aria-label="Open support chat" className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-700 text-white shadow-xl transition hover:bg-violet-800 lg:bottom-8 lg:right-8"><MessageCircle className="h-6 w-6" /></button>
        {open && <div className="fixed inset-0 z-50 bg-black/20 lg:pointer-events-none lg:bg-transparent">
            <section className="pointer-events-auto absolute bottom-0 right-0 flex h-[min(720px,100vh)] w-full flex-col overflow-hidden bg-white shadow-2xl lg:bottom-8 lg:right-8 lg:h-[620px] lg:w-[390px] lg:rounded-3xl lg:border lg:border-border">
                <header className="flex items-center justify-between bg-violet-950 px-5 py-4 text-white"><div><p className="font-bold">NePay support</p><p className="text-xs text-white/70">Private conversation with our team</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close support chat"><X className="h-5 w-5" /></button></header>
                {loading && <div className="flex flex-1 items-center justify-center text-sm text-muted">Loading support...</div>}
                {!loading && conversation && <>
                    <div className="flex-1 space-y-3 overflow-y-auto bg-[#fbfaff] p-4">
                        {conversation.messages.map((item) => <div key={item.id} className={item.senderType === "customer" ? "ml-8 rounded-2xl rounded-br-sm bg-violet-700 px-3 py-2 text-sm text-white" : item.senderType === "system" ? "rounded-xl bg-violet-50 px-3 py-2 text-center text-xs text-violet-900" : "mr-8 rounded-2xl rounded-bl-sm border border-border bg-white px-3 py-2 text-sm text-ink"}>{item.body}</div>)}
                        {conversation.status === "waiting" && <div className="rounded-xl border border-dashed border-violet-200 bg-white p-3 text-center text-xs text-muted">You are in the support queue. An agent will join here.</div>}
                        <div ref={messagesEndRef} />
                    </div>
                    {conversation.status !== "closed" && <div className="border-t border-border bg-white p-4">
                        <div className="mb-3 grid gap-2">
                            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name (optional)" className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-violet-400" />
                            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email (optional)" type="email" className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-violet-400" />
                            <input value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} placeholder="What can we help with?" className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-violet-400" />
                        </div>
                        <div className="mb-3 flex gap-2"><button type="button" onClick={() => void saveIntake(true)} className="text-xs font-semibold text-violet-700">Save details</button><button type="button" onClick={() => void saveIntake(true)} className="text-xs text-muted">Skip and join queue</button><button type="button" onClick={() => void closeConversation()} className="ml-auto text-xs text-muted">End chat</button></div>
                        <div className="flex gap-2"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendMessage(); }} placeholder="Write a message..." className="min-w-0 flex-1 rounded-full border border-border px-4 py-2 text-sm outline-none focus:border-violet-400" /><button type="button" onClick={() => void sendMessage()} aria-label="Send message" className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-700 text-white"><Send className="h-4 w-4" /></button></div>
                    </div>}
                    {conversation.status === "closed" && <div className="border-t border-border p-4 text-center text-sm text-muted">This conversation is closed.</div>}
                </>}
            </section>
        </div>}
    </>;
}
