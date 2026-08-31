"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Bell, BellRing, ArrowRight } from "lucide-react";
import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { cn } from "@/lib/cn";

export interface ComingSoonProps {
    title: string;
    description: string;
    icon: React.ElementType;
    timeframe?: string;
    // Waitlist integration
    isWaitlisted?: boolean;
    isWaitlisting?: boolean;
    onJoinWaitlist?: () => void;
    // Design
    glowColorHex?: string;
    // Optional illustration element to replace the static icon
    illustration?: React.ReactNode;
}

export function ComingSoon({
    title,
    description,
    icon: Icon,
    timeframe,
    isWaitlisted,
    isWaitlisting,
    onJoinWaitlist,
    glowColorHex = "rgba(124, 58, 237, 0.25)", // Default violet glow
    illustration,
}: ComingSoonProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[75vh] px-2 sm:px-6 w-full py-6 sm:py-12">
            <Panel className="w-full max-w-lg mx-auto text-center rounded-[24px] sm:rounded-[32px] border-2 border-white/60 dark:border-white/5 overflow-hidden relative shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl">
                
                {/* Ambient Radial Glow */}
                <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] -z-10 animate-[pulse_6s_ease-in-out_infinite]"
                    style={{ background: `radial-gradient(circle, ${glowColorHex} 0%, transparent 60%)` }}
                />
                
                <PanelBody className="p-6 py-10 sm:p-14 flex flex-col items-center relative z-10">
                    
                    {/* Visual Area */}
                    <div className="relative mb-10 w-full flex justify-center">
                        {illustration ? (
                            illustration
                        ) : (
                            <div className="relative group">
                                {/* Soft pulsing rings */}
                                <div className="absolute inset-0 rounded-full bg-current opacity-20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ color: glowColorHex }} />
                                <div className="absolute inset-[-15px] rounded-full bg-current opacity-10 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]" style={{ color: glowColorHex }} />
                                
                                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center relative shadow-xl shadow-black/5 bg-white dark:bg-gray-950 border-4 border-white/50 dark:border-white/10">
                                    <Icon className="w-12 h-12 sm:w-16 sm:h-16 relative z-10 transition-transform group-hover:scale-110 duration-500 text-ink dark:text-white" strokeWidth={1.5} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeframe Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 border border-border mb-6 shadow-sm backdrop-blur-md">
                        <Clock className="w-4 h-4 text-muted" />
                        <span className="text-xs font-black tracking-widest uppercase text-muted">
                            {timeframe || "Coming Soon"}
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight mb-4">
                        {title}
                    </h1>
                    
                    <p className="text-base sm:text-lg text-muted font-medium max-w-sm leading-relaxed mb-10">
                        {description}
                    </p>

                    <div className="w-full flex flex-col gap-3">
                        {onJoinWaitlist && (
                            <Button 
                                variant={isWaitlisted ? "quiet" : "primary"}
                                size="lg"
                                fullWidth
                                className={cn(
                                    "h-14 rounded-2xl font-bold text-[15px] sm:text-base shadow-lg transition-all duration-300",
                                    isWaitlisted 
                                        ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 shadow-none ring-1 ring-inset ring-green-500/20" 
                                        : "bg-ink text-white hover:bg-gray-800 dark:bg-white dark:text-ink shadow-black/10 hover:-translate-y-0.5"
                                )}
                                onClick={onJoinWaitlist}
                                disabled={isWaitlisted || isWaitlisting}
                                loading={isWaitlisting}
                            >
                                {isWaitlisted ? (
                                    <>
                                        <BellRing className="mr-2 h-5 w-5" />
                                        You&apos;re on the waitlist!
                                    </>
                                ) : (
                                    <>
                                        <Bell className="mr-2 h-5 w-5" />
                                        Notify me when this launches
                                    </>
                                )}
                            </Button>
                        )}

                        <Button 
                            variant="quiet" 
                            size="lg" 
                            fullWidth
                            className="h-14 rounded-2xl font-bold text-[15px] sm:text-base hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                            onClick={() => router.push("/services")}
                        >
                            Explore other services
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </PanelBody>
            </Panel>
        </div>
    );
}
