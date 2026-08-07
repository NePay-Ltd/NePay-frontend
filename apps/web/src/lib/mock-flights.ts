/**
 * Mock API endpoints for Flights.
 */

import { ApiError } from "./api";

function randomDelay(minMs = 400, maxMs = 1200): Promise<void> {
    return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs) + minMs)),
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Airport {
    code: string;
    city: string;
    country: string;
}

export interface FlightOffer {
    id: string;
    airline: string;
    airlineCode: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
    priceNgn: number;
    travelClass: string;
}

export interface FlightSearchRequest {
    from: string;
    to: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    travelClass: string;
}

export type FlightBookingStatus = "PENDING_AGENCY" | "CONFIRMED" | "FAILED";

export interface FlightBookingResponse {
    bookingId: string;
    offerId: string;
    status: FlightBookingStatus;
    totalAmountNgn: number;
    pnr?: string;
}

export interface RecentSearch {
    id: string;
    route: string; // e.g. "LOS → LHR"
    dates: string; // e.g. "May 28 - Jun 05" or "May 28"
    raw: FlightSearchRequest;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const AIRPORTS: Airport[] = [
    { code: "LOS", city: "Lagos", country: "Nigeria" },
    { code: "ABV", city: "Abuja", country: "Nigeria" },
    { code: "PHC", city: "Port Harcourt", country: "Nigeria" },
    { code: "LHR", city: "London", country: "United Kingdom" },
    { code: "DXB", city: "Dubai", country: "UAE" },
    { code: "JFK", city: "New York", country: "USA" },
];

let mockRecentSearches: RecentSearch[] = [
    {
        id: "rs_1",
        route: "LOS → LHR",
        dates: "Next week",
        raw: {
            from: "LOS",
            to: "LHR",
            departureDate: new Date().toISOString(),
            passengers: 1,
            travelClass: "Economy"
        }
    }
];

const activeBookings = new Map<string, FlightBookingResponse>();

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function mockSearchFlights(request: FlightSearchRequest): Promise<FlightOffer[]> {
    await randomDelay(1000, 2500); // Searching takes time

    if (!request.from || !request.to) {
        throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "Missing origin or destination" });
    }

    const multiplier = request.travelClass === "Business" ? 2.5 : request.travelClass === "First" ? 4 : 1;
    const basePrice = (request.from === "LOS" && request.to === "ABV") ? 85000 : 750000;

    // Generate dummy offers
    const offers: FlightOffer[] = [
        {
            id: `of_${Math.random().toString(36).substring(7)}`,
            airline: "Air Peace",
            airlineCode: "P4",
            flightNumber: "P4 7120",
            departureTime: "08:30 AM",
            arrivalTime: "09:45 AM",
            duration: "1h 15m",
            stops: 0,
            priceNgn: Math.floor(basePrice * multiplier * 1.1) * request.passengers,
            travelClass: request.travelClass,
        },
        {
            id: `of_${Math.random().toString(36).substring(7)}`,
            airline: "Green Africa",
            airlineCode: "Q9",
            flightNumber: "Q9 301",
            departureTime: "11:15 AM",
            arrivalTime: "12:35 PM",
            duration: "1h 20m",
            stops: 0,
            priceNgn: Math.floor(basePrice * multiplier * 0.9) * request.passengers,
            travelClass: request.travelClass,
        },
        {
            id: `of_${Math.random().toString(36).substring(7)}`,
            airline: "British Airways",
            airlineCode: "BA",
            flightNumber: "BA 74",
            departureTime: "10:50 PM",
            arrivalTime: "05:15 AM",
            duration: "6h 25m",
            stops: 0,
            priceNgn: Math.floor(basePrice * multiplier * 1.5) * request.passengers,
            travelClass: request.travelClass,
        }
    ];

    // Filter out BA for domestic
    if (request.from === "LOS" && request.to === "ABV") {
        return offers.slice(0, 2);
    }

    return offers;
}

export async function mockGetRecentSearches(): Promise<RecentSearch[]> {
    await randomDelay(200, 500);
    return mockRecentSearches;
}

export async function mockSaveRecentSearch(search: RecentSearch): Promise<void> {
    mockRecentSearches = [search, ...mockRecentSearches].slice(0, 5); // keep last 5
}

export async function mockBookFlight(offerId: string, totalAmountNgn: number): Promise<{ bookingId: string }> {
    await randomDelay(800, 1500); // Processing

    const bookingId = `bk_${Math.random().toString(36).substring(2, 9)}`;

    // Initial state
    activeBookings.set(bookingId, {
        bookingId,
        offerId,
        status: "PENDING_AGENCY",
        totalAmountNgn
    });

    // Simulate state machine transitions
    setTimeout(() => {
        const bk = activeBookings.get(bookingId);
        if (bk && bk.status === "PENDING_AGENCY") {
            if (Math.random() > 0.9) {
                activeBookings.set(bookingId, { ...bk, status: "FAILED" });
            } else {
                activeBookings.set(bookingId, { 
                    ...bk, 
                    status: "CONFIRMED", 
                    pnr: Math.random().toString(36).substring(2, 8).toUpperCase() 
                });
            }
        }
    }, 4000);

    return { bookingId };
}

export async function mockGetFlightBookingStatus(bookingId: string): Promise<FlightBookingResponse> {
    await randomDelay(200, 400); // Polling latency
    const bk = activeBookings.get(bookingId);
    if (!bk) {
        throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Booking not found" });
    }
    return bk;
}
