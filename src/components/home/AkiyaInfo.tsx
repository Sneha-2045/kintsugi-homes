import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { usListings } from "@/data/us-listings";

const pricedListings = usListings.filter((listing) => listing.priceUsd > 0);
const minPrice = Math.min(...pricedListings.map((listing) => listing.priceUsd));
const maxPrice = Math.max(...pricedListings.map((listing) => listing.priceUsd));
const auctionCount = usListings.filter((listing) => listing.auctionDate).length;
const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(price);

const stats = [
  {
    value: `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`,
    label: "Asking prices shown",
    color: "text-primary-light",
    body: "Price data is shown when provided by the listing source. Confirm the current opening bid, fees and sale terms with the publisher.",
  },
  {
    value: auctionCount.toLocaleString("en-US"),
    label: "Listings with auction dates",
    color: "text-success",
    body: "Auction schedules can change. Check the original listing for the latest date, registration steps and property-specific terms.",
  },
  {
    value: "Source links",
    label: "Review before you bid",
    color: "text-primary-light",
    body: "Listings link to their source when available. Research title, liens, occupancy, condition and local requirements before making a decision.",
  },
];

const steps = [
  {
    title: "1 · Search US listings",
    body: "Browse foreclosure properties by location, price and the details available in each listing.",
  },
  {
    title: "2 · Review the source",
    body: "Check the publisher for current auction dates, bidding rules, property condition and sale terms.",
  },
  {
    title: "3 · Do your due diligence",
    body: "Contact the listing provider and qualified local professionals before you bid or make an offer.",
  },
];

const quickLinks = [
  { label: "Florida Foreclosures", query: "Florida" },
  { label: "Georgia Foreclosures", query: "Georgia" },
  { label: "Miami Properties", query: "Miami" },
  { label: "Tampa Properties", query: "Tampa" },
  { label: "Orlando Properties", query: "Orlando" },
  { label: "Atlanta Properties", query: "Atlanta" },
];

export function AkiyaInfo() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="us-market-title">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="us-market-title" className="text-3xl font-bold text-foreground md:text-[44px]">
            Explore US Foreclosure Properties
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Find homes listed for foreclosure sale across US markets. Listings may include auction
            dates, asking prices and property details;{" "}
            <strong className="font-semibold text-foreground">
              always confirm current information and sale requirements with the original source
            </strong>
            .
          </p>
        </div>

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {stats.map((stat) => (
            <li
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-7 text-center transition-colors hover:border-primary/40"
            >
              <p className={`text-2xl font-bold md:text-3xl ${stat.color}`}>{stat.value}</p>
              <h3 className="mt-2 text-base font-semibold text-foreground">{stat.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stat.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-2xl border border-border bg-card p-7 md:p-10">
          <h3 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            How it works
          </h3>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.title} className="text-center">
                <h4 className="text-lg font-semibold text-foreground">{step.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {quickLinks.map((link) => (
            <li key={link.label}>
              <Link
                to="/us-properties"
                search={{ q: link.query }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-light hover:text-primary"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
