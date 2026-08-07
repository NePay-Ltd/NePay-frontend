/**
 * Mock API endpoints for Profile and Preferences.
 */

function randomDelay(minMs = 300, maxMs = 800): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

export interface ProfilePreferences {
    pushNotifications: boolean;
    emailReceipts: boolean;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    memberSince: string;
    kycStatus: "verified" | "pending" | "unverified";
    kycTier: "TIER_1" | "TIER_2";
    preferences: ProfilePreferences;
}

let MOCK_PROFILE: UserProfile = {
    id: "usr_mock_123",
    name: "Dubem Egbo",
    email: "dubem@example.com",
    phone: "+234 803 123 4567",
    memberSince: "2024-01-15T00:00:00Z",
    kycStatus: "verified",
    kycTier: "TIER_2",
    preferences: {
        pushNotifications: true,
        emailReceipts: false,
    },
};

export async function mockGetProfile(): Promise<UserProfile> {
    await randomDelay();
    return { ...MOCK_PROFILE };
}

export async function mockUpdateProfile(data: { name: string; email: string }): Promise<UserProfile> {
    await randomDelay(600, 1000);
    MOCK_PROFILE = {
        ...MOCK_PROFILE,
        name: data.name,
        email: data.email,
    };
    return { ...MOCK_PROFILE };
}

export async function mockUpdatePreferences(
    data: Partial<ProfilePreferences>
): Promise<ProfilePreferences> {
    await randomDelay(400, 800);
    
    // Simulate a random 10% chance of backend failure for optimistic UI testing
    if (Math.random() < 0.1) {
        throw new Error("Network error. Could not update preferences.");
    }

    MOCK_PROFILE.preferences = {
        ...MOCK_PROFILE.preferences,
        ...data,
    };

    return { ...MOCK_PROFILE.preferences };
}
