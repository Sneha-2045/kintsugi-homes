import { createFileRoute } from "@tanstack/react-router";
import { HeroSearch } from "@/components/home/HeroSearch";
import { FreshListings } from "@/components/home/FreshListings";
import { MemberPromo } from "@/components/home/MemberPromo";
import { PricingSection } from "@/components/home/PricingSection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { MembershipComparison } from "@/components/home/MembershipComparison";
import { AudioArticles } from "@/components/home/AudioArticles";
import { AkiyaInfo } from "@/components/home/AkiyaInfo";
import { FAQSection } from "@/components/home/FAQSection";
import { PropertyTypes } from "@/components/home/PropertyTypes";
import { RegionGrid } from "@/components/home/RegionGrid";
import { PrefectureGrid } from "@/components/home/PrefectureGrid";
import { faqs } from "@/data/faq";

const title = "Yadori Estate — Japanese Houses, Akiya & Land in English";
const description =
  "Search 1,536,000+ Japanese properties from 2,690 sources — houses, akiya, land and apartments, every listing in English. Free to browse, updated daily.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
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
      <MemberPromo />
      <PricingSection />
      <PartnersSection />
      <MembershipComparison />
      <AudioArticles />
      <AkiyaInfo />
      <FAQSection />
      <PropertyTypes />
      <RegionGrid />
      <PrefectureGrid />
    </>
  );
}
