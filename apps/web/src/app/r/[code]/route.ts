import { IOS_APP_STORE_URL, isValidReferralCode, playStoreUrlWithReferral } from "@/lib/app-links";

/**
 * The shareable referral link: https://www.nepay.com.ng/r/<CODE>
 *
 * Opened on an Android phone it goes to the Play Store listing with the code attached, so the code survives
 * the install and the app can pre-fill it at sign-up. Anywhere else it opens the web sign-up with the code
 * already in the box, so the link never dead-ends. A malformed code is dropped (plain sign-up), never echoed.
 */
export const dynamic = "force-dynamic";

function redirect(location: string): Response {
    // A relative Location is fine for browsers and avoids guessing the public host behind the proxy.
    return new Response(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } });
}

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const valid = isValidReferralCode(code);
    const userAgent = request.headers.get("user-agent") ?? "";

    if (valid && /android/i.test(userAgent)) {
        return redirect(playStoreUrlWithReferral(code));
    }

    if (valid && IOS_APP_STORE_URL && /iphone|ipad|ipod/i.test(userAgent)) {
        return redirect(IOS_APP_STORE_URL);
    }

    return redirect(valid ? `/register?ref=${encodeURIComponent(code.toUpperCase())}` : "/register");
}
