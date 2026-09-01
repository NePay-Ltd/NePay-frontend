import { ApiError } from './api';
import type { ApiResponse } from './types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nepay-backend.onrender.com/api/v1';
const TOKEN_KEY = 'nepay-marketer-token';

export interface MarketerDashboard {
    marketerCode: string;
    status: 'ACTIVE' | 'INACTIVE';
    signups: number;
    verifiedConversions: number;
    cohortAllTimePoints: number;
    recentVerified: Array<{ displayName: string; joinedAt: string; firstDepositAt: string }>;
}

export function getMarketerToken() { return typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY); }
export function clearMarketerToken() { localStorage.removeItem(TOKEN_KEY); }

export async function marketerLogin(email: string, password: string) {
    const response = await fetch(`${BASE_URL}/marketer/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const body = await response.json();
    if (!response.ok) {
        throw new ApiError({ status: response.status, code: body.code || 'UNKNOWN_ERROR', message: body.message || 'Invalid credentials' });
    }
    localStorage.setItem(TOKEN_KEY, body.data.accessToken);
}

export async function getMarketerDashboard() {
    const response = await fetch(`${BASE_URL}/marketer/me/dashboard`, { headers: { Authorization: `Bearer ${getMarketerToken()}` } });
    const body = await response.json() as ApiResponse<MarketerDashboard> & { message?: string };
    if (!response.ok) throw new Error(body.message || 'Could not load dashboard');
    return body.data;
}
