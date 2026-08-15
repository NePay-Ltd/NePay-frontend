"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Shield, Smartphone, Key, Lock, Activity, ChevronRight, Fingerprint, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { 
    useSecuritySettings, 
    useToggleBiometrics, 
    useEnable2FA, 
    useVerify2FA, 
    useDisable2FA 
} from "@/lib/queries/security";

import { Panel, PanelBody } from "@/components/shared/panel";
import { RowItem } from "@/components/shared/row-item";
import { Button } from "@/components/shared/button";
import { Skeleton } from "@/components/shared/skeletons";

import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SecurityPage() {
    const router = useRouter();

    // Queries & Mutations
    const { data: settings, isLoading } = useSecuritySettings();
    const { mutate: toggleBiometrics } = useToggleBiometrics();
    
    const { mutateAsync: enable2FA, isPending: isGenerating2FA } = useEnable2FA();
    const { mutateAsync: verify2FA, isPending: isVerifying2FA } = useVerify2FA();
    const { mutateAsync: disable2FA, isPending: isDisabling2FA } = useDisable2FA();

    // State for 2FA Enable Flow
    const [setupModalOpen, setSetupModalOpen] = React.useState(false);
    const [twoFactorSecret, setTwoFactorSecret] = React.useState<{ qrCodeUri: string; secret: string } | null>(null);
    const [verificationCode, setVerificationCode] = React.useState("");
    const [verificationError, setVerificationError] = React.useState("");
    const [copied, setCopied] = React.useState(false);

    // State for 2FA Disable Flow
    const [disableModalOpen, setDisableModalOpen] = React.useState(false);
    const [disableCode, setDisableCode] = React.useState("");
    const [disableError, setDisableError] = React.useState("");

    // Handlers
    const onToggle2FA = async (checked: boolean) => {
        if (checked) {
            // Start Enable Flow
            setSetupModalOpen(true);
            try {
                const secretData = await enable2FA();
                setTwoFactorSecret(secretData);
            } catch {
                toast.error("Failed to generate 2FA setup");
                setSetupModalOpen(false);
            }
        } else {
            // Start Disable Flow
            setDisableCode("");
            setDisableError("");
            setDisableModalOpen(true);
        }
    };

    const handleCopySecret = () => {
        if (!twoFactorSecret) return;
        navigator.clipboard.writeText(twoFactorSecret.secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const submitVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerificationError("");
        if (verificationCode.length !== 6) {
            setVerificationError("Code must be 6 digits.");
            return;
        }

        try {
            await verify2FA(verificationCode);
            toast.success("Two-Factor Authentication enabled successfully!");
            setSetupModalOpen(false);
            setVerificationCode("");
            setTwoFactorSecret(null);
        } catch (err: any) {
            setVerificationError(err.message || "Invalid code. Please try again.");
        }
    };

    const submitDisable2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setDisableError("");
        if (disableCode.length !== 6) {
            setDisableError("Code must be 6 digits.");
            return;
        }

        try {
            await disable2FA(disableCode);
            toast.success("Two-Factor Authentication disabled.");
            setDisableModalOpen(false);
            setDisableCode("");
        } catch (err: any) {
            setDisableError(err.message || "Invalid code. Please try again.");
        }
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col items-center py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
                    <Shield className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-bold text-ink">Your account is secure</h1>
                <p className="mt-2 text-sm text-body max-w-sm">
                    We use industry-leading security to keep your funds and data safe.
                </p>
            </div>

            {/* ── Settings Panel ── */}
            <Panel>
                <PanelBody className="p-0">
                    {isLoading || !settings ? (
                        <div className="flex flex-col divide-y divide-border p-5">
                            <Skeleton className="h-6 w-full max-w-xs mb-4" />
                            <Skeleton className="h-6 w-full max-w-sm" />
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            <RowItem
                                icon={Smartphone}
                                title="Two-Factor Authentication"
                                subtitle="Add an extra layer of security to your account"
                                trailing={
                                    <Switch
                                        checked={settings.twoFactorEnabled}
                                        onCheckedChange={onToggle2FA}
                                    />
                                }
                                className="px-5"
                            />
                            <RowItem
                                icon={Fingerprint}
                                title="Biometric Login"
                                subtitle="Use Face ID or Touch ID to sign in faster"
                                trailing={
                                    <Switch
                                        checked={settings.biometricsEnabled}
                                        onCheckedChange={(checked) => toggleBiometrics(checked)}
                                    />
                                }
                                className="px-5"
                            />
                            <RowItem
                                icon={Key}
                                title="Set transaction PIN"
                                subtitle="Create your 4-digit payment PIN"
                                trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                                onClick={() => router.push("/security/change-pin?mode=setup")}
                                className="cursor-pointer px-5 hover:bg-gray-50"
                            />
                            <RowItem
                                icon={Key}
                                title="Change transaction PIN"
                                subtitle="Update your existing 4-digit PIN"
                                trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                                onClick={() => router.push("/security/change-pin?mode=change")}
                                className="cursor-pointer px-5 hover:bg-gray-50"
                            />
                            <RowItem
                                icon={Lock}
                                title="Change Password"
                                trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                                onClick={() => router.push("/security/change-password")}
                                className="cursor-pointer px-5 hover:bg-gray-50"
                            />
                            <RowItem
                                icon={Activity}
                                title="Login Activity"
                                trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                                onClick={() => router.push("/security/login-activity")}
                                className="cursor-pointer px-5 hover:bg-gray-50"
                            />
                        </div>
                    )}
                </PanelBody>
            </Panel>

            {/* ── 2FA Setup Modal ── */}
            <Dialog 
                open={setupModalOpen} 
                onOpenChange={(open) => {
                    if (!open) {
                        setSetupModalOpen(false);
                        setVerificationCode("");
                        setVerificationError("");
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Enable 2-Step Verification</DialogTitle>
                        <DialogDescription>
                            Scan this QR code with Google Authenticator or Authy to set up 2FA.
                        </DialogDescription>
                    </DialogHeader>

                    {isGenerating2FA || !twoFactorSecret ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Skeleton className="h-48 w-48 rounded-lg" />
                            <Skeleton className="h-4 w-32 mt-4" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-4 space-y-6">
                            {/* QR Code */}
                            <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                                <QRCodeSVG 
                                    value={twoFactorSecret.qrCodeUri} 
                                    size={180} 
                                    level="H" 
                                />
                            </div>

                            {/* Fallback Secret */}
                            <div className="flex w-full flex-col items-center gap-2">
                                <span className="text-xs font-medium text-muted uppercase tracking-wider">
                                    Or enter this code manually
                                </span>
                                <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 border border-border w-full justify-between">
                                    <code className="text-sm font-mono font-bold text-ink tracking-widest truncate">
                                        {twoFactorSecret.secret}
                                    </code>
                                    <button 
                                        type="button" 
                                        onClick={handleCopySecret}
                                        className="text-muted hover:text-violet-600 p-1"
                                        aria-label="Copy secret"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Verification Form */}
                            <form onSubmit={submitVerify2FA} className="w-full space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Enter 6-digit code</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        className="text-center text-lg tracking-[0.5em] font-mono"
                                    />
                                    {verificationError && (
                                        <p className="text-xs text-red-500 text-center">{verificationError}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    loading={isVerifying2FA}
                                    disabled={verificationCode.length !== 6}
                                >
                                    Verify & Enable
                                </Button>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Disable 2FA Modal ── */}
            <AlertDialog 
                open={disableModalOpen} 
                onOpenChange={(open) => {
                    if (!open && !isDisabling2FA) {
                        setDisableModalOpen(false);
                    }
                }}
            >
                <AlertDialogContent>
                    <form onSubmit={submitDisable2FA}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Disable 2-Step Verification</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to turn off 2FA? This will make your account less secure.
                                Enter your current 6-digit code to confirm.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        
                        <div className="py-4 space-y-2">
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder="123456"
                                value={disableCode}
                                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                                className="text-center text-lg tracking-[0.5em] font-mono"
                            />
                            {disableError && (
                                <p className="text-xs text-red-500 text-center">{disableError}</p>
                            )}
                        </div>

                        <AlertDialogFooter>
                            <AlertDialogCancel type="button" disabled={isDisabling2FA}>
                                Cancel
                            </AlertDialogCancel>
                            <Button 
                                type="submit" 
                                variant="danger" 
                                loading={isDisabling2FA}
                                disabled={disableCode.length !== 6}
                            >
                                Disable 2FA
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
