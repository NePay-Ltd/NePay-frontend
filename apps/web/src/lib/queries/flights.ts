/**
 * TanStack Query hooks for Flights.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    mockSearchFlights,
    mockGetRecentSearches,
    mockSaveRecentSearch,
    mockBookFlight,
    mockGetFlightBookingStatus,
    type FlightSearchRequest,
    type FlightOffer,
    type RecentSearch,
    type FlightBookingResponse,
} from "@/lib/mock-flights";

export const flightKeys = {
    all: ["flights"] as const,
    recentSearches: () => [...flightKeys.all, "recent"] as const,
    bookingStatus: (id: string) => [...flightKeys.all, "booking", id] as const,
};

export function useRecentSearches() {
    return useQuery<RecentSearch[]>({
        queryKey: flightKeys.recentSearches(),
        queryFn: mockGetRecentSearches,
    });
}

export function useSaveRecentSearch() {
    const queryClient = useQueryClient();
    return useMutation<void, Error, RecentSearch>({
        mutationFn: mockSaveRecentSearch,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: flightKeys.recentSearches() });
        },
    });
}

export function useSearchFlights() {
    return useMutation<FlightOffer[], Error, FlightSearchRequest>({
        mutationFn: mockSearchFlights,
    });
}

export function useBookFlight() {
    return useMutation<{ bookingId: string }, Error, { offerId: string; totalAmountNgn: number }>({
        mutationFn: ({ offerId, totalAmountNgn }) => mockBookFlight(offerId, totalAmountNgn),
    });
}

export function useFlightBookingStatus(bookingId: string | null) {
    return useQuery<FlightBookingResponse>({
        queryKey: flightKeys.bookingStatus(bookingId!),
        queryFn: () => mockGetFlightBookingStatus(bookingId!),
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
