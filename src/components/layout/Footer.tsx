import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { BrandMark } from "@/components/common/BrandMark";

const propertyLinks = [
  { label: "US Foreclosure Properties", to: "/us-properties" },
  { label: "Upcoming Auctions", to: "/us-properties" },
  { label: "Florida Listings", to: "/us-properties" },
  { label: "Georgia Listings", to: "/us-properties" },
  { label: "North Carolina Listings", to: "/us-properties" },
  { label: "Browse All US Properties", to: "/us-properties" },
];

const regionLinks = [
  { label: "Florida", query: "Florida" },
  { label: "Georgia", query: "Georgia" },
  { label: "North Carolina", query: "North Carolina" },
];

const companyLinks = [
  { label: "US Property Listings", to: "/us-properties" },
  { label: "Auction Listing FAQs", to: "/" },
  { label: "About Us", to: "/consult" },
  { label: "FAQ", to: "/" },
  { label: "Contact", to: "/consult" },
  { label: "Consult an Expert", to: "/consult" },
];

const popularSearches = [
  { label: "Miami, Florida", query: "Miami" },
  { label: "Tampa, Florida", query: "Tampa" },
  { label: "Orlando, Florida", query: "Orlando" },
  { label: "Atlanta, Georgia", query: "Atlanta" },
  { label: "Florida Foreclosures", query: "Florida" },
  { label: "Georgia Foreclosures", query: "Georgia" },
];

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-primary-light";

function ColumnTitle({ children }: { children: string }) {
  return (
    <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-subtle">
      {children}
    </h3>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 xl:grid-cols-5 xl:gap-8 xl:py-20">
        <div className="lg:pr-6">
          <BrandMark className="h-auto w-40" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Rylestate helps you find US foreclosure listings and auction opportunities. Confirm
            current details and sale terms with the original listing source.
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Real Estate on Instagram"
            className="mt-5 inline-grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary-light"
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>

        <div>
          <ColumnTitle>Properties</ColumnTitle>
          <ul className="space-y-2.5">
            {propertyLinks.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColumnTitle>US Markets</ColumnTitle>
          <ul className="space-y-2.5">
            {regionLinks.map((region) => (
              <li key={region.label}>
                <Link to="/us-properties" search={{ q: region.query }} className={linkClass}>
                  {region.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColumnTitle>Company</ColumnTitle>
          <ul className="space-y-2.5">
            {companyLinks.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="/sitemap" className={linkClass}>
                Sitemap
              </a>
            </li>
          </ul>
        </div>

        <div>
          <ColumnTitle>Account</ColumnTitle>
          <ul className="space-y-2.5">
            <li>
              <Link to="/login" className={linkClass}>
                Sign In
              </Link>
            </li>
            <li>
              <Link to="/pricing" className={linkClass}>
                Start Free Trial
              </Link>
            </li>
          </ul>
          <div className="mt-8">
            <ColumnTitle>Popular Searches</ColumnTitle>
            <ul className="space-y-2.5">
              {popularSearches.map((search) => (
                <li key={search.label}>
                  <Link to="/us-properties" search={{ q: search.query }} className={linkClass}>
                    {search.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <ColumnTitle>Company Details</ColumnTitle>
            <p className="text-sm text-muted-foreground">Menmint LLC</p>
          </div>
          <div>
            <ColumnTitle>Contact Details</ColumnTitle>
            <div className="flex flex-col items-start gap-2 text-sm sm:flex-row sm:gap-5">
              <a href="mailto:support@rylestate.com" className={linkClass}>
                support@rylestate.com
              </a>
              <a href="tel:+18886933908" className={linkClass}>
                +1 888 693 3908
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>Prices are indicative, may change, and exclude acquisition costs.</p>
          <a href="/sitemap" className={linkClass}>
            Sitemap
          </a>
        </div>
      </div>
    </footer>
  );
}
