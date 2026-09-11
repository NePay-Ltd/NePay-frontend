import type { Metadata } from "next";

import { DeleteAccountFlow } from "./delete-account-client";

export const metadata: Metadata = {
    title: "Delete Your Account | NePay",
    description:
        "Permanently delete your NePay account and personal data from this page — no need to reinstall or open the app.",
};

export default function DeleteAccountPage() {
    return (
        <div className="max-w-2xl mx-auto py-16 px-6">
            <DeleteAccountFlow />
        </div>
    );
}
