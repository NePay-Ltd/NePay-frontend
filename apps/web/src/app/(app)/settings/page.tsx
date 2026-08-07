"use client";

import * as React from "react";
import { User, Shield, Sliders, Smartphone, LogOut, ShieldCheck, Mail, Lock } from "lucide-react";
import { Button } from "@/components/shared/button";
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = React.useState<"profile" | "security" | "preferences">("profile");

    const TABS = [
        { id: "profile", label: "Profile Details", icon: User },
        { id: "security", label: "Security & KYC", icon: Shield },
        { id: "preferences", label: "Preferences", icon: Sliders },
    ] as const;

    return (
        <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-ink sm:text-3xl">Settings</h1>
                <p className="mt-0.5 text-sm font-medium text-body">
                    Manage your profile, security, and application preferences.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* ── Sidebar Navigation ── */}
                <div className="w-full md:w-64 shrink-0 space-y-6">
                    <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-violet-100 text-violet-700"
                                        : "text-muted hover:bg-violet-50 hover:text-ink"
                                )}
                            >
                                <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-violet-700" : "text-muted")} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="hidden md:block pt-6 border-t border-border">
                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                        >
                            <LogOut className="h-4 w-4" />
                            Log out of NePay
                        </button>
                    </div>
                </div>

                {/* ── Content Area ── */}
                <div className="flex-1 space-y-6">
                    
                    {activeTab === "profile" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Panel className="rounded-[24px]">
                                <PanelHeader className="px-6 pt-6" title="Personal Information" description="Your basic profile details." />
                                <PanelBody className="p-6">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-2xl font-bold text-violet-700">
                                                {user?.name?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <Button variant="quiet" className="font-bold text-violet-700 hover:bg-violet-50">
                                                    Change avatar
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Full Name</label>
                                                <input type="text" defaultValue={user?.name || "Ugochukwu Nebeani"} className="w-full rounded-xl border border-border bg-gray-50 px-4 py-3 text-sm font-bold text-ink focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-600" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted" />
                                                    <input type="email" defaultValue={user?.email || "ugo@example.com"} className="w-full rounded-xl border border-border bg-gray-50 pl-11 pr-4 py-3 text-sm font-bold text-ink focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-600" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Phone Number</label>
                                                <input type="tel" defaultValue="+234 801 234 5678" className="w-full rounded-xl border border-border bg-gray-50 px-4 py-3 text-sm font-bold text-ink focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-600" />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <Button variant="primary" className="rounded-xl px-6 font-bold bg-violet-700 hover:bg-violet-600">Save Changes</Button>
                                        </div>
                                    </div>
                                </PanelBody>
                            </Panel>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Panel className="rounded-[24px]">
                                <PanelHeader className="px-6 pt-6" title="Account Security" description="Manage your password and authentication methods." />
                                <PanelBody className="p-6">
                                    <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-gray-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 rounded-full bg-white p-2 shadow-sm text-green-600">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-ink">Two-Factor Authentication</p>
                                                    <p className="text-xs font-medium text-body mt-0.5">Protect your account with an extra layer of security.</p>
                                                </div>
                                            </div>
                                            <Button variant="quiet" className="shrink-0 bg-white shadow-sm border border-border font-bold">Manage 2FA</Button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-gray-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 rounded-full bg-white p-2 shadow-sm text-amber-600">
                                                    <Lock className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-ink">Change Password</p>
                                                    <p className="text-xs font-medium text-body mt-0.5">Last changed 3 months ago.</p>
                                                </div>
                                            </div>
                                            <Button variant="quiet" className="shrink-0 bg-white shadow-sm border border-border font-bold">Update</Button>
                                        </div>
                                    </div>
                                </PanelBody>
                            </Panel>

                            <Panel className="rounded-[24px]">
                                <PanelHeader className="px-6 pt-6" title="Trusted Devices" description="Devices that are currently logged in." />
                                <PanelBody className="p-0">
                                    <div className="divide-y divide-border/50">
                                        <div className="flex items-center justify-between p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-violet-50 p-2 text-violet-700">
                                                    <Smartphone className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-ink">MacBook Pro (Mac OS)</p>
                                                    <p className="text-xs font-medium text-green-600 mt-0.5">Active now · Lagos, Nigeria</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </PanelBody>
                            </Panel>
                        </div>
                    )}

                    {activeTab === "preferences" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Panel className="rounded-[24px]">
                                <PanelHeader className="px-6 pt-6" title="Application Preferences" description="Customize your NePay experience." />
                                <PanelBody className="p-6">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Primary Display Currency</label>
                                            <select className="w-full sm:max-w-xs rounded-xl border border-border bg-gray-50 px-4 py-3 text-sm font-bold text-ink focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-600">
                                                <option value="NGN">Nigerian Naira (₦)</option>
                                                <option value="USD">US Dollar ($)</option>
                                                <option value="GBP">British Pound (£)</option>
                                            </select>
                                        </div>
                                    </div>
                                </PanelBody>
                            </Panel>
                        </div>
                    )}

                </div>
            </div>
            
            {/* Mobile Logout Button */}
            <div className="md:hidden mt-8 border-t border-border pt-8">
                <button
                    onClick={logout}
                    className="flex w-full items-center justify-center gap-3 rounded-xl px-4 py-4 text-sm font-bold text-red-600 transition-colors bg-red-50 hover:bg-red-100"
                >
                    <LogOut className="h-4 w-4" />
                    Log out of NePay
                </button>
            </div>
        </div>
    );
}
