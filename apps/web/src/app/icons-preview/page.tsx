"use client";

import * as React from "react";
import * as Icons from "@/components/icons";

export default function IconsPreviewPage() {
    const iconNames = Object.keys(Icons).filter(name => name.startsWith("Icon") && name !== "IconProps");

    return (
        <div className="mx-auto max-w-5xl space-y-12 p-8 bg-background min-h-screen">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-ink">NePay Custom Icon System</h1>
                <p className="mt-2 text-sm text-body">
                    Reviewing custom SVGs featuring the distinct 1.75px stroke and "Ring Gap" motif.
                </p>
            </div>

            <section className="space-y-6">
                <h2 className="text-xl font-bold text-ink border-b pb-2">24px Render Size</h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6">
                    {iconNames.map(name => {
                        // @ts-ignore
                        const IconComponent = Icons[name];
                        return (
                            <div key={name} className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-gray-50 dark:bg-zinc-900">
                                <div className="text-violet-600">
                                    <IconComponent size={24} />
                                </div>
                                <span className="text-[10px] text-muted truncate max-w-full font-mono">{name.replace('Icon', '')}</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-xl font-bold text-ink border-b pb-2">16px Render Size</h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6">
                    {iconNames.map(name => {
                        // @ts-ignore
                        const IconComponent = Icons[name];
                        return (
                            <div key={name} className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-gray-50 dark:bg-zinc-900">
                                <div className="text-violet-600">
                                    <IconComponent size={16} />
                                </div>
                                <span className="text-[10px] text-muted truncate max-w-full font-mono">{name.replace('Icon', '')}</span>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
