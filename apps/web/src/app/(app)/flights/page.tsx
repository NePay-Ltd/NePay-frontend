"use client";

import * as React from "react";
import { format } from "date-fns";
import { 
    Plane, 
    Calendar as CalendarIcon, 
    ArrowRightLeft,
    Users,
    ChevronDown,
    Search,
    Loader2,
    Check,
    MapPin
} from "lucide-react";

import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { 
    useSearchFlights, 
    useRecentSearches, 
    useSaveRecentSearch,
    useBookFlight,
    useFlightBookingStatus 
} from "@/lib/queries/flights";
import { AIRPORTS, type Airport, type FlightOffer, type FlightSearchRequest } from "@/lib/mock-flights";

import { Panel, PanelHeader, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { Chip } from "@/components/shared/chip";
import { EmptyState } from "@/components/shared/empty-state";
import { RowItem } from "@/components/shared/row-item";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";

export default function FlightsPage() {
    // ─── Form State ─────────────────────────────────────────────────────────
    const [tripType, setTripType] = React.useState<"One-way" | "Round Trip" | "Multi-city">("One-way");
    const [from, setFrom] = React.useState<string>("");
    const [to, setTo] = React.useState<string>("");
    const [departureDate, setDepartureDate] = React.useState<Date | undefined>(new Date());
    const [returnDate, setReturnDate] = React.useState<Date | undefined>();
    const [passengers, setPassengers] = React.useState<number>(1);
    const [travelClass, setTravelClass] = React.useState<string>("Economy");

    // ─── Swap Animation State ───────────────────────────────────────────────
    const [isSwapping, setIsSwapping] = React.useState(false);
    const handleSwap = () => {
        setIsSwapping(true);
        const temp = from;
        setFrom(to);
        setTo(temp);
        setTimeout(() => setIsSwapping(false), 300);
    };

    // ─── Queries & Mutations ────────────────────────────────────────────────
    const { data: recentSearches = [] } = useRecentSearches();
    const saveSearch = useSaveRecentSearch();
    const searchFlights = useSearchFlights();
    const bookFlight = useBookFlight();

    const handleSearch = () => {
        if (!from || !to || !departureDate) return;

        const req: FlightSearchRequest = {
            from,
            to,
            departureDate: departureDate.toISOString(),
            returnDate: returnDate ? returnDate.toISOString() : undefined,
            passengers,
            travelClass
        };

        searchFlights.mutate(req, {
            onSuccess: () => {
                const searchLabel = tripType === "Round Trip" && returnDate
                    ? `${format(departureDate, "MMM dd")} – ${format(returnDate, "MMM dd")}`
                    : format(departureDate, "MMM dd");
                
                saveSearch.mutate({
                    id: `rs_${Date.now()}`,
                    route: `${from} → ${to}`,
                    dates: searchLabel,
                    raw: req
                });
            }
        });
    };

    const handleRecentSearchClick = (raw: FlightSearchRequest) => {
        setFrom(raw.from);
        setTo(raw.to);
        setDepartureDate(new Date(raw.departureDate));
        if (raw.returnDate) {
            setReturnDate(new Date(raw.returnDate));
            setTripType("Round Trip");
        } else {
            setReturnDate(undefined);
            setTripType("One-way");
        }
        setPassengers(raw.passengers);
        setTravelClass(raw.travelClass);
        // Don't auto-execute, let user review and click search.
    };

    // ─── Booking Modal State ────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [modalState, setModalState] = React.useState<TransactionState>("confirm");
    const [selectedOffer, setSelectedOffer] = React.useState<FlightOffer | null>(null);
    const [bookingId, setBookingId] = React.useState<string | null>(null);

    const { data: bookingStatus } = useFlightBookingStatus(bookingId);

    // Sync booking status to modal
    React.useEffect(() => {
        if (modalState === "processing" && bookingStatus) {
            if (bookingStatus.status === "CONFIRMED") {
                setModalState("success");
            } else if (bookingStatus.status === "FAILED") {
                setModalState("error");
            }
        }
    }, [bookingStatus, modalState]);

    const handleInitiateBooking = (offer: FlightOffer) => {
        setSelectedOffer(offer);
        setModalState("confirm");
        setIsModalOpen(true);
    };

    const handleConfirmBooking = () => {
        if (!selectedOffer) return;
        setModalState("processing");
        bookFlight.mutate({ offerId: selectedOffer.id, totalAmountNgn: selectedOffer.priceNgn }, {
            onSuccess: (data) => setBookingId(data.bookingId),
            onError: () => setModalState("error") // Network fail
        });
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedOffer(null);
        setBookingId(null);
    };

    const getAirportCity = (code: string) => AIRPORTS.find(a => a.code === code)?.city || "Select Airport";

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-ink">Flights</h1>
                <p className="mt-2 text-sm text-body">
                    Search and book flights with instant confirmation.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* ── Main Search Area ── */}
                <div className="space-y-6 lg:col-span-8">
                    <Panel>
                        <PanelBody className="p-6">
                            {/* Trip Types */}
                            <div className="flex flex-wrap items-center gap-2 mb-6">
                                {["One-way", "Round Trip", "Multi-city"].map((type) => (
                                    <Chip
                                        key={type}
                                        active={tripType === type}
                                        onClick={() => setTripType(type as any)}
                                    >
                                        {type}
                                    </Chip>
                                ))}
                            </div>

                            <div className="space-y-4">
                                {/* Route Strip */}
                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                    <div className="flex-1 w-full">
                                        <AirportPicker value={from} onChange={setFrom} label="From" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSwap}
                                        className={cn(
                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-gray-50 text-muted transition-all hover:border-violet-300 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 sm:rotate-0 rotate-90",
                                            isSwapping && "sm:-rotate-180 rotate-[270deg]"
                                        )}
                                    >
                                        <ArrowRightLeft className="h-4 w-4" />
                                    </button>
                                    <div className="flex-1 w-full">
                                        <AirportPicker value={to} onChange={setTo} label="To" />
                                    </div>
                                </div>

                                {/* Dates & Passengers */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex flex-1 gap-2">
                                        {/* Departure Date */}
                                        <div className="flex-1">
                                            <DatePicker value={departureDate} onChange={setDepartureDate} label="Departure" />
                                        </div>
                                        
                                        {/* Return Date (Animated Container) */}
                                        <div className={cn(
                                            "grid transition-[grid-template-columns,opacity] duration-300 ease-in-out",
                                            tripType === "Round Trip" ? "grid-cols-[1fr] opacity-100 flex-1 ml-2" : "grid-cols-[0fr] opacity-0 ml-0"
                                        )}>
                                            <div className="overflow-hidden">
                                                <DatePicker value={returnDate} onChange={setReturnDate} label="Return" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Passengers & Class */}
                                    <div className="w-full sm:w-[240px]">
                                        <PassengerPicker 
                                            passengers={passengers} 
                                            setPassengers={setPassengers}
                                            travelClass={travelClass}
                                            setTravelClass={setTravelClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Search Button */}
                            <div className="mt-6 flex justify-end">
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    onClick={handleSearch}
                                    disabled={!from || !to || !departureDate || searchFlights.isPending}
                                    className="w-full sm:w-auto"
                                >
                                    {searchFlights.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Search Flights
                                </Button>
                            </div>
                        </PanelBody>
                    </Panel>

                    {/* Results Area */}
                    <div className="mt-8">
                        {searchFlights.isIdle && (
                            <EmptyState
                                icon={Plane}
                                heading="Ready to fly?"
                                description="Search to see available flights and fares."
                            />
                        )}

                        {searchFlights.isPending && (
                            <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4 rounded-xl border border-border bg-white">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
                                <p className="text-sm font-medium text-muted">Searching airlines...</p>
                            </div>
                        )}

                        {searchFlights.isSuccess && searchFlights.data && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-ink">Select Departure Flight</h3>
                                <div className="space-y-3">
                                    {searchFlights.data.length === 0 ? (
                                        <EmptyState
                                            icon={Plane}
                                            heading="No flights found"
                                            description="Try adjusting your dates or routes."
                                        />
                                    ) : (
                                        searchFlights.data.map(offer => (
                                            <FlightRow 
                                                key={offer.id} 
                                                offer={offer} 
                                                onSelect={() => handleInitiateBooking(offer)} 
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Sidebar (Recent Searches) ── */}
                <div className="lg:col-span-4">
                    <Panel>
                        <PanelHeader title="Recent Searches" />
                        <PanelBody className="p-0">
                            {recentSearches.length === 0 ? (
                                <div className="p-6 text-center text-sm text-muted">No recent searches</div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {recentSearches.map(search => (
                                        <button
                                            key={search.id}
                                            onClick={() => handleRecentSearchClick(search.raw)}
                                            className="w-full text-left p-4 hover:bg-gray-50 transition-colors focus-visible:bg-gray-50 focus-visible:outline-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                                                    <Search className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-ink">{search.route}</p>
                                                    <p className="text-xs text-muted mt-0.5">{search.dates} · {search.raw.passengers} Pax</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </PanelBody>
                    </Panel>
                </div>
            </div>

            {/* ── Booking Modal ── */}
            <TransactionModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                state={modalState}
                confirmTitle="Confirm Booking"
                confirmContent={
                    <div className="space-y-4">
                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-sm font-medium text-ink">{selectedOffer?.airline} - {selectedOffer?.flightNumber}</p>
                            <p className="text-xs text-muted">{selectedOffer?.departureTime} to {selectedOffer?.arrivalTime} ({selectedOffer?.duration})</p>
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total Price:</span>
                            <span>{formatNaira(selectedOffer?.priceNgn || 0)}</span>
                        </div>
                    </div>
                }
                onConfirm={handleConfirmBooking}
                onCancel={handleModalClose}
                confirmButtonLabel="Pay & Book"
                successTitle="Flight Booked!"
                successDescription={`Your flight was booked successfully! Booking Ref: ${bookingStatus?.pnr || "PENDING"}`}
                onSuccessAction={handleModalClose}
                errorTitle="Booking Failed"
                errorDescription={bookingStatus?.status === "FAILED" ? "Booking failed via agency. Your wallet was not charged." : "A network error occurred."}
                onErrorAction={handleModalClose}
            />
        </div>
    );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function AirportPicker({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) {
    const [open, setOpen] = React.useState(false);
    const selected = AIRPORTS.find(a => a.code === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="flex h-14 w-full flex-col items-start justify-center rounded-xl border border-border bg-white px-4 text-left transition-colors hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
                    <div className="flex w-full items-center justify-between mt-0.5">
                        <span className={cn("text-sm font-medium truncate", !selected && "text-muted")}>
                            {selected ? `${selected.city} (${selected.code})` : "Select Airport"}
                        </span>
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search airport or city..." />
                    <CommandList>
                        <CommandEmpty>No airport found.</CommandEmpty>
                        <CommandGroup>
                            {AIRPORTS.map((airport) => (
                                <CommandItem
                                    key={airport.code}
                                    value={`${airport.city} ${airport.code} ${airport.country}`}
                                    onSelect={() => {
                                        onChange(airport.code);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === airport.code ? "opacity-100" : "opacity-0")} />
                                    <MapPin className="mr-2 h-4 w-4 text-muted" />
                                    <div className="flex flex-col">
                                        <span>{airport.city} ({airport.code})</span>
                                        <span className="text-xs text-muted">{airport.country}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function DatePicker({ value, onChange, label }: { value: Date | undefined, onChange: (val: Date | undefined) => void, label: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex h-14 w-full flex-col items-start justify-center rounded-xl border border-border bg-white px-4 text-left transition-colors hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
                    <div className="flex w-full items-center justify-between mt-0.5">
                        <span className={cn("text-sm font-medium", !value && "text-muted")}>
                            {value ? format(value, "PP") : "Select Date"}
                        </span>
                        <CalendarIcon className="h-4 w-4 text-muted" />
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={onChange}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                />
            </PopoverContent>
        </Popover>
    );
}

function PassengerPicker({ passengers, setPassengers, travelClass, setTravelClass }: any) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex h-14 w-full flex-col items-start justify-center rounded-xl border border-border bg-white px-4 text-left transition-colors hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Travelers</span>
                    <div className="flex w-full items-center justify-between mt-0.5">
                        <span className="text-sm font-medium truncate">
                            {passengers} Pax, {travelClass}
                        </span>
                        <Users className="h-4 w-4 text-muted" />
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-4" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Passengers</span>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:bg-gray-50"
                            >
                                -
                            </button>
                            <span className="w-4 text-center text-sm font-semibold">{passengers}</span>
                            <button 
                                onClick={() => setPassengers(Math.min(9, passengers + 1))}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:bg-gray-50"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    
                    <div className="border-t border-border pt-4">
                        <span className="text-sm font-medium mb-2 block">Cabin Class</span>
                        <div className="space-y-2">
                            {["Economy", "Business", "First"].map((c) => (
                                <label key={c} className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="travelClass" 
                                        value={c}
                                        checked={travelClass === c}
                                        onChange={(e) => setTravelClass(e.target.value)}
                                        className="h-4 w-4 accent-violet-600"
                                    />
                                    <span className="text-sm text-ink">{c}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function FlightRow({ offer, onSelect }: { offer: FlightOffer, onSelect: () => void }) {
    return (
        <button 
            onClick={onSelect}
            className="w-full group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-white p-4 text-left transition-all hover:border-violet-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
        >
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-50 font-bold text-violet-700">
                    {offer.airlineCode}
                </div>
                <div>
                    <h4 className="font-semibold text-ink">{offer.departureTime} – {offer.arrivalTime}</h4>
                    <p className="text-sm text-muted">{offer.airline} · {offer.flightNumber}</p>
                </div>
            </div>
            
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-border sm:border-none pt-3 sm:pt-0">
                <div className="text-right">
                    <span className="font-mono text-xl font-bold text-ink">{formatNaira(offer.priceNgn)}</span>
                    <div className="flex items-center justify-end gap-2 mt-0.5">
                        <span className="text-xs text-muted">{offer.duration} · {offer.stops === 0 ? "Nonstop" : `${offer.stops} stop`}</span>
                        <span className="inline-block rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                            {offer.travelClass}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}
