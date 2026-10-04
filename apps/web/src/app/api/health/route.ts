import { NextResponse } from "next/server";

// Liveness probe for the container healthcheck (Coolify). Deliberately does
// no work and touches no backend — it only proves the Next.js server is up.
export const dynamic = "force-dynamic";

export function GET() {
    return NextResponse.json({ status: "ok" });
}
