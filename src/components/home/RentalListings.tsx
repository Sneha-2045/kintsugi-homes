import {
  BedDouble,
  Bath,
  House,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  CalendarDays,
  Check,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  totalCount: number;
  error?: { message?: string };
};

const PAGE_SIZE = 20;
const states = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
] as const;

type RentalFilters = {
  q: string;
  type: string;
  minRent: string;
  maxRent: string;
  state: string;
  city: string;
  zipCode: string;
  neighborhood: string;
  beds: string;
  studio: boolean;
  bathrooms: string;
  sort: string;
  availability: string;
  furnished: string;
  leaseDuration: string;
  amenities: string[];
};

const emptyFilters: RentalFilters = {
  q: "",
  type: "",
  minRent: "",
  maxRent: "",
  state: "",
  city: "",
  zipCode: "",
  neighborhood: "",
  beds: "",
  studio: false,
  bathrooms: "",
  sort: "",
  availability: "",
  furnished: "",
  leaseDuration: "",
  amenities: [],
};

function filtersFromUrl(): RentalFilters {
  if (typeof window === "undefined") return emptyFilters;
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get("rentQ") ?? "",
    type: params.get("rentType") ?? "",
    minRent: params.get("rentMin") ?? "",
    maxRent: params.get("rentMax") ?? "",
    state: params.get("rentState") ?? "",
    city: params.get("rentCity") ?? "",
    zipCode: params.get("rentZip") ?? "",
    neighborhood: params.get("rentNeighborhood") ?? "",
    beds: params.get("rentBeds") ?? "",
    studio: params.get("rentStudio") === "true",
    bathrooms: params.get("rentBaths") ?? "",
    sort: params.get("rentSort") ?? "",
    availability: params.get("rentAvailability") ?? "",
    furnished: params.get("rentFurnished") ?? "",
    leaseDuration: params.get("rentLease") ?? "",
    amenities: params.getAll("rentAmenity"),
  };
}

function apiFilterParams(filters: RentalFilters, offset: number) {
  const params = new URLSearchParams({ offset: String(offset) });
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.type) params.set("type", filters.type);
  if (filters.minRent) params.set("minRent", filters.minRent);
  if (filters.maxRent) params.set("maxRent", filters.maxRent);
  if (filters.state) params.set("state", filters.state);
  if (filters.city.trim()) params.set("city", filters.city.trim());
  if (filters.zipCode.trim()) params.set("zipCode", filters.zipCode.trim());
  if (filters.neighborhood.trim()) params.set("neighborhood", filters.neighborhood.trim());
  if (filters.beds) params.set("beds", filters.beds);
  if (filters.studio) params.set("studio", "true");
  if (filters.bathrooms) params.set("bathrooms", filters.bathrooms);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.availability) params.set("availability", filters.availability);
  if (filters.furnished) params.set("furnished", filters.furnished);
  if (filters.leaseDuration) params.set("leaseDuration", filters.leaseDuration);
  filters.amenities.forEach((amenity) => params.append("amenity", amenity));
  return params;
}

function syncFiltersToUrl(filters: RentalFilters) {
  const url = new URL(window.location.href);
  const keys: Record<keyof RentalFilters, string> = {
    q: "rentQ",
    type: "rentType",
    minRent: "rentMin",
    maxRent: "rentMax",
    state: "rentState",
    city: "rentCity",
    zipCode: "rentZip",
    neighborhood: "rentNeighborhood",
    beds: "rentBeds",
    studio: "rentStudio",
    bathrooms: "rentBaths",
    sort: "rentSort",
    availability: "rentAvailability",
    furnished: "rentFurnished",
    leaseDuration: "rentLease",
    amenities: "rentAmenity",
  };
  for (const [field, key] of Object.entries(keys) as [keyof RentalFilters, string][]) {
    const value = filters[field];
    url.searchParams.delete(key);
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, item));
    else if (value) url.searchParams.set(key, String(value));
  }
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

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
  const [matchingCount, setMatchingCount] = useState(0);
  const [stateCounts, setStateCounts] = useState<Record<string, number | null>>({});
  const [statesResponded, setStatesResponded] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [draftFilters, setDraftFilters] = useState<RentalFilters>(filtersFromUrl);
  const [appliedFilters, setAppliedFilters] = useState<RentalFilters>(filtersFromUrl);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const requestSequence = useRef(0);

  const loadPage = useCallback(
    async (nextOffset: number, filters: RentalFilters, append: boolean) => {
      const requestId = ++requestSequence.current;
      setLoading(true);
      setError("");
      try {
        const params = apiFilterParams(filters, nextOffset);
        const response = await fetch(`/api/rentals?${params.toString()}`);
        const body = (await response.json()) as RentalResponse;
        if (requestId !== requestSequence.current) return;
        if (!response.ok)
          throw new Error(body.error?.message || "Rental listings could not be loaded.");
        const incoming = Array.isArray(body.listings) ? body.listings : [];
        if (append)
          setRentals((current) => {
            const ids = new Set(current.map((item) => item.zpid));
            return [...current, ...incoming.filter((item) => !ids.has(item.zpid))];
          });
        else setRentals(incoming);
        setOffset(nextOffset);
        setHasMore(Boolean(body.hasMore));
        setMatchingCount(body.totalCount ?? 0);
        setStateCounts(body.stateCounts || {});
        setStatesResponded(body.statesResponded || []);
      } catch (loadError) {
        if (requestId !== requestSequence.current) return;
        setError(
          loadError instanceof Error ? loadError.message : "Rental listings could not be loaded.",
        );
      } finally {
        if (requestId === requestSequence.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const urlFilters = filtersFromUrl();
    setDraftFilters(urlFilters);
    setAppliedFilters(urlFilters);
    void loadPage(0, urlFilters, false);
  }, [loadPage]);

  const availableStateCount = Object.values(stateCounts).filter(
    (count) => count != null && count > 0,
  ).length;

  const applyFilters = (filters: RentalFilters) => {
    setDraftFilters(filters);
    setAppliedFilters(filters);
    syncFiltersToUrl(filters);
    setRentals([]);
    setVisibleCount(10);
    setOffset(0);
    setHasMore(true);
    void loadPage(0, filters, false);
  };

  const updateDraft = <K extends keyof RentalFilters>(key: K, value: RentalFilters[K]) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const removeFilter = (key: keyof RentalFilters) => {
    applyFilters({ ...appliedFilters, [key]: emptyFilters[key] } as RentalFilters);
  };

  const clearFilters = () => applyFilters(emptyFilters);

  const loadMore = () => {
    if (visibleCount < rentals.length) {
      setVisibleCount((count) => count + 10);
      return;
    }
    if (hasMore && !loading) {
      setVisibleCount((count) => count + 10);
      void loadPage(offset + PAGE_SIZE, appliedFilters, true);
    }
  };

  const selectedChips: Array<{ key: keyof RentalFilters; label: string }> = [
    ...(appliedFilters.q ? [{ key: "q" as const, label: `Location: ${appliedFilters.q}` }] : []),
    ...(appliedFilters.type ? [{ key: "type" as const, label: appliedFilters.type }] : []),
    ...(appliedFilters.minRent
      ? [
          {
            key: "minRent" as const,
            label: `Min $${Number(appliedFilters.minRent).toLocaleString()}`,
          },
        ]
      : []),
    ...(appliedFilters.maxRent
      ? [
          {
            key: "maxRent" as const,
            label: `Max $${Number(appliedFilters.maxRent).toLocaleString()}`,
          },
        ]
      : []),
    ...(appliedFilters.state
      ? [
          {
            key: "state" as const,
            label:
              states.find(([code]) => code === appliedFilters.state)?.[1] ?? appliedFilters.state,
          },
        ]
      : []),
    ...(appliedFilters.city
      ? [{ key: "city" as const, label: `City: ${appliedFilters.city}` }]
      : []),
    ...(appliedFilters.zipCode
      ? [{ key: "zipCode" as const, label: `ZIP: ${appliedFilters.zipCode}` }]
      : []),
    ...(appliedFilters.neighborhood
      ? [{ key: "neighborhood" as const, label: `Area: ${appliedFilters.neighborhood}` }]
      : []),
    ...(appliedFilters.studio ? [{ key: "studio" as const, label: "Studio" }] : []),
    ...(appliedFilters.beds
      ? [{ key: "beds" as const, label: `${appliedFilters.beds}+ beds` }]
      : []),
    ...(appliedFilters.bathrooms
      ? [{ key: "bathrooms" as const, label: `${appliedFilters.bathrooms}+ baths` }]
      : []),
    ...(appliedFilters.availability
      ? [
          {
            key: "availability" as const,
            label: appliedFilters.availability === "now" ? "Available now" : "Available soon",
          },
        ]
      : []),
    ...(appliedFilters.furnished
      ? [
          {
            key: "furnished" as const,
            label: appliedFilters.furnished === "true" ? "Furnished" : "Unfurnished",
          },
        ]
      : []),
    ...(appliedFilters.leaseDuration
      ? [{ key: "leaseDuration" as const, label: `${appliedFilters.leaseDuration}-term lease` }]
      : []),
    ...(appliedFilters.amenities.length
      ? [{ key: "amenities" as const, label: `Amenities: ${appliedFilters.amenities.join(", ")}` }]
      : []),
  ];

  return (
    <section
      id="rental-listings"
      className="bg-surface py-16 md:py-24"
      aria-labelledby="rental-listings-title"
    >
      <div className="container-page">
        <SectionHeader
          eyebrow={
            <Badge variant="green" size="md">
              FOR RENT · UNITED STATES
            </Badge>
          }
          title="Explore Rental Homes Across America."
          subtitle="Search real rental listings from across the United States and narrow your results by location, budget and home details."
          className="mb-10"
        />
        <h2 id="rental-listings-title" className="sr-only">
          Explore rental homes across America
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters(draftFilters);
          }}
          className="mb-6 rounded-3xl border border-border bg-card p-4 shadow-lg sm:p-5"
          role="search"
          aria-label="Search U.S. rentals"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(230px,1.5fr)_minmax(160px,1fr)_minmax(145px,.8fr)_minmax(145px,.8fr)_minmax(160px,1fr)_auto] lg:items-end">
            <label className="block text-xs font-semibold text-muted-foreground">
              Location
              <input
                value={draftFilters.q}
                onChange={(event) => updateDraft("q", event.target.value)}
                placeholder="City, state, ZIP or neighborhood"
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">
              Property type
              <select
                value={draftFilters.type}
                onChange={(event) => updateDraft("type", event.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">Any type</option>
                {[
                  "Apartment",
                  "House",
                  "Condo",
                  "Townhouse",
                  "Studio",
                  "Duplex",
                  "Single-family home",
                  "Shared accommodation",
                ].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">
              Min rent
              <input
                type="number"
                min="0"
                value={draftFilters.minRent}
                onChange={(event) => updateDraft("minRent", event.target.value)}
                placeholder="$ Min"
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">
              Max rent
              <input
                type="number"
                min="0"
                value={draftFilters.maxRent}
                onChange={(event) => updateDraft("maxRent", event.target.value)}
                placeholder="$ Max"
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">
              Move-in date <span className="font-normal">(feed unavailable)</span>
              <span className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <input
                  type="date"
                  disabled
                  aria-label="Move-in date unavailable from current listings feed"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </span>
            </label>
            <Button type="submit" size="md" className="h-11">
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={filtersOpen ? "subtle" : "outline"}
                size="sm"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal className="h-4 w-4" /> Advanced filters{" "}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                />
              </Button>
              <label className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground">
                Sort
                <select
                  value={draftFilters.sort}
                  onChange={(event) => updateDraft("sort", event.target.value)}
                  className="max-w-48 bg-transparent text-xs text-foreground outline-none"
                >
                  <option value="">Recently Updated</option>
                  <option value="price-asc">Lowest Rent First</option>
                  <option value="price-desc">Highest Rent First</option>
                  <option value="beds-desc">Most Bedrooms</option>
                  <option value="newest">Newest Listings</option>
                  <option value="oldest">Oldest Listings</option>
                  <option value="updated">Recently Updated</option>
                </select>
              </label>
            </div>
            <p className="text-sm font-semibold text-foreground" aria-live="polite">
              {loading
                ? "Updating matches…"
                : `${matchingCount.toLocaleString()} matching properties`}
            </p>
          </div>
          {filtersOpen && (
            <div className="mt-5 space-y-4 border-t border-border pt-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <details open className="rounded-2xl border border-border bg-background/50 p-4">
                  <summary className="cursor-pointer list-none font-bold text-foreground">
                    Price <ChevronDown className="ml-2 inline h-4 w-4" />
                  </summary>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      { label: "Under $1,000", min: "", max: "999" },
                      { label: "$1,000–$2,000", min: "1000", max: "2000" },
                      { label: "$2,000–$3,000", min: "2000", max: "3000" },
                      { label: "$3,000+", min: "3000", max: "" },
                    ].map((range) => (
                      <button
                        key={range.label}
                        type="button"
                        onClick={() => {
                          updateDraft("minRent", range.min);
                          updateDraft("maxRent", range.max);
                        }}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition hover:border-primary ${draftFilters.minRent === range.min && draftFilters.maxRent === range.max ? "border-primary bg-primary/10 text-primary-light" : "border-border text-foreground"}`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Minimum · ${Number(draftFilters.minRent || 0).toLocaleString()}
                      <input
                        type="range"
                        min="0"
                        max={Math.max(1000, Number(draftFilters.maxRent) || 10000)}
                        step="100"
                        value={Math.min(
                          Number(draftFilters.minRent) || 0,
                          Number(draftFilters.maxRent) || 10000,
                        )}
                        onChange={(event) =>
                          updateDraft(
                            "minRent",
                            event.target.value === "0" ? "" : event.target.value,
                          )
                        }
                        className="mt-3 block w-full accent-primary"
                        aria-label="Minimum monthly rent slider"
                      />
                    </label>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Maximum ·{" "}
                      {draftFilters.maxRent
                        ? `$${Number(draftFilters.maxRent).toLocaleString()}`
                        : "Any"}
                      <input
                        type="range"
                        min={Number(draftFilters.minRent) || 0}
                        max="10000"
                        step="100"
                        value={Number(draftFilters.maxRent) || 10000}
                        onChange={(event) =>
                          updateDraft(
                            "maxRent",
                            event.target.value === "10000" ? "" : event.target.value,
                          )
                        }
                        className="mt-3 block w-full accent-primary"
                        aria-label="Maximum monthly rent slider"
                      />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Minimum monthly rent
                      <input
                        type="number"
                        min="0"
                        value={draftFilters.minRent}
                        onChange={(event) => updateDraft("minRent", event.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Maximum monthly rent
                      <input
                        type="number"
                        min="0"
                        value={draftFilters.maxRent}
                        onChange={(event) => updateDraft("maxRent", event.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                  </div>
                </details>
                <details open className="rounded-2xl border border-border bg-background/50 p-4">
                  <summary className="cursor-pointer list-none font-bold text-foreground">
                    Location <ChevronDown className="ml-2 inline h-4 w-4" />
                  </summary>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      State
                      <select
                        value={draftFilters.state}
                        onChange={(event) => updateDraft("state", event.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground"
                      >
                        <option value="">All 50 states</option>
                        {states.map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-muted-foreground">
                      City
                      <input
                        value={draftFilters.city}
                        onChange={(event) => updateDraft("city", event.target.value)}
                        placeholder="Any city"
                        className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="text-xs font-semibold text-muted-foreground">
                      ZIP code
                      <input
                        value={draftFilters.zipCode}
                        onChange={(event) => updateDraft("zipCode", event.target.value)}
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Any ZIP"
                        className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Neighborhood / address
                      <input
                        value={draftFilters.neighborhood}
                        onChange={(event) => updateDraft("neighborhood", event.target.value)}
                        placeholder="Search address or building"
                        className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                  </div>
                </details>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <details open className="rounded-2xl border border-border bg-background/50 p-4">
                  <summary className="cursor-pointer list-none font-bold text-foreground">
                    Property type <ChevronDown className="ml-2 inline h-4 w-4" />
                  </summary>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      "Apartment",
                      "House",
                      "Condo",
                      "Townhouse",
                      "Studio",
                      "Duplex",
                      "Single-family home",
                      "Shared accommodation",
                    ].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateDraft("type", draftFilters.type === type ? "" : type)}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition hover:border-primary ${draftFilters.type === type ? "border-primary bg-primary/10 text-primary-light" : "border-border text-foreground"}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </details>
                <details open className="rounded-2xl border border-border bg-background/50 p-4">
                  <summary className="cursor-pointer list-none font-bold text-foreground">
                    Bedrooms <ChevronDown className="ml-2 inline h-4 w-4" />
                  </summary>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateDraft("studio", !draftFilters.studio);
                        updateDraft("beds", "");
                      }}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold ${draftFilters.studio ? "border-primary bg-primary/10 text-primary-light" : "border-border text-foreground"}`}
                    >
                      Studio
                    </button>
                    {["1", "2", "3", "4"].map((beds) => (
                      <button
                        key={beds}
                        type="button"
                        onClick={() => {
                          updateDraft("beds", draftFilters.beds === beds ? "" : beds);
                          updateDraft("studio", false);
                        }}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold ${draftFilters.beds === beds ? "border-primary bg-primary/10 text-primary-light" : "border-border text-foreground"}`}
                      >
                        {beds === "4" ? "4+ bedrooms" : `${beds} bedroom${beds === "1" ? "" : "s"}`}
                      </button>
                    ))}
                  </div>
                </details>
                <details open className="rounded-2xl border border-border bg-background/50 p-4">
                  <summary className="cursor-pointer list-none font-bold text-foreground">
                    Bathrooms <ChevronDown className="ml-2 inline h-4 w-4" />
                  </summary>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["1", "2", "3", "4"].map((baths) => (
                      <button
                        key={baths}
                        type="button"
                        onClick={() =>
                          updateDraft("bathrooms", draftFilters.bathrooms === baths ? "" : baths)
                        }
                        className={`rounded-full border px-3 py-2 text-xs font-semibold ${draftFilters.bathrooms === baths ? "border-primary bg-primary/10 text-primary-light" : "border-border text-foreground"}`}
                      >
                        {baths}+ baths
                      </button>
                    ))}
                  </div>
                </details>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <details className="rounded-2xl border border-border bg-background/50 p-4">
                  <summary className="cursor-pointer list-none font-bold text-foreground">
                    Amenities <ChevronDown className="ml-2 inline h-4 w-4" />
                  </summary>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      "Pool",
                      "Gym",
                      "Parking",
                      "Pet Friendly",
                      "Laundry",
                      "Dishwasher",
                      "Balcony",
                    ].map((item) => (
                      <label key={item} className="flex items-center gap-2 text-xs text-foreground">
                        <input
                          type="checkbox"
                          checked={draftFilters.amenities.includes(item)}
                          onChange={(event) =>
                            updateDraft(
                              "amenities",
                              event.target.checked
                                ? [...draftFilters.amenities, item]
                                : draftFilters.amenities.filter((amenity) => amenity !== item),
                            )
                          }
                          className="accent-primary"
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </details>
                <details className="rounded-2xl border border-border bg-background/50 p-4">
                  <summary className="cursor-pointer list-none font-bold text-foreground">
                    Lease & availability <ChevronDown className="ml-2 inline h-4 w-4" />
                  </summary>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      <input
                        type="radio"
                        name="rental-availability"
                        checked={draftFilters.availability === "now"}
                        onChange={() => updateDraft("availability", "now")}
                        className="accent-primary"
                      />
                      Available now
                    </label>
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      <input
                        type="radio"
                        name="rental-availability"
                        checked={draftFilters.availability === "soon"}
                        onChange={() => updateDraft("availability", "soon")}
                        className="accent-primary"
                      />
                      Available soon
                    </label>
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      <input
                        type="radio"
                        name="rental-furnished"
                        checked={draftFilters.furnished === "true"}
                        onChange={() => updateDraft("furnished", "true")}
                        className="accent-primary"
                      />
                      Furnished
                    </label>
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      <input
                        type="radio"
                        name="rental-furnished"
                        checked={draftFilters.furnished === "false"}
                        onChange={() => updateDraft("furnished", "false")}
                        className="accent-primary"
                      />
                      Unfurnished
                    </label>
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      <input
                        type="radio"
                        name="rental-lease"
                        checked={draftFilters.leaseDuration === "short"}
                        onChange={() => updateDraft("leaseDuration", "short")}
                        className="accent-primary"
                      />
                      Short-term
                    </label>
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      <input
                        type="radio"
                        name="rental-lease"
                        checked={draftFilters.leaseDuration === "long"}
                        onChange={() => updateDraft("leaseDuration", "long")}
                        className="accent-primary"
                      />
                      Long-term
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        updateDraft("availability", "");
                        updateDraft("furnished", "");
                        updateDraft("leaseDuration", "");
                      }}
                      className="text-left text-xs text-muted-foreground underline"
                    >
                      Clear lease filters
                    </button>
                  </div>
                </details>
                <details className="rounded-2xl border border-border bg-background/50 p-4">
                  <summary className="cursor-pointer list-none font-bold text-foreground">
                    Additional filters{" "}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      Not in feed
                    </span>
                    <ChevronDown className="ml-2 inline h-4 w-4" />
                  </summary>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      "Verified listings",
                      "Newly added",
                      "Rent specials",
                      "Utilities included",
                      "No broker fee",
                    ].map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <input type="checkbox" disabled className="accent-primary" />
                        {item}
                      </label>
                    ))}
                  </div>
                </details>
              </div>
              <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                <p className="text-xs leading-5 text-muted-foreground">
                  Filters marked unavailable aren’t included in the current listing feed. They won’t
                  change results until the source provides those details.
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                  <Button type="submit">
                    <Check className="h-4 w-4" /> Apply filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
        {selectedChips.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold text-muted-foreground">Active filters</span>
            {selectedChips.map(({ key, label }) => (
              <button
                key={`${key}-${label}`}
                type="button"
                onClick={() => removeFilter(key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-light transition hover:bg-primary/20"
              >
                {label}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}
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
          {rentals.slice(0, visibleCount).map((rental) => {
            const location = [rental.city, rental.state].join(", ");
            return (
              <li key={rental.zpid}>
                <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-elevated">
                    <ListingPhoto listing={rental} />
                    <span className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-foreground">
                      {rental.statusText || "For Rent"}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-foreground">{cardTitle(rental)}</h3>
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
                      {rental.statusText || "For Rent"}
                    </p>
                    <details className="mt-3 border-t border-border pt-3">
                      <summary className="cursor-pointer text-sm font-semibold text-primary-light">
                        View Details
                      </summary>
                      <div className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                        <p>
                          {[
                            rental.addressLine1 || rental.address,
                            rental.city,
                            rental.state,
                            rental.zipCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {rental.availableDate ? <p>Available: {rental.availableDate}</p> : null}
                        {rental.amenities?.length ? (
                          <p>Amenities: {rental.amenities.join(", ")}</p>
                        ) : null}
                      </div>
                    </details>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
        {!loading && !error && rentals.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
            <h3 className="text-lg font-bold text-foreground">
              No rentals match these filters yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try widening your rent range, clearing a location filter, or choosing a different
              property type.
            </p>
            <Button className="mt-5" variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
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
            ? `${matchingCount.toLocaleString()} matching rentals · ${availableStateCount} states with listings · Updated from Apify`
            : "Rental listings are collected through Apify."}
        </p>
      </div>
    </section>
  );
}
