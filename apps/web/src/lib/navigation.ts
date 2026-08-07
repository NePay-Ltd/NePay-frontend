import {
    LayoutDashboard,
    Wallet,
    LayoutGrid,
    Receipt,
    Gift,
    Plane,
    CreditCard,
    Download,
    Bell,
    User,
    ShieldCheck,
    Home,
    Users,
    type LucideIcon,
} from "lucide-react";

export interface NavItem {
    key: string;
    label: string;
    icon: LucideIcon;
    href: string;
    badge?: number;
}

export const SIDEBAR_NAV: NavItem[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard, href: "/overview" },
    { key: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
    { key: "services", label: "Services", icon: LayoutGrid, href: "/services" },
    { key: "transactions", label: "Transactions", icon: Receipt, href: "/transactions" },
    { key: "gift-cards", label: "Gift Cards", icon: Gift, href: "/gift-cards" },
    { key: "flights", label: "Flights", icon: Plane, href: "/flights" },
    { key: "card", label: "NePay Card", icon: CreditCard, href: "/card" },
    { key: "receive", label: "Receive Crypto", icon: Download, href: "/receive-crypto" },
    { key: "refer", label: "Refer & Earn", icon: Users, href: "/refer" },
    { key: "notifications", label: "Notifications", icon: Bell, href: "/notifications", badge: 3 },
    { key: "profile", label: "Profile", icon: User, href: "/profile" },
    { key: "security", label: "Security", icon: ShieldCheck, href: "/security" },
];

export const BOTTOM_NAV: NavItem[] = [
    { key: "overview", label: "Home", icon: Home, href: "/overview" },
    { key: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
    { key: "services", label: "Services", icon: LayoutGrid, href: "/services" },
    { key: "transactions", label: "Activity", icon: Receipt, href: "/transactions" },
    { key: "profile", label: "Profile", icon: User, href: "/profile" },
];