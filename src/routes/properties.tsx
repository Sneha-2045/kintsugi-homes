import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bath, BedDouble, MapPin, Search, Square } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/properties")({ component: PropertiesPage });
type Listing = {
  images?: Array<string | { url?: string; path?: string }>;
  address?: {
    streetNumber?: string;
    streetName?: string;
    streetSuffix?: string;
    city?: string;
    state?: string;
    zip?: string;
    display?: string;
  };
  city?: string;
  mlsNumber?: string;
  id?: string;
  permissions?: { displayAddressOnInternet?: string };
  boardId?: string | number;
  listPrice?: number | string;
  price?: number | string;
  details?: { numBedrooms?: number; numBathrooms?: number; sqft?: number; propertyType?: string };
  office?: { brokerageName?: string };
  listOfficeName?: string;
};
type ApiFailure = { code?: string; message?: string; retryable?: boolean };
type Results = {
  listings?: Listing[];
  count?: number;
  page?: number;
  numPages?: number;
  error?: ApiFailure | string;
};

function money(value: unknown) {
  if (value == null || value === "") return "Contact for price";
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(amount)
    : "Contact for price";
}
function imageOf(listing: Listing) {
  const img = listing.images?.[0];
  if (!img) return "";
  const path = typeof img === "string" ? img : (img?.url ?? img?.path ?? "");
  if (typeof path !== "string" || !path.trim()) return "";
  try {
    const url = /^https?:\/\//i.test(path)
      ? new URL(path)
      : new URL(path.replace(/^\/+/, ""), "https://cdn.repliers.io/");
    if (url.hostname === "cdn.repliers.io" && !url.searchParams.has("class")) {
      url.searchParams.set("class", "medium");
    }
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}
function PropertiesPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [city, setCity] = useState("");
  const [stateOrMarket, setStateOrMarket] = useState("");
  const [kind, setKind] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Results>({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    if (pathname !== "/properties") return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setBusy(true);
      setError(null);
      const query = new URLSearchParams({ pageNum: String(page), resultsPerPage: "24" });
      const location = city.trim();
      if (/^\d{5}(?:-\d{4})?$/.test(location)) query.set("zip", location);
      else if (location) query.set("city", location);
      const region = stateOrMarket.trim();
      if (/^[a-z]{2}$/i.test(region)) query.set("state", region.toUpperCase());
      else if (region) query.set("area", region);
      if (kind !== "all") query.set("type", kind);
      if (minPrice) query.set("minPrice", minPrice);
      if (maxPrice) query.set("maxPrice", maxPrice);
      if (minBedrooms) query.set("minBedrooms", minBedrooms);
      try {
        const response = await fetch(`/api/properties?${query}`, { signal: controller.signal });
        const body = (await response.json()) as Results;
        if (!response.ok) {
          const failure = body.error;
          setError(
            typeof failure === "string"
              ? { message: failure, retryable: response.status >= 500 }
              : (failure ?? {
                  message: "Could not load listings.",
                  retryable: response.status >= 500,
                }),
          );
          return;
        }
        if (!Array.isArray(body.listings)) {
          setError({
            message: "The listing service returned an unexpected response. Please try again.",
            retryable: true,
          });
          return;
        }
        setData(body);
      } catch (cause) {
        if (!controller.signal.aborted)
          setError({
            message: cause instanceof Error ? cause.message : "Could not load listings.",
            retryable: true,
          });
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pathname, city, stateOrMarket, kind, page, minPrice, maxPrice, minBedrooms, retryCount]);
  const listings = data.listings ?? [];
  const errorMessage =
    typeof error?.message === "string" ? error.message : "Could not load listings.";
  if (pathname !== "/properties") return <Outlet />;
  return (
    <PageShell
      title="Find a home"
      description="Search current public MLS listings. Listing availability and details may change."
    >
      <form
        className="mb-7 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
        }}
      >
        <label className="sr-only" htmlFor="listing-city">
          City or ZIP code
        </label>
        <input
          id="listing-city"
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setPage(1);
          }}
          placeholder="City or ZIP code"
          className="min-h-12 flex-1 rounded-lg border border-border bg-background px-4 text-foreground"
        />
        <label className="sr-only" htmlFor="listing-region">
          State or market
        </label>
        <input
          id="listing-region"
          value={stateOrMarket}
          onChange={(event) => {
            setStateOrMarket(event.target.value);
            setPage(1);
          }}
          placeholder="State (e.g. TX) or market"
          className="min-h-12 flex-1 rounded-lg border border-border bg-background px-4 text-foreground"
        />
        <label className="sr-only" htmlFor="listing-type">
          Listing type
        </label>
        <select
          id="listing-type"
          value={kind}
          onChange={(event) => {
            setKind(event.target.value);
            setPage(1);
          }}
          className="min-h-12 rounded-lg border border-border bg-background px-4 text-foreground"
        >
          <option value="all">All listings</option>
          <option value="sale">Buy</option>
          <option value="lease">Rent</option>
        </select>
        <label className="sr-only" htmlFor="listing-min-price">
          Minimum price
        </label>
        <input
          id="listing-min-price"
          inputMode="numeric"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          placeholder="Min price"
          className="min-h-12 w-full rounded-lg border border-border bg-background px-3 text-foreground sm:w-32"
        />
        <label className="sr-only" htmlFor="listing-max-price">
          Maximum price
        </label>
        <input
          id="listing-max-price"
          inputMode="numeric"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          placeholder="Max price"
          className="min-h-12 w-full rounded-lg border border-border bg-background px-3 text-foreground sm:w-32"
        />
        <label className="sr-only" htmlFor="listing-beds">
          Minimum bedrooms
        </label>
        <select
          id="listing-beds"
          value={minBedrooms}
          onChange={(event) => setMinBedrooms(event.target.value)}
          className="min-h-12 rounded-lg border border-border bg-background px-3 text-foreground"
        >
          <option value="">Any beds</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}+ beds
            </option>
          ))}
        </select>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground">
          <Search className="h-4 w-4" />
          Search
        </button>
      </form>
      <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
        {busy
          ? "Loading listings…"
          : error
            ? errorMessage
            : `${Number(data.count ?? listings.length).toLocaleString()} listings`}
      </p>
      {busy ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-elevated" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="font-semibold text-foreground">{errorMessage}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.code
              ? `Error code: ${error.code}`
              : "Check the server’s Repliers configuration and account access."}
          </p>
          {error.retryable ? (
            <button
              type="button"
              onClick={() => setRetryCount((value) => value + 1)}
              className="mt-5 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-foreground">
            No current public listings were returned for{" "}
            {[city, stateOrMarket].filter(Boolean).join(", ") || "these filters"}.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try another city, state, market, or ZIP code.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item, i) => {
            const address = item.address ?? {};
            const location =
              [
                address.streetNumber,
                address.streetName,
                address.streetSuffix,
                address.city,
                address.state,
              ]
                .filter(Boolean)
                .join(" ") ||
              (address.display ?? item.city ?? "Location details unavailable");
            const mls = item.mlsNumber ?? item.id ?? String(i);
            const photo = imageOf(item);
            const displayAddress =
              item.permissions?.displayAddressOnInternet === "N"
                ? [address.city, address.state].filter(Boolean).join(", ") || "Address withheld"
                : location;
            const listingId = item.boardId ? `${item.boardId}~${mls}` : String(mls);
            return (
              <article
                key={mls}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <Link to="/properties/$id" params={{ id: listingId }} className="block">
                  <div className="aspect-[4/3] bg-elevated">
                    {photo ? (
                      <ListingPhoto src={photo} alt="" />
                    ) : (
                      <div className="grid h-full place-items-center text-sm text-muted-foreground">
                        Photo unavailable
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xl font-bold">{money(item.listPrice ?? item.price)}</p>
                    <h2 className="mt-2 flex items-center gap-1 text-base font-semibold">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {displayAddress}
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {item.details?.numBedrooms != null && (
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="h-4 w-4" />
                          {item.details.numBedrooms} beds
                        </span>
                      )}
                      {item.details?.numBathrooms != null && (
                        <span className="inline-flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          {item.details.numBathrooms} baths
                        </span>
                      )}
                      {item.details?.sqft != null && (
                        <span className="inline-flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          {item.details.sqft} sqft
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                  Listing brokerage:{" "}
                  {item.office?.brokerageName ?? item.listOfficeName ?? "See listing details"} ·
                  Data provided through Repliers
                </p>
              </article>
            );
          })}
        </div>
      )}
      {!busy && !error && Number(data.numPages ?? 0) > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((n) => n - 1)}
            className="rounded-lg border border-border px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.numPages}
          </span>
          <button
            disabled={page >= Number(data.numPages)}
            onClick={() => setPage((n) => n + 1)}
            className="rounded-lg border border-border px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </PageShell>
  );
}

function ListingPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="grid h-full place-items-center text-sm text-muted-foreground">
      Photo unavailable
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
