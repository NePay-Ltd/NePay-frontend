/**
 * Mock API endpoints for Security Module.
 */

function randomDelay(minMs = 300, maxMs = 800): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SecuritySettings {
    twoFactorEnabled: boolean;
    biometricsEnabled: boolean;
}

export interface TwoFactorSecret {
    qrCodeUri: string;
    secret: string;
}

export interface LoginActivity {
    id: string;
    device: string;
    location: string;
    ipAddress: string;
    timestamp: string;
    isCurrentSession: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

let MOCK_SECURITY_SETTINGS: SecuritySettings = {
    twoFactorEnabled: false,
    biometricsEnabled: false,
};

const MOCK_LOGIN_ACTIVITY: LoginActivity[] = [
    {
        id: "log_1",
        device: "MacBook Pro • Chrome",
        location: "Lagos, Nigeria",
        ipAddress: "197.210.123.45",
        timestamp: new Date().toISOString(),
        isCurrentSession: true,
    },
    {
        id: "log_2",
        device: "iPhone 13 • NePay iOS",
        location: "Abuja, Nigeria",
        ipAddress: "197.210.98.76",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        isCurrentSession: false,
    },
    {
        id: "log_3",
        device: "Windows PC • Edge",
        location: "London, UK",
        ipAddress: "82.12.34.56",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        isCurrentSession: false,
    },
    {
        id: "log_4",
        device: "MacBook Air • Safari",
        location: "Lagos, Nigeria",
        ipAddress: "197.210.123.45",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        isCurrentSession: false,
    },
];

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function mockGetSecuritySettings(): Promise<SecuritySettings> {
    await randomDelay();
    return { ...MOCK_SECURITY_SETTINGS };
}

export async function mockToggleBiometrics(enabled: boolean): Promise<SecuritySettings> {
    await randomDelay(400, 700);
    MOCK_SECURITY_SETTINGS.biometricsEnabled = enabled;
    return { ...MOCK_SECURITY_SETTINGS };
}

export async function mockEnable2FA(): Promise<TwoFactorSecret> {
    await randomDelay(600, 1000);
    // Simulate generating a TOTP secret
    const secret = "JBSWY3DPEHPK3PXP";
    const appName = "NePay";
    const userEmail = "user@nepay.app";
    // OTPAuth URI format
    const qrCodeUri = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;
    
    return { qrCodeUri, secret };
}

export async function mockVerify2FA(code: string): Promise<void> {
    await randomDelay(500, 900);
    
    if (code !== "123456") {
        throw new Error("Invalid 2FA code. For demo purposes, use 123456.");
    }

    MOCK_SECURITY_SETTINGS.twoFactorEnabled = true;
}

export async function mockDisable2FA(code: string): Promise<void> {
    await randomDelay(500, 900);

    if (code !== "123456") {
        throw new Error("Invalid 2FA code.");
    }

    MOCK_SECURITY_SETTINGS.twoFactorEnabled = false;
}

export async function mockChangePin(currentPin: string, newPin: string): Promise<void> {
    await randomDelay(600, 1000);
    if (currentPin !== "1234") { // Mock standard pin check
        throw new Error("Current PIN is incorrect. For demo, use 1234.");
    }
}

export async function mockChangePassword(currentPass: string, newPass: string): Promise<void> {
    await randomDelay(800, 1200);
    if (currentPass !== "password123") { // Mock standard password check
        throw new Error("Current password is incorrect. For demo, use password123.");
    }
}

export async function mockGetLoginActivity(): Promise<LoginActivity[]> {
    await randomDelay();
    return MOCK_LOGIN_ACTIVITY;
}
