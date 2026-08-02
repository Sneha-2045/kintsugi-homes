import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";

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
          <span className="font-display text-xl font-bold text-foreground">
            Yadori<span className="text-primary-light"> Estate</span>
          </span>
          <p className="mt-1 text-[10px] tracking-[0.28em] text-subtle">ヤドリ・日本の空き家</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            A Japan-focused, English-language property search platform. Independent, ad-free and
            built for people buying from abroad.
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Yadori Estate on Instagram"
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
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-subtle md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Yadori Estate. Demo project — all listings are fictional.</p>
          <p>Prices shown are indicative and exclude acquisition costs.</p>
        </div>
      </div>
    </footer>
  );
}
