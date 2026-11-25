import { ArrowUpRight, BedDouble, Bath, House, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/common/Badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/common/Button";
import type { ApifyRentalListing } from "@/lib/apify-rentals.server";

type RentalResponse = {
  listings: ApifyRentalListing[];
  offset: number;
  hasMore: boolean;
  stateCounts: Record<string, number | null>;
  statesResponded: string[];
  error?: { message?: string };
};

const PAGE_SIZE = 20;

function cardTitle(listing: ApifyRentalListing) {
  return (
    listing.buildingName ||
    listing.addressLine1 ||
    listing.address ||
    `${listing.propertyType || "Rental home"} in ${listing.city}`
  );
}

function monthlyPrice(listing: ApifyRentalListing) {
  const label = listing.priceLabel?.trim().replace(/\s*\/\s*(?:mo|month)$/i, "");
  if (label) return label;
  const amount = listing.monthlyRent ?? listing.minRent ?? listing.price;
  return amount == null ? "Price unavailable" : `$${amount.toLocaleString()}`;
}

function ListingPhoto({ listing }: { listing: ApifyRentalListing }) {
  const [failed, setFailed] = useState(false);
  if (!listing.imgSrc || failed) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground"
        aria-label="Property photo unavailable from Apify listing"
      >
        <House className="h-10 w-10" aria-hidden="true" />
        <span className="text-xs">Photo unavailable</span>
      </div>
    );
  }
  return (
    <img
      src={listing.imgSrc}
      alt={cardTitle(listing)}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform group-hover:scale-105"
    />
  );
}

export function RentalListings() {
  const [rentals, setRentals] = useState<ApifyRentalListing[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [stateCounts, setStateCounts] = useState<Record<string, number | null>>({});
  const [statesResponded, setStatesResponded] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPage = useCallback(async (nextOffset: number) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/rentals?offset=${nextOffset}`);
      const body = (await response.json()) as RentalResponse;
      if (!response.ok)
        throw new Error(body.error?.message || "Rental listings could not be loaded.");
      const incoming = Array.isArray(body.listings) ? body.listings : [];
      setRentals((current) => {
        const ids = new Set(current.map((item) => item.zpid));
        return [...current, ...incoming.filter((item) => !ids.has(item.zpid))];
      });
      setOffset(nextOffset);
      setHasMore(Boolean(body.hasMore));
      setStateCounts(body.stateCounts || {});
      setStatesResponded(body.statesResponded || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Rental listings could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(0);
  }, [loadPage]);

  const visibleRentals = useMemo(() => rentals.slice(0, visibleCount), [rentals, visibleCount]);
  const availableStateCount = Object.values(stateCounts).filter(
    (count) => count != null && count > 0,
  ).length;

  const loadMore = () => {
    if (visibleCount < rentals.length) {
      setVisibleCount((count) => count + 10);
      return;
    }
    if (hasMore && !loading) {
      void loadPage(offset + PAGE_SIZE);
      setVisibleCount((count) => count + 10);
    }
  };

  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="rental-listings-title">
      <div className="container-page">
        <SectionHeader
          eyebrow={
            <Badge variant="green" size="md">
              FOR RENT · UNITED STATES
            </Badge>
          }
          title="Rentals Across the U.S."
          subtitle="Current Zillow rental listings collected through Apify from all 50 states. Availability and prices can change."
          className="mb-10"
        />
        <h2 id="rental-listings-title" className="sr-only">
          Nationwide rental listings
        </h2>
        {error ? (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"
          >
            {error}
          </p>
        ) : null}
        {!rentals.length && loading ? (
          <p className="mb-6 text-sm text-muted-foreground">
            Loading active rentals across the United States…
          </p>
        ) : null}
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleRentals.map((rental) => {
            const location = [rental.city, rental.state].join(", ");
            const href =
              rental.detailUrl ||
              `https://www.zillow.com/homes/${encodeURIComponent(`${rental.addressLine1 || rental.address || ""}, ${location}`)}_rb/`;
            return (
              <li key={rental.zpid}>
                <article className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  <a href={href} target="_blank" rel="noreferrer" className="group block">
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-elevated">
                      <ListingPhoto listing={rental} />
                      <span className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-foreground">
                        {rental.statusText || "For Rent"}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary-light">
                          {cardTitle(rental)}
                        </h3>
                        <ArrowUpRight
                          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {location || "United States"}
                        {rental.zipCode ? ` ${rental.zipCode}` : ""}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <p className="text-xl font-bold text-foreground">
                          {monthlyPrice(rental)}
                          <span className="text-sm font-medium text-muted-foreground">
                            {monthlyPrice(rental) !== "Price unavailable" ? "/mo" : ""}
                          </span>
                        </p>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <BedDouble className="h-4 w-4" aria-hidden="true" />
                          {rental.beds ?? "—"} beds
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Bath className="h-4 w-4" aria-hidden="true" />
                          {rental.bathrooms ?? "—"} baths
                        </span>
                        <span>{rental.propertyType || "Property type unavailable"}</span>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {rental.statusText || "For Rent"} · View on Zillow
                      </p>
                    </div>
                  </a>
                </article>
              </li>
            );
          })}
        </ul>
        {!loading && !error && rentals.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No active rental listings are available right now.
          </p>
        ) : null}
        {rentals.length > 0 && (visibleCount < rentals.length || hasMore) ? (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" size="lg" onClick={loadMore} disabled={loading}>
              {loading ? "Loading rentals…" : "Load more rentals"}
            </Button>
          </div>
        ) : null}
        <p className="mt-4 text-sm text-muted-foreground">
          {statesResponded.length
            ? `${rentals.length.toLocaleString()} active rentals · ${availableStateCount} states with listings · Zillow via Apify`
            : "Rental listings are collected from Zillow through Apify."}
        </p>
      </div>
    </section>
  );
}
