"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { marketerLogin } from "@/lib/marketer-api";

export default function MarketerLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const submit = async (event: FormEvent) => {
        event.preventDefault(); setBusy(true); setError(null);
        try { await marketerLogin(email, password); router.push("/marketer/dashboard"); }
        catch (err) { setError(err instanceof Error ? err.message : "Sign in failed"); }
        finally { setBusy(false); }
    };
    return <main className="mx-auto flex min-h-screen max-w-md items-center px-5"><form onSubmit={submit} className="w-full space-y-5 rounded-xl border border-border bg-white p-7 shadow-sm"><div><h1 className="text-2xl font-bold text-ink">Partner sign in</h1><p className="mt-1 text-sm text-body">View the performance of your NePay referral link.</p></div><input className="input w-full" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><input className="input w-full" type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />{error && <p className="text-sm text-red-600">{error}</p>}<button className="btn btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form></main>;
}
