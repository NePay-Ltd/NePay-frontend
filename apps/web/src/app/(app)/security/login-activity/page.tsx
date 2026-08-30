"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/date";
import { ChevronLeft, Monitor, Smartphone, Globe } from "lucide-react";

import { useLoginActivity } from "@/lib/queries/security";
import type { LoginActivity } from "@/lib/queries/security";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { RowItem } from "@/components/shared/row-item";
import { Tag } from "@/components/shared/tag";
import { Skeleton } from "@/components/shared/skeletons";

function getDeviceIcon(device: string) {
    const d = device.toLowerCase();
    if (d.includes("iphone") || d.includes("android") || d.includes("mobile") || d.includes("ios")) {
        return Smartphone;
    }
    if (d.includes("mac") || d.includes("windows") || d.includes("pc")) {
        return Monitor;
    }
    return Globe;
}

export default function LoginActivityPage() {
    const router = useRouter();
    const { data: activityList, isLoading } = useLoginActivity();

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.back()}
                    className="-ml-2 shrink-0 px-2"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-ink">Login Activity</h1>
                    <p className="mt-0.5 text-sm text-body">
                        Recent devices and locations that accessed your account.
                    </p>
                </div>
            </div>

            <Panel>
                <PanelBody className="p-0">
                    {isLoading || !activityList ? (
                        <div className="flex flex-col divide-y divide-border">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-5">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {activityList.map((log: LoginActivity) => {
                                const Icon = getDeviceIcon(log.device);
                                return (
                                    <RowItem
                                        key={log.id}
                                        icon={Icon}
                                        title={log.device}
                                        subtitle={`${log.location} • ${log.ipAddress}`}
                                        className="px-5 py-4"
                                        trailing={
                                            <div className="flex flex-col items-end gap-1">
                                                {log.isCurrentSession && (
                                                    <Tag variant="ok" dot>This device</Tag>
                                                )}
                                                <span className="text-xs text-muted">
                                                    {formatDateTime(log.timestamp)}
                                                </span>
                                                {/* TODO: Add "Revoke" action here later per requirements (DELETE /security/devices/:id) */}
                                            </div>
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                </PanelBody>
            </Panel>
        </div>
    );
}
