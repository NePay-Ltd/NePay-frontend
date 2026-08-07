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
    type LucideIcon,
} from "lucide-react";

export interface NavItem {
    key: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
}

export const SIDEBAR_NAV: NavItem[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "wallet", label: "Wallet", icon: Wallet },
    { key: "services", label: "Services", icon: LayoutGrid },
    { key: "transactions", label: "Transactions", icon: Receipt },
    { key: "gift-cards", label: "Gift Cards", icon: Gift },
    { key: "flights", label: "Flights", icon: Plane },
    { key: "card", label: "NePay Card", icon: CreditCard },
    { key: "receive", label: "Receive Crypto", icon: Download },
    { key: "notifications", label: "Notifications", icon: Bell, badge: 3 },
    { key: "profile", label: "Profile", icon: User },
    { key: "security", label: "Security", icon: ShieldCheck },
];

export const BOTTOM_NAV: NavItem[] = [
    { key: "overview", label: "Home", icon: Home },
    { key: "wallet", label: "Wallet", icon: Wallet },
    { key: "services", label: "Services", icon: LayoutGrid },
    { key: "transactions", label: "Activity", icon: Receipt },
    { key: "profile", label: "Profile", icon: User },
];