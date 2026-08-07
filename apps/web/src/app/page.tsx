"use client";

import * as React from "react";
import {
    ArrowUpRight,
    CreditCard,
    Gift,
    Plane,
    Receipt,
    Wifi,
    Zap,
    Tv,
    Phone,
    Plus,
} from "lucide-react";

import { formatNaira } from "@/lib/format";
import { formatDate, formatRelativeTime } from "@/lib/date";
import { Button } from "@/components/shared/button";
import { Panel, PanelHeader, PanelBody } from "@/components/shared/panel";
import { KpiCard } from "@/components/shared/kpi-card";
import { Tile } from "@/components/shared/tile";
import { Chip } from "@/components/shared/chip";
import { Tag } from "@/components/shared/tag";
import { TxIcon, type TxCategory } from "@/components/shared/tx-icon";
import { RowItem } from "@/components/shared/row-item";
import { EmptyState } from "@/components/shared/empty-state";
import { Modal } from "@/components/shared/modal";
import { AddMoneyForm } from "@/components/shared/form-example";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Transaction {
    id: string;
    category: TxCategory;
    title: string;
    subtitle: string;
    amount: number;
    status: "ok" | "warn" | "neutral";
    statusLabel: string;
    date: string;
}

const RECENT_TX: Transaction[] = [
    {
        id: "1",
        category: "deposit",
        title: "Bank Transfer — GTB",
        subtitle: "Aug 7, 2026 · 09:14 AM",
        amount: 150000,
        status: "ok",
        statusLabel: "Successful",
        date: "2026-08-07T09:14:00Z",
    },
    {
        id: "2",
        category: "withdrawal",
        title: "Withdrawal — Zenith Bank",
        subtitle: "Aug 6, 2026 · 04:32 PM",
        amount: -45000,
        status: "ok",
        statusLabel: "Successful",
        date: "2026-08-06T16:32:00Z",
    },
    {
        id: "3",
        category: "payment",
        title: "DSTV Compact Plus",
        subtitle: "Aug 5, 2026 · 11:20 AM",
        amount: -14500,
        status: "warn",
        statusLabel: "Pending",
        date: "2026-08-05T11:20:00Z",
    },
    {
        id: "4",
        category: "gift-card",
        title: "Amazon Gift Card",
        subtitle: "Aug 4, 2026 · 02:08 PM",
        amount: -25000,
        status: "ok",
        statusLabel: "Successful",
        date: "2026-08-04T14:08:00Z",
    },
    {
        id: "5",
        category: "flight",
        title: "Lagos → Abuja — Air Peace",
        subtitle: "Aug 3, 2026 · 07:45 AM",
        amount: -78500,
        status: "ok",
        statusLabel: "Successful",
        date: "2026-08-03T07:45:00Z",
    },
];

const QUICK_ACTIONS = [
    { icon: Phone, label: "Airtime" },
    { icon: Wifi, label: "Data" },
    { icon: Tv, label: "Cable TV" },
    { icon: Zap, label: "Electricity" },
    { icon: Gift, label: "Gift Cards" },
    { icon: Plane, label: "Flights" },
    { icon: CreditCard, label: "NePay Card", comingSoon: true },
    { icon: Receipt, label: "Bills", comingSoon: true },
];

export default function HomePage() {
    const [addMoneyOpen, setAddMoneyOpen] = React.useState(false);

    return (
        <div className="space-y-6">
            {/* Greeting */}
            <div>
                <p className="text-sm text-muted">Welcome back,</p>
                <h1 className="text-2xl font-bold text-ink">Chidi Okafor 👋</h1>
            </div>

            {/* Hero wallet card + KPIs */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="relative overflow-hidden rounded-lg bg-brand-gradient p-6 text-white shadow-lg">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-white/70">
                                Total Balance
                            </p>
                            <p className="mt-1 font-mono text-3xl font-bold sm:text-4xl">
                                {formatNaira(847250)}
                            </p>
                            <div className="mt-6 flex gap-3">
                                <Button
                                    variant="quiet"
                                    className="bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 active:bg-white/30"
                                    onClick={() => setAddMoneyOpen(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Money
                                </Button>
                                <Button
                                    variant="quiet"
                                    className="bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 active:bg-white/30"
                                >
                                    <ArrowUpRight className="h-4 w-4" />
                                    Withdraw
                                </Button>
                            </div>
                        </div>
                        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
                        <div className="absolute -bottom-12 -right-4 h-32 w-32 rounded-full bg-white/5" />
                    </div>
                </div>

                <KpiCard
                    label="This Month Spending"
                    value={formatNaira(163000)}
                    change={{ value: -8.2, period: "vs last month" }}
                />
            </div>

            {/* Quick actions */}
            <Panel>
                <PanelHeader
                    title="Quick Actions"
                    description="Pay bills, buy data, and more"
                />
                <PanelBody>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                        {QUICK_ACTIONS.map((action) => (
                            <Tile
                                key={action.label}
                                icon={action.icon}
                                label={action.label}
                                comingSoon={"comingSoon" in action ? action.comingSoon : false}
                            />
                        ))}
                    </div>
                </PanelBody>
            </Panel>

            {/* Transactions with Tabs + Recent activity */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Panel flush>
                        <div className="p-5 pb-0">
                            <Tabs defaultValue="all">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-ink">
                                        Transactions
                                    </h3>
                                    <Button variant="ghost" size="sm">
                                        View All
                                    </Button>
                                </div>
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="money">Money</TabsTrigger>
                                    <TabsTrigger value="bills">Bills</TabsTrigger>
                                </TabsList>

                                <TabsContent value="all">
                                    <div className="divide-y divide-border pt-2">
                                        {RECENT_TX.map((tx) => (
                                            <RowItem
                                                key={tx.id}
                                                leading={<TxIcon category={tx.category} />}
                                                title={tx.title}
                                                subtitle={formatRelativeTime(tx.date)}
                                                trailing={
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span
                                                            className={
                                                                tx.amount >= 0
                                                                    ? "font-mono text-sm font-semibold text-green-500"
                                                                    : "font-mono text-sm font-semibold text-ink"
                                                            }
                                                        >
                                                            {tx.amount >= 0 ? "+" : ""}
                                                            {formatNaira(tx.amount)}
                                                        </span>
                                                        <Tag variant={tx.status} dot>
                                                            {tx.statusLabel}
                                                        </Tag>
                                                    </div>
                                                }
                                            />
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="money">
                                    <div className="divide-y divide-border pt-2">
                                        {RECENT_TX.filter(
                                            (t) =>
                                                t.category === "deposit" ||
                                                t.category === "withdrawal",
                                        ).map((tx) => (
                                            <RowItem
                                                key={tx.id}
                                                leading={<TxIcon category={tx.category} />}
                                                title={tx.title}
                                                subtitle={formatDate(tx.date)}
                                                trailing={
                                                    <span
                                                        className={
                                                            tx.amount >= 0
                                                                ? "font-mono text-sm font-semibold text-green-500"
                                                                : "font-mono text-sm font-semibold text-ink"
                                                        }
                                                    >
                                                        {tx.amount >= 0 ? "+" : ""}
                                                        {formatNaira(tx.amount)}
                                                    </span>
                                                }
                                            />
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="bills">
                                    <div className="divide-y divide-border pt-2">
                                        {RECENT_TX.filter(
                                            (t) =>
                                                t.category !== "deposit" &&
                                                t.category !== "withdrawal",
                                        ).map((tx) => (
                                            <RowItem
                                                key={tx.id}
                                                leading={<TxIcon category={tx.category} />}
                                                title={tx.title}
                                                subtitle={formatDate(tx.date)}
                                                trailing={
                                                    <Tag variant={tx.status} dot>
                                                        {tx.statusLabel}
                                                    </Tag>
                                                }
                                            />
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </Panel>
                </div>

                {/* Side panels */}
                <div className="space-y-4">
                    <Panel>
                        <PanelHeader title="Savings Goal" description="Rent Fund" />
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="font-mono text-2xl font-bold text-ink">
                                    {formatNaira(320000)}
                                </p>
                                <p className="text-xs text-muted">
                                    of {formatNaira(500000)}
                                </p>
                            </div>
                            <Tag variant="ok" dot>
                                On Track
                            </Tag>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
                            <div
                                className="h-full rounded-full bg-brand-gradient"
                                style={{ width: "64%" }}
                            />
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Active Pod" description="Family Data Bundle" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-ink">4 members</p>
                                <p className="text-xs text-muted">Renews Aug 15</p>
                            </div>
                            <p className="font-mono text-lg font-bold text-violet-700">
                                {formatNaira(12000)}
                            </p>
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Filter by Network" />
                        <div className="no-scrollbar flex gap-2 overflow-x-auto">
                            <Chip active>MTN</Chip>
                            <Chip>Glo</Chip>
                            <Chip>Airtel</Chip>
                            <Chip>9mobile</Chip>
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Empty state demo */}
            <Panel flush>
                <EmptyState
                    icon={Receipt}
                    heading="No scheduled payments"
                    description="You have no upcoming automatic payments or recurring bills set up yet."
                    action={{
                        label: "Schedule a Payment",
                        onClick: () => {},
                    }}
                />
            </Panel>

            {/* Add Money modal with RHF + Zod form */}
            <Modal
                open={addMoneyOpen}
                onOpenChange={setAddMoneyOpen}
                title="Add Money"
                description="Deposit funds into your NePay wallet from your bank account."
            >
                <AddMoneyForm />
            </Modal>
        </div>
    );
}
