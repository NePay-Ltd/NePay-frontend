import { Hero } from "@/components/marketing/hero";
import { TrustBar } from "@/components/marketing/trust-bar";
import { BillsFeature } from "@/components/marketing/bills-feature";
import { CryptoFeature } from "@/components/marketing/crypto-feature";
import { FlightsFeature } from "@/components/marketing/flights-feature";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Testimonials } from "@/components/marketing/testimonials";
import { SecurityFeature } from "@/components/marketing/security-feature";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <BillsFeature />
      <CryptoFeature />
      <FlightsFeature />
      <HowItWorks />
      <Testimonials />
      <SecurityFeature />
      <FaqSection />
      <CtaSection />
    </>
  );
}
