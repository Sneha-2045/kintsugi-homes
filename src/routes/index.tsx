import { createFileRoute } from "@tanstack/react-router";
import { HeroSearch } from "@/components/home/HeroSearch";
import { FreshListings } from "@/components/home/FreshListings";
import { MemberPromo } from "@/components/home/MemberPromo";
import { PricingSection } from "@/components/home/PricingSection";
import { PaymentPlan } from "@/components/home/PaymentPlan";
import { PartnersSection } from "@/components/home/PartnersSection";
import { MembershipComparison } from "@/components/home/MembershipComparison";
import { AudioArticles } from "@/components/home/AudioArticles";
import { AkiyaInfo } from "@/components/home/AkiyaInfo";
import { FAQSection } from "@/components/home/FAQSection";
import { PropertyTypes } from "@/components/home/PropertyTypes";
import { RegionGrid } from "@/components/home/RegionGrid";
import { PrefectureGrid } from "@/components/home/PrefectureGrid";
import { faqs } from "@/data/faq";

const title = "Rylestate — Japanese Houses, Akiya & Land in English";
const description =
  "Search Japanese houses, akiya, land and apartments in English. Review original asking prices and listing sources where provided, and confirm availability with the publisher.";

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
      <PropertyTypes />
      <FreshListings />
      <MemberPromo />
      <PricingSection />
      <PaymentPlan />

      <PartnersSection />
      <MembershipComparison />
      <AudioArticles />
      <AkiyaInfo />
      <FAQSection />
      <RegionGrid />
      <PrefectureGrid />
    </>
  );
}
