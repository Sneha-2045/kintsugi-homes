import { createFileRoute } from "@tanstack/react-router";
import { HeroSearch } from "@/components/home/HeroSearch";
import { HomeDiscovery } from "@/components/home/HomeDiscovery";
import { HomeValueSections } from "@/components/home/HomeValueSections";
import { OpportunityCategories } from "@/components/home/OpportunityCategories";
import { FreshListings } from "@/components/home/FreshListings";
import { RentalListings } from "@/components/home/RentalListings";
import { AgentSpotlight } from "@/components/home/AgentSpotlight";
import { MemberPromo } from "@/components/home/MemberPromo";
import { RentRewardsPromo } from "@/components/home/RentRewardsPromo";
import { PricingSection } from "@/components/home/PricingSection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { MembershipComparison } from "@/components/home/MembershipComparison";
import { AudioArticles } from "@/components/home/AudioArticles";
import { AkiyaInfo } from "@/components/home/AkiyaInfo";
import { FAQSection } from "@/components/home/FAQSection";
import { PropertyTypes } from "@/components/home/PropertyTypes";
import { RegionGrid } from "@/components/home/RegionGrid";
import { faqs } from "@/data/faq";
import { canonicalLink } from "@/lib/seo";

const title = "US Foreclosure Properties & Auctions | Rylestate.com";
const description =
  "Browse US foreclosure properties and upcoming auctions across Florida, Georgia and North Carolina. Japan property listings are also available. Review listing sources and confirm current details with the publisher.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
    links: [canonicalLink("/")],
  }),
  component: Home,
});

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <HeroSearch />
      <FreshListings />
      <RentalListings />
      <AgentSpotlight />
      <OpportunityCategories />
      <PropertyTypes />
      <HomeDiscovery />
      <MemberPromo />
      <RentRewardsPromo />
      <PricingSection />
      <PartnersSection />
      <MembershipComparison />
      <AudioArticles />
      <AkiyaInfo />
      <RegionGrid />
      <HomeValueSections />
      <FAQSection />
    </>
  );
}
