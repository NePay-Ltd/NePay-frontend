"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    User as UserIcon,
    Landmark,
    ShieldCheck,
    Lock,
    LifeBuoy,
    Info,
    LogOut,
    ChevronRight,
    Bell,
    Mail,
    AlertCircle,
    Receipt
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useProfile, useUpdateProfile } from "@/lib/queries/profile";
import { cn } from "@/lib/cn";

import { Panel, PanelBody } from "@/components/shared/panel";
import { RowItem } from "@/components/shared/row-item";
import { Tag } from "@/components/shared/tag";
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

// ─── Edit Profile Form ────────────────────────────────────────────────────────

const editProfileSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const router = useRouter();
    const { logout } = useAuth();
    
    // Queries & Mutations
    const { data: profile, isLoading } = useProfile();
    const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();

    // Mock local state for preferences since backend doesn't support them yet
    const [pushEnabled, setPushEnabled] = React.useState(true);
    const [emailEnabled, setEmailEnabled] = React.useState(true);

    // State
    const [editModalOpen, setEditModalOpen] = React.useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = React.useState(false);

    // Form
    const form = useForm<EditProfileFormValues>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
        },
    });

    React.useEffect(() => {
        if (profile) {
            form.reset({ firstName: profile.firstName, lastName: profile.lastName });
        }
    }, [profile, form]);

    // Handlers
    const onEditSubmit = form.handleSubmit((data) => {
        updateProfile(data, {
            onSuccess: () => setEditModalOpen(false),
        });
    });

    const onLogout = async () => {
        await logout();
        router.push("/login");
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/);
        if (!parts.length) return "U";
        const first = parts[0]?.charAt(0) ?? "";
        const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? "" : "";
        return (first + last).toUpperCase();
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* ── Profile Header ── */}
            <div className="flex flex-col items-center py-6">
                {isLoading || !profile ? (
                    <div className="flex flex-col items-center space-y-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ) : (
                    <>
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-gradient text-3xl font-bold text-white shadow-lg">
                            {getInitials(`${profile.firstName} ${profile.lastName}`)}
                        </div>
                        <h1 className="mt-4 text-2xl font-bold text-ink">{profile.firstName} {profile.lastName}</h1>
                        
                        <div className="mt-2">
                            {profile.kycVerified ? (
                                <Tag variant="ok" dot>Verified</Tag>
                            ) : (
                                <Tag variant="warn" dot>Pending Verification</Tag>
                            )}
                        </div>

                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-6"
                            onClick={() => setEditModalOpen(true)}
                        >
                            Edit Profile
                        </Button>

                        <div className="mt-8 grid w-full grid-cols-2 gap-4 rounded-xl border border-border bg-white p-4 text-sm sm:grid-cols-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Email</span>
                                <span className="truncate font-medium text-ink" title={profile.email}>{profile.email}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted">Phone</span>
                                <span className="font-medium text-ink">{profile.phoneNumber}</span>
                            </div>
                            <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                                <span className="text-xs text-muted">Member since</span>
                                <span className="font-medium text-ink">
                                    {formatDate(profile.createdAt)}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Account Panel ── */}
            <Panel>
                <PanelBody className="p-0">
                    <div className="divide-y divide-border">
                        <RowItem
                            icon={UserIcon}
                            title="Personal Information"
                            trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                            onClick={() => setEditModalOpen(true)}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                        <RowItem
                            icon={Receipt}
                            title="Activity & Transactions"
                            trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                            onClick={() => router.push("/transactions")}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                        <RowItem
                            icon={Landmark}
                            title="Bank Accounts"
                            trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                            onClick={() => router.push("/profile/bank-accounts")}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                        <RowItem
                            icon={ShieldCheck}
                            iconTint={profile?.kycVerified ? "green" : "violet"}
                            title="KYC Verification"
                            trailing={
                                <div className="flex items-center gap-3">
                                    {profile?.kycVerified && (
                                        <Tag variant="ok" dot>Verified</Tag>
                                    )}
                                    <ChevronRight className="h-5 w-5 text-muted" />
                                </div>
                            }
                            onClick={() => router.push("/kyc")}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                        <RowItem
                            icon={Lock}
                            title="Security"
                            trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                            onClick={() => router.push("/security")}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                    </div>
                </PanelBody>
            </Panel>

            {/* ── Preferences Panel ── */}
            <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-muted">
                Preferences
            </h2>
            <Panel>
                <PanelBody className="p-0">
                    <div className="divide-y divide-border">
                        <RowItem
                            icon={Bell}
                            title="Push Notifications"
                            subtitle="Receive alerts for incoming transfers"
                            trailing={
                                <Switch 
                                    checked={pushEnabled}
                                    onCheckedChange={setPushEnabled}
                                />
                            }
                            className="px-5"
                        />
                        <RowItem
                            icon={Mail}
                            title="Email Receipts"
                            subtitle="Get transaction receipts delivered to your inbox"
                            trailing={
                                <Switch 
                                    checked={emailEnabled}
                                    onCheckedChange={setEmailEnabled}
                                />
                            }
                            className="px-5"
                        />
                    </div>
                </PanelBody>
            </Panel>

            {/* ── Support Panel ── */}
            <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-muted">
                Support
            </h2>
            <Panel>
                <PanelBody className="p-0">
                    <div className="divide-y divide-border">
                        <RowItem
                            icon={LifeBuoy}
                            title="Help & Support"
                            trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                        <RowItem
                            icon={Info}
                            title="About NePay"
                            trailing={<ChevronRight className="h-5 w-5 text-muted" />}
                            className="cursor-pointer px-5 hover:bg-gray-50"
                        />
                    </div>
                </PanelBody>
            </Panel>

            {/* ── Logout Action ── */}
            <div className="pt-4">
                <Panel>
                    <PanelBody className="p-0">
                        <RowItem
                            icon={LogOut}
                            iconTint="red"
                            title={<span className="text-red-500 font-medium">Log out</span>}
                            onClick={() => setLogoutModalOpen(true)}
                            className="cursor-pointer px-5 hover:bg-red-50/50"
                        />
                    </PanelBody>
                </Panel>
            </div>

            {/* ── Edit Profile Modal ── */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Update your personal information below.
                        </DialogDescription>
                    </DialogHeader>
                    <form id="edit-profile-form" onSubmit={onEditSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-first-name">First Name</Label>
                            <Input
                                id="edit-first-name"
                                {...form.register("firstName")}
                            />
                            {form.formState.errors.firstName && (
                                <p className="text-xs text-red-500">{form.formState.errors.firstName.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-last-name">Last Name</Label>
                            <Input
                                id="edit-last-name"
                                {...form.register("lastName")}
                            />
                            {form.formState.errors.lastName && (
                                <p className="text-xs text-red-500">{form.formState.errors.lastName.message}</p>
                            )}
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                loading={isUpdatingProfile}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Logout Confirmation Dialog ── */}
            <AlertDialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will need to sign back in with your email or biometrics to access your account again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onLogout}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        >
                            Log out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
