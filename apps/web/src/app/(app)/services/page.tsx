"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
    Smartphone, 
    Wifi, 
    Lightbulb, 
    Gift, 
    Plane, 
    Landmark, 
    Bitcoin, 
    GraduationCap, 
    Dices, 
    Shield, 
    Droplet, 
    Car, 
    HeartHandshake, 
    MoreHorizontal,
    Receipt
} from "lucide-react";
import { toast } from "sonner";

import { Tile } from "@/components/shared/tile";
import { Panel, PanelHeader, PanelBody } from "@/components/shared/panel";
import { RowItem } from "@/components/shared/row-item";
import { Button } from "@/components/shared/button";
import { formatNaira } from "@/lib/format";
import { useSavedBillers } from "@/lib/queries/services";

export default function ServicesPage() {
    const router = useRouter();
    const { data: savedBillers = [], isLoading } = useSavedBillers();

    const handleComingSoon = () => toast.info("This service is coming soon!");

    const handlePayAgain = (biller: typeof savedBillers[0]) => {
        if (biller.serviceType === "electricity" || biller.serviceType === "cable-tv") {
            const provider = biller.billerName.toLowerCase().replace(" ", "-");
            const identifier = biller.identifier.replace(/[^0-9]/g, ''); // Extract just numbers for mock sake
            router.push(`/services/pay-bills?provider=${provider}&meter=${identifier}`);
        } else if (biller.serviceType === "data" || biller.serviceType === "airtime") {
            const network = biller.billerName.split(" ")[0] || "MTN";
            const phone = biller.identifier.replace(/[^0-9]/g, '');
            router.push(`/services/airtime-data?tab=${biller.serviceType}&network=${network}&phone=${phone}`);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-ink">Services</h1>
                <p className="mt-2 text-sm text-body">
                    Pay bills, buy airtime, and manage your everyday expenses.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-10">
                {/* ── Left Column (Service Tiles) ── */}
                <div className="space-y-8 xl:col-span-8">
                    
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-ink">Popular</h2>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-4">
                            <Tile 
                                icon={Smartphone} 
                                label="Airtime & Data" 
                                onClick={() => router.push("/services/airtime-data")} 
                            />
                            <Tile 
                                icon={Lightbulb} 
                                label="Electricity" 
                                onClick={() => router.push("/services/pay-bills?provider=ikeja-electric")} 
                            />
                            <Tile 
                                icon={Gift} 
                                label="Gift Cards" 
                                onClick={handleComingSoon} 
                            />
                            <Tile 
                                icon={Plane} 
                                label="Flights" 
                                onClick={handleComingSoon} 
                            />
                            <Tile 
                                icon={Landmark} 
                                label="Withdraw" 
                                onClick={() => router.push("/withdraw")} 
                            />
                            <Tile 
                                icon={Bitcoin} 
                                label="Receive Crypto" 
                                onClick={() => router.push("/receive-crypto")} 
                            />
                            <Tile 
                                icon={MoreHorizontal} 
                                label="All Services" 
                                onClick={() => {}} 
                            />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-ink">More Services</h2>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-4">
                            <Tile icon={GraduationCap} label="Education" onClick={handleComingSoon} />
                            <Tile icon={Dices} label="Betting" onClick={handleComingSoon} />
                            <Tile icon={Shield} label="Insurance" onClick={handleComingSoon} />
                            <Tile icon={Wifi} label="Internet" onClick={handleComingSoon} />
                            <Tile icon={Droplet} label="Water" onClick={handleComingSoon} />
                            <Tile icon={Car} label="Car Hire" onClick={handleComingSoon} />
                            <Tile icon={HeartHandshake} label="Donations" onClick={handleComingSoon} />
                            <Tile icon={MoreHorizontal} label="More" onClick={handleComingSoon} />
                        </div>
                    </section>
                </div>

                {/* ── Right Column (Saved Billers & Promo) ── */}
                <div className="space-y-6 xl:col-span-4">
                    <Panel>
                        <PanelHeader title="Saved Billers" />
                        <PanelBody className="p-0">
                            {isLoading ? (
                                <div className="p-5 text-center text-sm text-muted">Loading saved billers...</div>
                            ) : savedBillers.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {savedBillers.map((biller) => (
                                        <RowItem
                                            key={biller.id}
                                            icon={Receipt}
                                            iconTint="violet"
                                            title={biller.billerName}
                                            subtitle={`${biller.identifier} • last paid ${formatNaira(biller.lastPaidAmount)}`}
                                            className="px-5 py-4"
                                            trailing={
                                                <Button 
                                                    variant="quiet" 
                                                    size="sm"
                                                    className="text-violet-600 font-semibold"
                                                    onClick={() => handlePayAgain(biller)}
                                                >
                                                    Pay again
                                                </Button>
                                            }
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-5 text-center text-sm text-muted">No saved billers yet.</div>
                            )}
                        </PanelBody>
                    </Panel>

                    {/* Promo Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white shadow-sm">
                        <div className="relative z-10 space-y-2">
                            <h3 className="font-bold">Pay every bill from one balance.</h3>
                            <p className="text-sm text-violet-100">
                                Electricity, data, airtime, and more. Instant, reliable, and secure.
                            </p>
                        </div>
                        {/* Decorative circle */}
                        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
