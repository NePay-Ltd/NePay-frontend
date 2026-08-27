"use client";

import * as React from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Plane, 
    Calendar as CalendarIcon, 
    ArrowRightLeft,
    Users,
    Search,
    Loader2,
    History,
    ChevronDown
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
import { AIRPORTS, type FlightOffer, type FlightSearchRequest } from "@/lib/mock-flights";

import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { Chip } from "@/components/shared/chip";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionModal, type TransactionState } from "@/components/shared/transaction-modal";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { AirportBottomSheet } from "@/components/flights/AirportBottomSheet";
import { TravelerBottomSheet } from "@/components/flights/TravelerBottomSheet";

export default function FlightsPage() {
    // ─── Form State ─────────────────────────────────────────────────────────
    const [tripType, setTripType] = React.useState<"One-way" | "Round Trip" | "Multi-city">("One-way");
    const [from, setFrom] = React.useState<string>("");
    const [to, setTo] = React.useState<string>("");
    const [departureDate, setDepartureDate] = React.useState<Date | undefined>(new Date());
    const [returnDate, setReturnDate] = React.useState<Date | undefined>();
    
    // Travelers split
    const [adults, setAdults] = React.useState(1);
    const [childrenCount, setChildrenCount] = React.useState(0);
    const [infants, setInfants] = React.useState(0);
    const [travelClass, setTravelClass] = React.useState<string>("Economy");
    const totalPassengers = adults + childrenCount + infants;

    // Bottom Sheet States
    const [fromPickerOpen, setFromPickerOpen] = React.useState(false);
    const [toPickerOpen, setToPickerOpen] = React.useState(false);
    const [travelerPickerOpen, setTravelerPickerOpen] = React.useState(false);

    // ─── Swap Animation State ───────────────────────────────────────────────
    const [isSwapping, setIsSwapping] = React.useState(false);
    const handleSwap = () => {
        setIsSwapping(true);
        setTimeout(() => {
            const temp = from;
            setFrom(to);
            setTo(temp);
        }, 150); // Swap values halfway through animation
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
            passengers: totalPassengers, // Sum up for API
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
        // Basic fallback: just put them all in adults if reloading from raw
        setAdults(raw.passengers || 1);
        setChildrenCount(0);
        setInfants(0);
        setTravelClass(raw.travelClass);
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
            onError: () => setModalState("error")
        });
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedOffer(null);
        setBookingId(null);
    };

    const getAirportLabel = (code: string) => {
        const a = AIRPORTS.find(x => x.code === code);
        return a ? `${a.city} (${a.code})` : "Select Airport";
    };

    const isValid = !!from && !!to && !!departureDate && (tripType === "Round Trip" ? !!returnDate : true);

    return (
        <div className="space-y-8 pb-32">
            <div className="mx-auto max-w-2xl">
                {/* ── Main Search Area ── */}
                <Panel className="rounded-3xl">
                    <PanelBody className="p-4 sm:p-6 lg:p-8">
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
                                <motion.div 
                                    className="flex-1 w-full"
                                    animate={{ scale: isSwapping ? 0.96 : 1, opacity: isSwapping ? 0.7 : 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <FieldButton 
                                        label="From" 
                                        value={getAirportLabel(from)} 
                                        isActive={!!from}
                                        onClick={() => setFromPickerOpen(true)} 
                                    />
                                </motion.div>
                                
                                <motion.button
                                    type="button"
                                    onClick={handleSwap}
                                    whileTap={{ scale: 0.90 }}
                                    animate={{ rotate: isSwapping ? 180 : 0 }}
                                    transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-gray-50 text-muted transition-colors hover:border-violet-300 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 sm:rotate-0 rotate-90 my-1 sm:my-0 shadow-sm"
                                >
                                    <ArrowRightLeft className="h-4 w-4" />
                                </motion.button>

                                <motion.div 
                                    className="flex-1 w-full"
                                    animate={{ scale: isSwapping ? 0.96 : 1, opacity: isSwapping ? 0.7 : 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <FieldButton 
                                        label="To" 
                                        value={getAirportLabel(to)} 
                                        isActive={!!to}
                                        onClick={() => setToPickerOpen(true)} 
                                    />
                                </motion.div>
                            </div>

                            {/* Dates & Passengers */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex flex-1 gap-2">
                                    {/* Departure Date */}
                                    <div className="flex-1">
                                        <DatePicker value={departureDate} onChange={setDepartureDate} label="Departure" />
                                    </div>
                                    
                                    {/* Return Date (Animated Container) */}
                                    <AnimatePresence>
                                        {tripType === "Round Trip" && (
                                            <motion.div
                                                initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                                                animate={{ width: "50%", opacity: 1, marginLeft: 8 }}
                                                exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="w-full h-full min-w-[120px]">
                                                    <DatePicker value={returnDate} onChange={setReturnDate} label="Return" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Passengers & Class */}
                                <div className="w-full sm:w-[240px]">
                                    <FieldButton 
                                        label="Travelers" 
                                        value={`${totalPassengers} Pax, ${travelClass}`} 
                                        isActive={true}
                                        icon={<Users className="h-4 w-4 text-muted" />}
                                        onClick={() => setTravelerPickerOpen(true)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="mt-6">
                            <motion.div whileTap={{ scale: isValid && !searchFlights.isPending ? 0.96 : 1 }}>
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    fullWidth
                                    onClick={handleSearch}
                                    disabled={!isValid || searchFlights.isPending}
                                    className="h-14 sm:h-16 rounded-2xl text-base sm:text-lg font-bold shadow-md shadow-violet-500/20"
                                >
                                    {searchFlights.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                                    Search Flights
                                </Button>
                            </motion.div>
                        </div>
                    </PanelBody>
                </Panel>

                {/* ── Results & Recent Searches Area ── */}
                <div className="mt-8">
                    {searchFlights.isIdle && (
                        <div className="space-y-6">
                            {recentSearches.length > 0 ? (
                                <div>
                                    <h3 className="text-sm font-bold text-ink mb-4 px-2">Recent Searches</h3>
                                    <div className="space-y-2">
                                        {recentSearches.map(search => (
                                            <motion.button
                                                key={search.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleRecentSearchClick(search.raw)}
                                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-border hover:border-violet-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 text-left"
                                            >
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-50 text-muted">
                                                    <History className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[15px] font-bold text-ink">{search.route}</p>
                                                    <p className="text-xs font-medium text-muted mt-0.5">{search.dates} · {search.raw.passengers} Pax</p>
                                                </div>
                                                <ChevronDown className="h-4 w-4 text-muted -rotate-90" />
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Plane}
                                    heading="Ready to fly?"
                                    description="Search to see available flights and fares."
                                />
                            )}
                        </div>
                    )}

                    {searchFlights.isSuccess && searchFlights.data && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-ink px-2">Select Departure Flight</h3>
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

            {/* ── Bottom Sheets ── */}
            <AirportBottomSheet 
                open={fromPickerOpen}
                onClose={() => setFromPickerOpen(false)}
                value={from}
                onChange={setFrom}
                label="From"
            />
            
            <AirportBottomSheet 
                open={toPickerOpen}
                onClose={() => setToPickerOpen(false)}
                value={to}
                onChange={setTo}
                label="To"
            />

            <TravelerBottomSheet
                open={travelerPickerOpen}
                onClose={() => setTravelerPickerOpen(false)}
                adults={adults}
                setAdults={setAdults}
                childrenCount={childrenCount}
                setChildrenCount={setChildrenCount}
                infants={infants}
                setInfants={setInfants}
                travelClass={travelClass}
                setTravelClass={setTravelClass}
            />

            {/* ── Booking Modal ── */}
            <TransactionModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                state={modalState}
                confirmTitle="Confirm Booking"
                confirmContent={
                    <div className="space-y-4">
                        <div className="rounded-xl bg-gray-50 p-4 border border-border">
                            <p className="text-sm font-bold text-ink">{selectedOffer?.airline} - {selectedOffer?.flightNumber}</p>
                            <p className="text-xs font-medium text-muted mt-1">{selectedOffer?.departureTime} to {selectedOffer?.arrivalTime} ({selectedOffer?.duration})</p>
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg">
                            <span className="text-muted">Total Price:</span>
                            <span className="text-ink">{formatNaira(selectedOffer?.priceNgn || 0)}</span>
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
                errorDescription={bookingStatus?.status === "FAILED" ? "Flight booking could not be completed. Your wallet was not charged." : "A network error occurred."}
                onErrorAction={handleModalClose}
            />
        </div>
    );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function FieldButton({ label, value, onClick, isActive, icon }: any) {
    return (
        <motion.button 
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="flex h-14 sm:h-16 w-full flex-col items-start justify-center rounded-2xl border-2 border-border bg-white px-4 text-left transition-colors hover:border-violet-300 focus-visible:outline-none focus-visible:border-violet-600"
        >
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
            <div className="flex w-full items-center justify-between mt-0.5">
                <span className={cn("text-[15px] sm:text-base font-bold truncate", isActive ? "text-ink" : "text-muted")}>
                    {value}
                </span>
                {icon}
            </div>
        </motion.button>
    );
}

function DatePicker({ value, onChange, label }: { value: Date | undefined, onChange: (val: Date | undefined) => void, label: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex h-14 sm:h-16 w-full flex-col items-start justify-center rounded-2xl border-2 border-border bg-white px-4 text-left transition-colors hover:border-violet-300 focus-visible:outline-none focus-visible:border-violet-600">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
                    <div className="flex w-full items-center justify-between mt-0.5">
                        <span className={cn("text-[15px] sm:text-base font-bold truncate", !value && "text-muted")}>
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

function FlightRow({ offer, onSelect }: { offer: FlightOffer, onSelect: () => void }) {
    return (
        <motion.button 
            onClick={onSelect}
            whileTap={{ scale: 0.98 }}
            className="w-full group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5 text-left transition-all hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
        >
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-50 font-black text-violet-700">
                    {offer.airlineCode}
                </div>
                <div>
                    <h4 className="font-bold text-ink text-[17px]">{offer.departureTime} – {offer.arrivalTime}</h4>
                    <p className="text-sm font-medium text-muted mt-0.5">{offer.airline} · {offer.flightNumber}</p>
                </div>
            </div>
            
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-border sm:border-none pt-4 sm:pt-0">
                <div className="text-right">
                    <span className="font-mono text-2xl font-black tracking-tight text-ink">{formatNaira(offer.priceNgn)}</span>
                    <div className="flex items-center justify-end gap-2 mt-1">
                        <span className="text-xs font-semibold text-muted">{offer.duration} · {offer.stops === 0 ? "Nonstop" : `${offer.stops} stop`}</span>
                        <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                            {offer.travelClass}
                        </span>
                    </div>
                </div>
            </div>
        </motion.button>
    );
}
