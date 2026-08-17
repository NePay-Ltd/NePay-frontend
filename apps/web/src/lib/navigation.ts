import {
    LayoutDashboard,
    Wallet,
    LayoutGrid,
    Receipt,
    Gift,
    Plane,
    CreditCard,
    Download,
    Building2,
    Bell,
    User,
    ShieldCheck,
    Home,
    Users,
    PlusCircle,
    type LucideIcon,
} from "lucide-react";

export interface NavItem {
    key: string;
    label: string;
    icon: LucideIcon;
    href: string;
    badge?: number;
    badgeLabel?: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export const SIDEBAR_GROUPS: NavGroup[] = [
    {
        title: "MONEY",
        items: [
            { key: "overview", label: "Overview", icon: LayoutDashboard, href: "/overview" },
            { key: "transactions", label: "Transactions", icon: Receipt, href: "/transactions" },
        ],
    },
    {
        title: "MOVE MONEY",
        items: [
            { key: "receive", label: "Receive crypto", icon: LayoutGrid, href: "/receive-crypto" },
            { key: "withdraw", label: "Withdraw to bank", icon: Building2, href: "/withdraw" },
        ],
    },
    {
        title: "SPEND",
        items: [
            { key: "services", label: "Bills & services", icon: LayoutGrid, href: "/services" },
            { key: "gift-cards", label: "Gift cards", icon: Gift, href: "/gift-cards" },
            { key: "flights", label: "Flights", icon: Plane, href: "/flights" },
            { key: "card", label: "NePay card", icon: CreditCard, href: "/card", badgeLabel: "Soon" },
        ],
    },
];

export const BOTTOM_NAV: NavItem[] = [
    { key: "overview", label: "Home", icon: Home, href: "/overview" },
    { key: "add-money", label: "Add Money", icon: PlusCircle, href: "/add-money" },
    { key: "services", label: "Services", icon: LayoutGrid, href: "/services" },
    { key: "card", label: "Cards", icon: CreditCard, href: "/card" },
    { key: "profile", label: "Profile", icon: User, href: "/profile" },
];