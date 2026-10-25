import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BedDouble,
  Bath,
  CalendarDays,
  Clock3,
  MapPin,
  Ruler,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { RentCastActions } from "@/components/property/RentCastActions";
import {
  propertyAddress,
  rentCastDetailHref,
  type RentCastSearchListing,
} from "@/lib/rentcast-property";

type SearchFilters = {
  city: string;
  zipCode: string;
  state: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  minSquareFootage: string;
  maxSquareFootage: string;
  listingType: "sale" | "rental";
};
type SearchResponse = {
  listings: Array<{ id: string; [key: string]: unknown }>;
  offset: number;
  hasMore: boolean;
};
const initialFilters: SearchFilters = {
  city: "",
  zipCode: "",
  state: "",
  propertyType: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  bathrooms: "",
  minSquareFootage: "",
  maxSquareFootage: "",
  listingType: "sale",
};
const states =
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(
    " ",
  );
const propertyTypes = ["Single Family", "Condo", "Townhouse", "Apartment", "Multi-Family", "Land"];

export const Route = createFileRoute("/property-intelligence")({
  head: () => ({
    meta: [
      { title: "Property Intelligence | Rylestate" },
      {
        name: "description",
        content:
          "Search real US sale and rental listings and review property value, rent and investment estimates.",
      },
    ],
  }),
  component: PropertyIntelligencePage,
});

function PropertyIntelligencePage() {
  const [filters, setFilters] = useState(initialFilters);
  const [listings, setListings] = useState<RentCastSearchListing[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const set = (key: keyof SearchFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  async function requestResults(offset: number, append: boolean) {
    setBusy(true);
    setError("");
    if (!append) {
      setSearched(true);
      setListings([]);
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    params.set("offset", String(offset));
    try {
      const response = await fetch(`/api/property-intelligence?${params.toString()}`);
      const body: unknown = await response.json();
      if (!response.ok) {
        const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
        const detail =
          record["error"] && typeof record["error"] === "object"
            ? (record["error"] as Record<string, unknown>)
            : {};
        throw new Error(
          typeof detail["message"] === "string"
            ? detail["message"]
            : "Property search failed. Please try again.",
        );
      }
      if (!body || typeof body !== "object" || !Array.isArray((body as SearchResponse).listings)) {
        throw new Error("RentCast returned an unexpected search result. Please try again.");
      }
      const result = body as SearchResponse;
      setListings((current) =>
        append
          ? [
              ...current,
              ...result.listings.map((item) => ({ ...item, listingType: filters.listingType })),
            ]
          : result.listings.map((item) => ({ ...item, listingType: filters.listingType })),
      );
      setHasMore(result.hasMore);
      setNextOffset(result.offset + result.listings.length);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Property search failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function search(event: FormEvent) {
    event.preventDefault();
    void requestResults(0, false);
  }

  return (
    <PageShell
      title="Property Intelligence"
      description="Discover real US properties and analyze their investment potential."
    >
      <section className="relative overflow-hidden rounded-3xl border border-blue-200/10 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.19),_transparent_48%),linear-gradient(135deg,#111d30,#17263d)] px-5 py-9 sm:px-8 sm:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
          RentCast property data
        </p>
        <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
          Discover Properties. Analyze Investments. Make Smarter Decisions.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Search active US sale and long-term rental listings, then review provider estimates and
          comparable properties.
        </p>
        <form
          onSubmit={search}
          className="mt-8 rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <SlidersHorizontal className="h-4 w-4 text-blue-300" /> Search filters
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="City">
              <input
                value={filters.city}
                onChange={(e) => set("city", e.target.value)}
                maxLength={80}
                placeholder="Austin"
                className={inputClass}
              />
            </Field>
            <Field label="ZIP code">
              <input
                value={filters.zipCode}
                onChange={(e) => set("zipCode", e.target.value)}
                inputMode="numeric"
                maxLength={5}
                placeholder="78701"
                className={inputClass}
              />
            </Field>
            <Field label="State">
              <select
                value={filters.state}
                onChange={(e) => set("state", e.target.value)}
                className={inputClass}
              >
                <option value="">Select state</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Listing type">
              <select
                value={filters.listingType}
                onChange={(e) => set("listingType", e.target.value)}
                className={inputClass}
              >
                <option value="sale">For sale</option>
                <option value="rental">For rent</option>
              </select>
            </Field>
            <Field label="Property type">
              <select
                value={filters.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
                className={inputClass}
              >
                <option value="">Any type</option>
                {propertyTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </Field>
            <Field label="Minimum price">
              <input
                type="number"
                min="0"
                max="100000000"
                value={filters.minPrice}
                onChange={(e) => set("minPrice", e.target.value)}
                placeholder="$ Any"
                className={inputClass}
              />
            </Field>
            <Field label="Maximum price">
              <input
                type="number"
                min="0"
                max="100000000"
                value={filters.maxPrice}
                onChange={(e) => set("maxPrice", e.target.value)}
                placeholder="$ Any"
                className={inputClass}
              />
            </Field>
            <Field label="Bedrooms">
              <select
                value={filters.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
                className={inputClass}
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bathrooms">
              <select
                value={filters.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
                className={inputClass}
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Minimum square feet">
              <input
                type="number"
                min="0"
                max="1000000"
                value={filters.minSquareFootage}
                onChange={(e) => set("minSquareFootage", e.target.value)}
                placeholder="Any"
                className={inputClass}
              />
            </Field>
            <Field label="Maximum square feet">
              <input
                type="number"
                min="0"
                max="1000000"
                value={filters.maxSquareFootage}
                onChange={(e) => set("maxSquareFootage", e.target.value)}
                placeholder="Any"
                className={inputClass}
              />
            </Field>
            <div className="flex items-end">
              <button
                disabled={busy}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 font-bold text-white transition hover:bg-blue-400 disabled:cursor-wait disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {busy && !listings.length ? "Searching…" : "Search Properties"}
              </button>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            Enter a city or ZIP code and a state. Listings and estimates are provided by RentCast;
            availability and property facts can change.
          </p>
        </form>
      </section>

      <section className="mt-9" aria-live="polite">
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100"
          >
            {error}
          </div>
        ) : null}
        {searched && !error && listings.length === 0 && !busy ? (
          <div className="rounded-2xl border border-border bg-card p-9 text-center">
            <h2 className="text-xl font-bold">No matching properties</h2>
            <p className="mt-2 text-muted-foreground">
              Try a nearby city or adjust the filters. No sample listings are shown.
            </p>
          </div>
        ) : null}
        {listings.length ? (
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.17em] text-primary-light">
                  RentCast results
                </p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">
                  {listings.length} properties{hasMore ? "+" : ""}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                RentCast listings are not direct MLS feeds.
              </p>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <li key={`${listing.listingType}:${listing.id}`}>
                  <ListingCard listing={listing} />
                </li>
              ))}
            </ul>
            {hasMore ? (
              <div className="mt-8 text-center">
                <button
                  disabled={busy}
                  onClick={() => void requestResults(nextOffset, true)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 font-semibold hover:bg-elevated disabled:opacity-60"
                >
                  {busy ? "Loading…" : "Load more properties"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </PageShell>
  );
}

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-white/15 bg-[#101a2b] px-3 text-sm text-white outline-none focus:border-blue-400";
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-300">
      {label}
      {children}
    </label>
  );
}
function ListingCard({ listing }: { listing: RentCastSearchListing }) {
  const address = propertyAddress(listing) || "Address unavailable";
  const price =
    typeof listing.price === "number" && Number.isFinite(listing.price)
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(listing.price)
      : "Price unavailable";
  const facts = [
    listing.bedrooms != null
      ? { label: "Beds", value: listing.bedrooms.toLocaleString(), icon: BedDouble }
      : null,
    listing.bathrooms != null
      ? { label: "Baths", value: listing.bathrooms.toLocaleString(), icon: Bath }
      : null,
    listing.squareFootage != null
      ? { label: "Interior", value: `${listing.squareFootage.toLocaleString()} sq ft`, icon: Ruler }
      : null,
    listing.lotSize != null
      ? { label: "Lot", value: `${listing.lotSize.toLocaleString()} sq ft`, icon: MapPin }
      : null,
    listing.yearBuilt != null
      ? { label: "Built", value: String(listing.yearBuilt), icon: CalendarDays }
      : null,
    listing.daysOnMarket != null
      ? { label: "On market", value: `${listing.daysOnMarket} days`, icon: Clock3 }
      : null,
  ].filter((fact): fact is NonNullable<typeof fact> => fact !== null);
  const sourceUrlValue = listing.url ?? listing["listingUrl"] ?? listing["sourceUrl"];
  const sourceUrl =
    typeof sourceUrlValue === "string" && /^https:\/\//i.test(sourceUrlValue)
      ? sourceUrlValue
      : undefined;
  const listedDate = listing.listedDate ? new Date(listing.listedDate) : null;
  const listedDateLabel =
    listedDate && Number.isFinite(listedDate.getTime())
      ? listedDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : null;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/10">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-blue-500/10 via-card to-card px-5 py-4">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-blue-200">
          <MapPin className="h-4 w-4" />
          RentCast listing
        </span>
        <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-200">
          {listing.status || "Status unavailable"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {listing.listingType === "rental" ? "For rent" : "For sale"}
          {listing.propertyType ? ` · ${listing.propertyType}` : ""}
        </p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {price}
          {listing.listingType === "rental" && typeof listing.price === "number" ? (
            <span className="ml-1 text-sm font-medium text-muted-foreground">/ month</span>
          ) : null}
        </p>
        <h3 className="mt-3 flex min-h-12 items-start gap-2 font-semibold leading-6 text-foreground">
          <MapPin className="mt-1 h-4 w-4 shrink-0 text-blue-300" />
          <span className="line-clamp-2">{address}</span>
        </h3>
        {facts.length > 0 ? (
          <dl className="mt-5 grid grid-cols-2 gap-2 border-y border-border py-3 sm:grid-cols-3">
            {facts.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg bg-elevated/60 px-3 py-2">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-5 border-y border-border py-3 text-sm text-muted-foreground">
            Detailed property facts aren’t available for this listing.
          </p>
        )}
        <div className="mt-auto pt-4">
          <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
            {listedDateLabel ? <span>Listed {listedDateLabel}</span> : null}
            {listing.lastSeenDate ? (
              <span>
                Updated{" "}
                {new Date(listing.lastSeenDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ) : null}
          </p>
          <div className="mb-4">
            <RentCastActions listing={listing} />
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to={rentCastDetailHref(listing) as never}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover"
            >
              Analyze property
              <ArrowRight className="h-4 w-4" />
            </Link>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-center text-xs font-medium text-blue-200 underline-offset-4 hover:underline"
              >
                View original listing
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
