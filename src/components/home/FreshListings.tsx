import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/common/Badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import { PropertyCarousel } from "@/components/property/PropertyCarousel";

import { properties } from "@/data/properties";
import { usListings } from "@/data/us-listings";
import { tranchiProperties } from "@/data/tranchi-properties";

const allUsListings = [...usListings, ...tranchiProperties];
const apifyListings = allUsListings.filter(
  (property) => property.sourceDetails?.["foreclosureType"],
);
const existingUsListings = allUsListings.filter(
  (property) => !property.sourceDetails?.["foreclosureType"],
);

function selectAcrossStates(listings: typeof allUsListings, limit: number) {
  const buckets = new Map<string, typeof allUsListings>();
  for (const listing of listings) {
    const state = listing.state ?? listing.prefecture ?? listing.location;
    const bucket = buckets.get(state) ?? [];
    bucket.push(listing);
    buckets.set(state, bucket);
  }
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => Number(hasListingPhoto(b)) - Number(hasListingPhoto(a)));
  }

  const selected = [];
  while (selected.length < limit) {
    let added = false;
    for (const bucket of buckets.values()) {
      const listing = bucket.shift();
      if (listing) {
        selected.push(listing);
        added = true;
        if (selected.length === limit) break;
      }
    }
    if (!added) break;
  }
  return selected;
}

const featuredUsListings = [
  ...selectAcrossStates(apifyListings, 14),
  ...[...existingUsListings].sort(
    (a, b) => Number(hasListingPhoto(b)) - Number(hasListingPhoto(a)),
  ),
].slice(0, 20);

function hasListingPhoto(property: (typeof allUsListings)[number]) {
  return Array.isArray(property.images) && property.images.some((image) => Boolean(image?.trim()));
}

export function FreshListings() {
  const [market, setMarket] = useState<"japan" | "us">("us");
  const isJapan = market === "japan";

  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="fresh-title">
      <div className="container-page">
        <SectionHeader
          eyebrow={
            <Badge variant="blue" size="md">
              US &amp; Japan inventory
            </Badge>
          }
          title="Homes Worth Discovering."
          subtitle={
            isJapan
              ? "Handpicked homes and distinctive properties from across Japan. Confirm current price and availability with the listing publisher."
              : "Explore U.S. foreclosure homes and opportunities. Check each listing source for current details and sale terms."
          }
          action={
            <Link
              to={isJapan ? "/search" : "/us-properties"}
              search={isJapan ? { q: "Japan" } : {}}
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
                {isJapan ? "Explore Japan" : "Explore U.S. opportunities"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isJapan
                  ? "Japanese homes, akiya, land and apartments"
                  : "Foreclosures, auctions, and bank-owned homes across U.S. markets"}
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
          ) : allUsListings.length > 0 ? (
            <>
              <PropertyCarousel properties={featuredUsListings} label="US listings" />
              <p className="mt-4 text-sm text-muted-foreground">
                Showing 20 featured properties from {allUsListings.length} U.S. listings, including
                Zillow foreclosure, auction, and bank-owned inventory.
              </p>
            </>
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
