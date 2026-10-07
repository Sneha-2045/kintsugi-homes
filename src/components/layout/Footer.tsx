import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { BrandMark } from "@/components/common/BrandMark";

const propertyLinks = [
  { label: "Buy a House in Japan", to: "/category/house" },
  { label: "Japan House Prices", to: "/search" },
  { label: "Cheap Houses", to: "/category/house" },
  { label: "Apartments for Sale", to: "/category/apartment" },
  { label: "Land for Sale", to: "/category/land" },
  { label: "Akiya Bank Listings", to: "/category/akiya-bank" },
  { label: "Properties for Rent", to: "/search" },
  { label: "Map View", to: "/map" },
  { label: "Browse All for Sale", to: "/search" },
];

const regionLinks = [
  "hokkaido",
  "tohoku",
  "kanto",
  "chubu",
  "kansai",
  "chugoku",
  "shikoku",
  "kyushu",
  "okinawa",
];

const companyLinks = [
  { label: "What is an Akiya?", to: "/articles" },
  { label: "Getting Started Guide", to: "/articles" },
  { label: "About Us", to: "/consult" },
  { label: "Articles", to: "/articles" },
  { label: "FAQ", to: "/" },
  { label: "Contact", to: "/consult" },
  { label: "Press & Creators", to: "/consult" },
  { label: "Consult an Expert", to: "/consult" },
  { label: "Property Management", to: "/consult" },
];

const popularSearches = [
  "Akiya in Tokyo",
  "Akiya in Osaka",
  "Akiya in Hokkaido",
  "Akiya in Kyoto",
  "Akiya in Okinawa",
  "Akiya in Nagano",
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
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5 lg:gap-8 lg:py-20">
        <div className="lg:pr-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10" />
            <div>
              <span className="font-display text-xl font-bold text-foreground">Real Estate</span>
              <p className="mt-1 text-[10px] tracking-[0.12em] text-subtle">Homes in Japan &amp; the US</p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Real Estate is an independent, Japan-focused property search platform. We are not the
            seller or a real-estate broker; purchases are handled by the original listing source
            or a licensed local professional.
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
          <ColumnTitle>Regions</ColumnTitle>
          <ul className="space-y-2.5">
            {regionLinks.map((slug) => (
              <li key={slug}>
                <Link to="/region/$slug" params={{ slug }} className={`${linkClass} capitalize`}>
                  {slug}
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
              {popularSearches.map((q) => (
                <li key={q}>
                  <Link to="/search" search={{ q }} className={linkClass}>
                    {q}
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
        <div className="container-page grid gap-3 py-6 text-xs text-subtle lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
          <p>
            © {new Date().getFullYear()} Real Estate. Demo inventory is illustrative, not live offers.
            Listing sources and last-checked dates are shown when recorded; missing details are
            unverified. Confirm availability and terms with the original publisher.
          </p>
          <p>Prices are indicative, may change, and exclude acquisition costs.</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            <span>Menmint LLC</span>
            <a href="/sitemap" className={linkClass}>
              Sitemap
            </a>
            <a href="mailto:support@rylestate.com" className={linkClass}>
              support@rylestate.com
            </a>
            <a href="tel:+18886933908" className={linkClass}>
              +1 888 693 3908
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
