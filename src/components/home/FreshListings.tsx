import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/common/Badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PropertyCarousel } from "@/components/property/PropertyCarousel";

import { properties } from "@/data/properties";
import { usListings } from "@/data/us-listings";

export function FreshListings() {
  const [market, setMarket] = useState<"japan" | "us">("japan");
  const isJapan = market === "japan";

  return (
    <section
      className="bg-background py-16 md:py-24"
      aria-labelledby="fresh-title"
    >
      <div className="container-page">
        <SectionHeader
          eyebrow={
            <Badge variant="blue" size="md">
              US &amp; Japan inventory
            </Badge>
          }
          title={
            <span className="inline-flex items-center gap-3">
              <span aria-hidden="true" className="inline-flex items-center gap-2 text-[0.72em]">
                <span>🇺🇸</span>
                <span>🇯🇵</span>
              </span>
              <span>Browse US &amp; Japan listings</span>
            </span>
          }
          subtitle={
            isJapan
              ? "A small selection to start your search. Sources and checked dates may be unavailable; confirm current price and availability with the publisher."
              : "Browse US foreclosure properties with upcoming auction dates. Confirm current details with the listing source."
          }
          action={
            <Link
              to={isJapan ? "/search" : "/us-properties"}
              search={isJapan ? { q: "Japan" } : undefined}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:text-primary"
            >
              Browse all listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
          className="mb-10"
        />

        <h2 id="fresh-title" className="sr-only">
          Property listings by country
        </h2>

        <div>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-foreground">
                {isJapan ? "Japan Listings" : "US Listings"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isJapan
                  ? "Japanese homes, akiya, land and apartments"
                  : "US foreclosure properties with upcoming auction dates"}
              </p>
            </div>

            <div
              role="group"
              aria-label="Switch displayed properties"
              className="inline-flex rounded-xl border border-border bg-surface p-1"
            >
              <button
                type="button"
                aria-pressed={!isJapan}
                onClick={() => setMarket("us")}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:px-4 ${
                  !isJapan
                    ? "bg-primary font-extrabold text-primary-foreground shadow-sm ring-1 ring-inset ring-primary-light/50"
                    : "text-muted-foreground hover:bg-elevated hover:text-foreground"
                }`}
              >
                <span aria-hidden="true">🇺🇸</span> United States
              </button>
              <button
                type="button"
                aria-pressed={isJapan}
                onClick={() => setMarket("japan")}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:px-4 ${
                  isJapan
                    ? "bg-primary font-extrabold text-primary-foreground shadow-sm ring-1 ring-inset ring-primary-light/50"
                    : "text-muted-foreground hover:bg-elevated hover:text-foreground"
                }`}
              >
                <span aria-hidden="true">🇯🇵</span> Japan
              </button>
            </div>
          </div>

          {isJapan ? (
            <PropertyCarousel properties={properties.slice(0, 6)} label="Japan listings" />
          ) : usListings.length > 0 ? (
            <PropertyCarousel properties={usListings.slice(0, 6)} label="US listings" />
          ) : (
            <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              No US listings are available right now.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
