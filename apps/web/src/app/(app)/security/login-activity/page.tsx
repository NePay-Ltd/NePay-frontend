"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/date";
import { ChevronLeft, Monitor, Smartphone, Globe, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { useLoginActivity, useRevokeLoginActivity } from "@/lib/queries/security";
import type { LoginActivity } from "@/lib/queries/security";

import { Button } from "@/components/shared/button";
import { Panel, PanelBody } from "@/components/shared/panel";
import { RowItem } from "@/components/shared/row-item";
import { Tag } from "@/components/shared/tag";
import { Skeleton } from "@/components/shared/skeletons";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    const { mutateAsync: revokeSession, isPending: isRevoking } = useRevokeLoginActivity();

    const [revokeTarget, setRevokeTarget] = React.useState<LoginActivity | null>(null);

    const confirmRevoke = async () => {
        if (!revokeTarget) return;
        try {
            const { revoked } = await revokeSession(revokeTarget.id);
            toast.success(
                revoked
                    ? "Session revoked. That device has been signed out."
                    : "That session had already ended — nothing to revoke.",
            );
            setRevokeTarget(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to revoke session.");
        }
    };

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
                                            <div className="flex flex-col items-end gap-1.5">
                                                {log.isCurrentSession && (
                                                    <Tag variant="ok" dot>This device</Tag>
                                                )}
                                                <span className="text-xs text-muted">
                                                    {formatDateTime(log.timestamp)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setRevokeTarget(log)}
                                                    className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                                                >
                                                    <ShieldOff className="h-3 w-3" />
                                                    Revoke
                                                </button>
                                            </div>
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                </PanelBody>
            </Panel>

            <AlertDialog
                open={!!revokeTarget}
                onOpenChange={(open) => {
                    if (!open && !isRevoking) setRevokeTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {revokeTarget?.isCurrentSession
                                ? `This is your current device (${revokeTarget?.device ?? "this session"}). Revoking it will sign you out immediately.`
                                : `${revokeTarget?.device ?? "This device"} will no longer be able to use its existing session.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button" disabled={isRevoking}>
                            Cancel
                        </AlertDialogCancel>
                        <Button variant="danger" loading={isRevoking} onClick={confirmRevoke}>
                            Revoke
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
