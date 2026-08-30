/**
 * TanStack Query hooks for Flights.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/lib/types/api";

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
    route: string;
    dates: string;
    raw: FlightSearchRequest;
}

export const AIRPORTS: Airport[] = [
    { code: "LOS", city: "Lagos", country: "Nigeria" },
    { code: "ABV", city: "Abuja", country: "Nigeria" },
    { code: "PHC", city: "Port Harcourt", country: "Nigeria" },
    { code: "LHR", city: "London", country: "United Kingdom" },
    { code: "DXB", city: "Dubai", country: "UAE" },
    { code: "JFK", city: "New York", country: "USA" },
];

export const flightKeys = {
    all: ["flights"] as const,
    recentSearches: () => [...flightKeys.all, "recent"] as const,
    bookingStatus: (id: string) => [...flightKeys.all, "booking", id] as const,
};

export function useRecentSearches() {
    return useQuery<RecentSearch[]>({
        queryKey: flightKeys.recentSearches(),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<RecentSearch[]>>("/flights/recent-searches");
            return res.data.data;
        },
    });
}

export function useSaveRecentSearch() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, RecentSearch>({
        mutationFn: async (search) => {
            await apiClient.post("/flights/recent-searches", search);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: flightKeys.recentSearches() });
        },
    });
}

export function useSearchFlights() {
    return useMutation<FlightOffer[], Error, FlightSearchRequest>({
        mutationFn: async (request) => {
            const res = await apiClient.post<ApiResponse<FlightOffer[]>>("/flights/search", request);
            return res.data.data;
        },
    });
}

export function useBookFlight() {
    return useMutation<{ bookingId: string }, Error, { offerId: string; totalAmountNgn: number }>({
        mutationFn: async (payload) => {
            const res = await apiClient.post<ApiResponse<{ bookingId: string }>>("/flights/book", payload);
            return res.data.data;
        },
    });
}

export function useFlightBookingStatus(bookingId: string | null) {
    return useQuery<FlightBookingResponse>({
        queryKey: flightKeys.bookingStatus(bookingId!),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<FlightBookingResponse>>(`/flights/booking/${bookingId}`);
            return res.data.data;
        },
        enabled: !!bookingId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status === "CONFIRMED" || status === "FAILED") {
                return false; // Stop polling
            }
            return 2500; // Poll while PENDING_AGENCY
        },
    });
}
