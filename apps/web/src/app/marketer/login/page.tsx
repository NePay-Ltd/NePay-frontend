"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Megaphone } from "lucide-react";

import { marketerLogin } from "@/lib/marketer-api";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/ui/input";

export default function MarketerLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await marketerLogin(email, password);
            router.push("/marketer/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-12">
            <div className="w-full max-w-md">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient shadow-md">
                        <Megaphone className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink">
                        Partner sign in
                    </h1>
                    <p className="mt-1.5 text-sm font-medium text-body">
                        View the performance of your NePay referral link.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    noValidate
                    className="space-y-5 rounded-2xl border border-border bg-white p-7 shadow-sm sm:p-8"
                >
                    <div className="space-y-2">
                        <label htmlFor="marketer-email" className="text-sm font-bold text-ink">
                            Email
                        </label>
                        <Input
                            id="marketer-email"
                            type="email"
                            required
                            autoComplete="username"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 text-base shadow-sm focus-visible:ring-violet-600 focus-visible:border-violet-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="marketer-password" className="text-sm font-bold text-ink">
                            Password
                        </label>
                        <div className="relative">
                            <Input
                                id="marketer-password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 pr-11 text-base shadow-sm focus-visible:ring-violet-600 focus-visible:border-violet-600"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="h-12 w-full text-base font-bold shadow-md hover:shadow-lg"
                        loading={busy}
                    >
                        {busy ? "Signing in…" : "Sign in"}
                    </Button>
                </form>

                <p className="mt-6 text-center text-xs font-medium text-muted">
                    Partner access only. Not a NePay customer?{" "}
                    <a href="/login" className="font-bold text-violet-700 hover:text-violet-600 hover:underline">
                        Go to customer sign in
                    </a>
                </p>
            </div>
        </main>
    );
}
