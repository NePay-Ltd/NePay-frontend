import * as React from "react";

/**
 * Dramatic, purely animation-driven loading state.
 * Smooth scale and fade using pure CSS.
 */
export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center bg-bg">
            <style>{`
                @keyframes dramatic-pulse {
                    0% { transform: scale(0.9); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fade-up-text {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-dramatic {
                    animation: dramatic-pulse 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-up {
                    animation: fade-up-text 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
                    opacity: 0;
                }
            `}</style>
            
            <img src="/logo.png" alt="NePay Logo" className="h-16 w-16 object-contain drop-shadow-[0_0_60px_rgba(124,58,237,0.5)] animate-dramatic" />
            
            <div className="mt-8 overflow-hidden">
                <h1 className="text-2xl font-black text-ink tracking-tight animate-fade-up">
                    NePay
                </h1>
            </div>
        </div>
    );
}
