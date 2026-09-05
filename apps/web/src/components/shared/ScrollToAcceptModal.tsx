"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/shared/button";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

interface ScrollToAcceptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    title: string;
    children: React.ReactNode;
}

export function ScrollToAcceptModal({ isOpen, onClose, onAccept, title, children }: ScrollToAcceptModalProps) {
    const [hasScrolledToBottom, setHasScrolledToBottom] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Reset when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setHasScrolledToBottom(false);
            // In case content is too short to scroll
            const timer = setTimeout(() => {
                if (scrollRef.current) {
                    const { scrollHeight, clientHeight } = scrollRef.current;
                    if (scrollHeight <= clientHeight + 5) {
                        setHasScrolledToBottom(true);
                    }
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (hasScrolledToBottom) return;

        const target = e.currentTarget;
        const scrollPosition = target.scrollTop + target.clientHeight;
        const threshold = target.scrollHeight - 20; // 20px padding

        if (scrollPosition >= threshold) {
            setHasScrolledToBottom(true);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
                <DialogHeader className="px-6 py-4 border-b border-border bg-white z-10 shrink-0 shadow-sm">
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription className="text-sm text-muted">
                        Please scroll to the bottom of the document to accept.
                    </DialogDescription>
                </DialogHeader>

                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-slate-50"
                >
                    <div className="prose prose-sm prose-slate max-w-none">
                        {children}
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-border bg-white shrink-0 sm:justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <p className="text-xs text-muted max-sm:hidden">
                        By accepting, you agree to these {title.toLowerCase()}.
                    </p>
                    <Button
                        type="button"
                        variant={hasScrolledToBottom ? "primary" : "ghost"}
                        size="lg"
                        disabled={!hasScrolledToBottom}
                        onClick={() => {
                            if (hasScrolledToBottom) {
                                onAccept();
                            }
                        }}
                        className={cn(
                            "w-full sm:w-auto transition-all",
                            !hasScrolledToBottom && "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                        )}
                    >
                        <ShieldCheck className={cn("w-4 h-4 mr-2", hasScrolledToBottom ? "text-white" : "text-slate-400")} />
                        I Accept
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
