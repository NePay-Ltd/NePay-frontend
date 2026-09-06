"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, Mail, Book, ChevronRight, Linkedin, Instagram, Send, MessageSquare, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const XIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

export default function SupportPage() {
    const [socialModalOpen, setSocialModalOpen] = React.useState(false);

    const handleLiveChat = () => {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("open-support-chat"));
        }
    };

    return (
        <>
        <div className="mx-auto max-w-2xl px-4 py-8 lg:py-12">
            <header className="mb-8 text-center lg:text-left">
                <h1 className="text-2xl font-bold text-ink lg:text-3xl">Help and Support</h1>
                <p className="mt-2 text-sm text-muted">Get assistance, find answers, and connect with our team.</p>
            </header>

            <div className="space-y-8">
                {/* Chat Section */}
                <section>
                    <h2 className="mb-3 text-sm font-semibold text-ink">Chat</h2>
                    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                        <button
                            type="button"
                            onClick={handleLiveChat}
                            className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50 focus:bg-slate-50"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                                <MessageCircle className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-ink">Live Chat</p>
                                <p className="text-xs text-muted">Initiate a live chat conversation now.</p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                        </button>

                        <div className="h-px w-full bg-border" />

                        <a
                            href="https://wa.me/2348000000000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50 focus:bg-slate-50"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-ink">WhatsApp</p>
                                <p className="text-xs text-muted">Start a chat on WhatsApp now.</p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                        </a>
                    </div>
                </section>

                {/* Social Media Section */}
                <section>
                    <h2 className="mb-3 text-sm font-semibold text-ink">Social Media</h2>
                    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                        <button
                            type="button"
                            onClick={() => setSocialModalOpen(true)}
                            className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50 focus:bg-slate-50"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                                <Share2 className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-ink">Our official social media accounts</p>
                                <p className="text-xs text-muted">Follow us on X, LinkedIn, Instagram, and Telegram</p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                        </button>
                    </div>
                </section>

                {/* Email Section */}
                <section>
                    <h2 className="mb-3 text-sm font-semibold text-ink">Email</h2>
                    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                        <a
                            href="mailto:support@nepay.app"
                            className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50 focus:bg-slate-50"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-ink">support@nepay.app</p>
                                <p className="text-xs text-muted">Send us an email</p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                        </a>
                    </div>
                </section>

                {/* Help Center Section */}
                <section>
                    <h2 className="mb-3 text-sm font-semibold text-ink">Help Center</h2>
                    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                        <Link
                            href="/faq"
                            className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50 focus:bg-slate-50"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                <Book className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-ink leading-tight">FAQs on how to use NePay</p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                        </Link>
                    </div>
                </section>
            </div>
        </div>

        <Dialog open={socialModalOpen} onOpenChange={setSocialModalOpen}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-center text-ink font-bold">Our official social media accounts</DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center gap-6 pt-4 pb-2">
                    <a href="#" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:scale-110 shadow-sm">
                        <XIcon className="h-5 w-5" />
                    </a>
                    <a href="#" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0a66c2] text-white transition hover:scale-110 shadow-sm">
                        <Linkedin className="h-6 w-6" />
                    </a>
                    <a href="#" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] text-white transition hover:scale-110 shadow-sm">
                        <Instagram className="h-6 w-6" />
                    </a>
                    <a href="#" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2AABEE] text-white transition hover:scale-110 shadow-sm">
                        <Send className="h-6 w-6 -ml-0.5 mt-0.5" />
                    </a>
                </div>
            </DialogContent>
        </Dialog>
    </>
    );
}
