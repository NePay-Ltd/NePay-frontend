"use client";

import * as React from "react";
import { ArrowLeft, MessageCircle, Paperclip, Send } from "lucide-react";

import { isAssignedStatus, isEndedStatus, type SupportCategory, type useSupportConversation } from "@/lib/hooks/use-support-conversation";

const QUEUE_GREETING_PREFIX = "Tell us how we can help";

const INTAKE_STAGES: { field: "name" | "email"; placeholder: string; type: string }[] = [
    { field: "name", placeholder: "Your name", type: "text" },
    { field: "email", placeholder: "Email address", type: "email" },
];
const TOTAL_INTAKE_STAGES = INTAKE_STAGES.length + 1; // + the category stage

const CATEGORY_OPTIONS: { value: SupportCategory; label: string }[] = [
    { value: "deposit_issue", label: "Deposit issue" },
    { value: "withdrawal_issue", label: "Withdrawal issue" },
    { value: "kyc_verification", label: "KYC / Verification" },
    { value: "gift_card", label: "Gift card" },
    { value: "other", label: "Something else" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStageValid(field: "name" | "email", value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return field === "email" ? EMAIL_PATTERN.test(trimmed) : true;
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

/**
 * The chat UI itself — deliberately not a floating overlay. Support is only
 * reachable from the Help & Support page, so this renders inline as part of
 * that page's own layout. All conversation/socket state lives in
 * useSupportConversation (called by the page, not here) so switching back to
 * the contact-options list doesn't drop the connection or unread tracking —
 * this component only calls markPanelOpen so that hook knows when messages
 * are actually being looked at.
 */
interface SupportChatPanelProps {
    onBack: () => void;
    support: ReturnType<typeof useSupportConversation>;
}

export function SupportChatPanel({ onBack, support }: SupportChatPanelProps) {
    const { conversation } = support;
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [, setTick] = React.useState(0);

    React.useEffect(() => {
        support.markPanelOpen(true);
        return () => support.markPanelOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount only, mirroring the widget's original open/close semantics.
    }, []);

    // Live "X min ago" labels need a periodic re-render — they aren't driven by any state change of their own.
    React.useEffect(() => {
        const timer = window.setInterval(() => setTick((t) => t + 1), 30000);
        return () => window.clearInterval(timer);
    }, []);

    React.useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation?.messages.length]);

    const currentStage = typeof support.stage === "number" && support.stage < INTAKE_STAGES.length ? INTAKE_STAGES[support.stage] : undefined;

    async function handleAdvance() {
        if (!currentStage) return;
        if (!isStageValid(currentStage.field, support.form[currentStage.field])) return;
        await support.advanceStage();
    }

    return <section className="flex h-[min(680px,calc(100vh-140px))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <header className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-white">
            <button type="button" onClick={onBack} aria-label="Back to Help and Support" className="shrink-0 rounded-full p-1.5 transition hover:bg-white/15"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15"><MessageCircle className="h-4 w-4" /></span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold leading-tight">NePay support</p>
                    <p className="truncate text-[11px] text-white/70">{conversation?.referenceNumber ? `Ref ${conversation.referenceNumber} · Saved for quality & training` : "Saved for quality & training"}</p>
                </div>
            </div>
            {conversation && !isEndedStatus(conversation.status) && <button type="button" onClick={() => void support.closeConversation()} className="shrink-0 whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-violet-800 shadow-sm transition hover:bg-violet-50 active:scale-95">End chat</button>}
        </header>

        {(support.loading || !support.checkedForExisting) && <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-muted">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-100 border-t-violet-700" />
            Connecting you to support...
        </div>}

        {support.checkedForExisting && !support.loading && !conversation && <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#fbfaff] to-white px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700"><MessageCircle className="h-7 w-7" /></div>
            <div>
                <p className="text-base font-semibold text-ink">Need a hand?</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">Our support team is ready to help. Start a conversation and we&apos;ll take it from there.</p>
            </div>
            {/* The only place that ever creates a conversation — deliberately never automatic
                on mount, or merely visiting Help & Support would leave a phantom waiting
                conversation (with its system greeting) behind for anyone who never intended to chat. */}
            <button type="button" onClick={() => void support.loadOrStartConversation()} className="mt-2 rounded-full bg-violet-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-700/25 transition hover:bg-violet-800 active:scale-[0.98]">
                Start a chat
            </button>
        </div>}

        {support.checkedForExisting && !support.loading && conversation && <>
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
                {support.agentTyping && <TypingBubble />}
                {conversation.status === "waiting" && <div className="rounded-xl border border-dashed border-violet-200 bg-white p-3 text-center text-xs text-muted">{conversation.queuePosition === 1 ? "You're next. A real person will join this chat shortly." : conversation.queuePosition ? `You're #${conversation.queuePosition} in line. A real person will join this chat shortly.` : "You're in the queue. A real person will join this chat shortly."} Thanks for your patience!</div>}
                {conversation.status === "pending_agent" && <div className="rounded-xl border border-dashed border-violet-200 bg-white p-3 text-center text-xs text-muted">We&apos;re still looking into this and will follow up right here.</div>}
                <div ref={messagesEndRef} />
            </div>
            {!isEndedStatus(conversation.status) && <div className="border-t border-border bg-white p-4">
                {currentStage && <div className="mb-3.5">
                    <IntakeProgress current={typeof support.stage === "number" ? support.stage : 0} />
                    <input
                        autoFocus
                        value={support.form[currentStage.field]}
                        onChange={(event) => support.setForm({ ...support.form, [currentStage.field]: event.target.value })}
                        onKeyDown={(event) => { if (event.key === "Enter") void handleAdvance(); }}
                        type={currentStage.type}
                        placeholder={currentStage.placeholder}
                        className="mb-2.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted">Required to chat with an agent</span>
                        <button
                            type="button"
                            onClick={() => void handleAdvance()}
                            disabled={!isStageValid(currentStage.field, support.form[currentStage.field])}
                            className="rounded-full bg-violet-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >Next</button>
                    </div>
                </div>}
                {support.stage === INTAKE_STAGES.length && <div className="mb-3.5">
                    <IntakeProgress current={INTAKE_STAGES.length} />
                    <p className="mb-2 text-xs font-medium text-ink">What&apos;s this about?</p>
                    <div className="mb-2.5 grid grid-cols-2 gap-1.5">
                        {CATEGORY_OPTIONS.map((option) => <button
                            key={option.value}
                            type="button"
                            onClick={() => support.setForm({ ...support.form, category: option.value })}
                            className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition ${support.form.category === option.value ? "border-violet-600 bg-violet-50 text-violet-800" : "border-border text-ink hover:border-violet-200"}`}
                        >{option.label}</button>)}
                    </div>
                    <label className="mb-2.5 flex items-center gap-2 text-xs text-muted">
                        <input type="checkbox" checked={support.form.urgent} onChange={(event) => support.setForm({ ...support.form, urgent: event.target.checked })} className="h-3.5 w-3.5 rounded border-border text-violet-700 focus:ring-violet-400" />
                        This is urgent
                    </label>
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={() => void support.dismissIntake()} className="text-xs text-muted transition hover:text-ink">Skip</button>
                        <button type="button" onClick={() => void support.dismissIntake()} className="rounded-full bg-violet-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-800">Start chatting</button>
                    </div>
                </div>}
                {support.stage === "done" && <div className="flex items-end gap-2">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => void support.handleAttachmentSelected(event.target.files?.[0])} />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={support.uploadingAttachment}
                        aria-label="Attach an image"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {support.uploadingAttachment ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-100 border-t-violet-700" /> : <Paperclip className="h-4 w-4" />}
                    </button>
                    <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-white py-1.5 pl-4 pr-1.5 shadow-sm transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
                        <input value={support.message} onChange={(event) => support.handleMessageChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void support.sendMessage(); }} placeholder="Write a message..." className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted" />
                        <button type="button" onClick={() => void support.sendMessage()} disabled={!support.message.trim()} aria-label="Send message" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-700 text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
                    </div>
                </div>}
            </div>}
            {isEndedStatus(conversation.status) && <div className="border-t border-border p-4 text-center">
                <p className="mb-3 text-sm text-muted">{conversation.status === "resolved" ? "This conversation was marked resolved. Glad we could help, reach out again any time." : "This conversation has ended. We hope we sorted things out, reach out again any time."}</p>
                <button type="button" onClick={() => void support.startNewConversation()} className="rounded-full bg-violet-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-800">Start a new conversation</button>
            </div>}
        </>}
    </section>;
}
