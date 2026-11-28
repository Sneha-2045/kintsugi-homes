import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BedDouble, Bath, MapPin, Square, ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { stateCodes } from "@/lib/us-states";

type Category = "buy" | "rent" | "foreclosure" | "auction" | "investment";
type Search = {
  category: Category;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  availability?: string;
  furnished?: string;
  leaseDuration?: string;
  amenity?: string[];
};
type Listing = {
  id: string;
  title: string;
  image?: string | undefined;
  address?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  zipCode?: string | undefined;
  price?: number | undefined;
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  type?: string | undefined;
  sqft?: number | undefined;
  status?: string | undefined;
  source?: string | undefined;
  sourceId?: string | undefined;
  availableDate?: string | undefined;
  amenities?: string[] | undefined;
  detailHref: string;
};
type IntelRecord = {
  id?: string;
  sourceId?: string;
  title?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  location?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  buildingArea?: number | null;
  propertyType?: string | null;
  status?: string | null;
  listingType?: string | null;
  foreclosureStatus?: string | null;
  auctionDate?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  images?: Array<string | { url?: string }>;
  dealCategory?: string | null;
  tags?: string[];
  isInvestment?: boolean;
};
type RentalRow = {
  zpid: string;
  sourceId?: string;
  buildingName?: string;
  addressLine1?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  monthlyRent?: number;
  minRent?: number;
  price?: number;
  beds?: number;
  bathrooms?: number;
  propertyType?: string;
  sqft?: number;
  statusText?: string;
  source?: string;
  imgSrc?: string;
  availableDate?: string;
  amenities?: string[];
};
type RentalResponse = {
  listings?: RentalRow[];
  totalCount?: number;
  error?: { message?: string };
  apifySearch?: {
    status?: "ready" | "running" | "unavailable";
    returnedListings?: number;
    totalAvailableUnits?: number;
  };
};
type BuyResponse = {
  listings?: RepliersRow[];
  count?: number;
  numPages?: number;
  error?: { message?: string };
};
type RepliersRow = {
  id?: string;
  mlsNumber?: string;
  boardId?: string | number;
  address?: {
    streetNumber?: string;
    streetName?: string;
    streetSuffix?: string;
    display?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  city?: string;
  images?: Array<string | { url?: string; path?: string }>;
  details?: { propertyType?: string; numBedrooms?: number; numBathrooms?: number; sqft?: number };
  listPrice?: number | string;
  price?: number | string;
  status?: string;
  office?: { brokerageName?: string };
  listOfficeName?: string;
};

const categoryTitles: Record<Category, string> = {
  buy: "Homes Available for Sale Across the U.S.",
  rent: "Rental Homes Across the U.S.",
  foreclosure: "Explore Foreclosure Properties",
  auction: "Upcoming Property Auctions",
  investment: "Explore Real Estate Investment Opportunities",
};
const PAGE_SIZE = 24;
const rentalPageSize = 20;
const validCategory = (value: unknown): Category =>
  value === "rent" || value === "foreclosure" || value === "auction" || value === "investment"
    ? value
    : "buy";
const stateCodeFor = (value: string) =>
  Object.entries(stateCodes).find(
    ([name, code]) =>
      name.toLowerCase() === value.trim().toLowerCase() ||
      code.toLowerCase() === value.trim().toLowerCase(),
  )?.[1];

export const Route = createFileRoute("/properties/search")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    category: validCategory(search["category"]),
    ...(typeof search["q"] === "string" ? { q: search["q"] } : {}),
    ...(typeof search["minPrice"] === "string" ? { minPrice: search["minPrice"] } : {}),
    ...(typeof search["maxPrice"] === "string" ? { maxPrice: search["maxPrice"] } : {}),
    ...(typeof search["bedrooms"] === "string" ? { bedrooms: search["bedrooms"] } : {}),
    ...(typeof search["bathrooms"] === "string" ? { bathrooms: search["bathrooms"] } : {}),
    ...(typeof search["propertyType"] === "string" ? { propertyType: search["propertyType"] } : {}),
    ...(typeof search["availability"] === "string" ? { availability: search["availability"] } : {}),
    ...(typeof search["furnished"] === "string" ? { furnished: search["furnished"] } : {}),
    ...(typeof search["leaseDuration"] === "string"
      ? { leaseDuration: search["leaseDuration"] }
      : {}),
    ...(Array.isArray(search["amenity"])
      ? { amenity: search["amenity"].filter((item): item is string => typeof item === "string") }
      : typeof search["amenity"] === "string"
        ? { amenity: [search["amenity"]] }
        : {}),
  }),
  head: () => ({ meta: [{ title: "Property Search Results | Rylestate" }] }),
  component: PropertySearchPage,
});

function money(value?: number) {
  return value == null || !Number.isFinite(value) || value <= 0
    ? "Price unavailable"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
}
function photoOf(images?: Array<string | { url?: string; path?: string }>) {
  const image = images
    ?.map((item) => (typeof item === "string" ? item : (item.url ?? item.path)))
    .find((value): value is string => typeof value === "string" && Boolean(value.trim()));
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("//")) return `https:${image}`;
  return `https://cdn.repliers.io/${image.replace(/^\/+/, "")}?class=medium`;
}
function repliersAddress(listing: RepliersRow) {
  const address = listing.address ?? {};
  return [address.streetNumber, address.streetName, address.streetSuffix].filter(Boolean).join(" ");
}

function PropertySearchPage() {
  const search = Route.useSearch();
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [liveRentalCount, setLiveRentalCount] = useState(0);
  const [liveRentalUnits, setLiveRentalUnits] = useState<number | undefined>();
  const [liveRentalLoading, setLiveRentalLoading] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setBusy(true);
      setError("");
      setLiveRentalCount(0);
      setLiveRentalUnits(undefined);
      setLiveRentalLoading(false);
      try {
        if (search.category === "rent") {
          const params = new URLSearchParams({ offset: String((page - 1) * rentalPageSize) });
          if (search.q) params.set("q", search.q);
          if (search.minPrice) params.set("minRent", search.minPrice);
          if (search.maxPrice) params.set("maxRent", search.maxPrice);
          if (search.bedrooms === "0") params.set("studio", "true");
          else if (search.bedrooms) params.set("beds", search.bedrooms);
          if (search.bathrooms) params.set("bathrooms", search.bathrooms);
          if (search.propertyType) params.set("type", search.propertyType);
          if (search.availability) params.set("availability", search.availability);
          if (search.furnished) params.set("furnished", search.furnished);
          if (search.leaseDuration) params.set("leaseDuration", search.leaseDuration);
          search.amenity?.forEach((value) => params.append("amenity", value));
          const applyRentalResponse = (body: RentalResponse) => {
            const rows = Array.isArray(body.listings) ? body.listings : [];
            setLiveRentalCount(Number(body.apifySearch?.returnedListings ?? 0));
            setLiveRentalUnits(body.apifySearch?.totalAvailableUnits);
            setListings(
              rows.map((item) => ({
                id: String(item.zpid),
                title: item.buildingName || item.addressLine1 || `Rental home in ${item.city}`,
                image: item.imgSrc || undefined,
                address: item.addressLine1 || item.address,
                city: item.city,
                state: item.state,
                zipCode: item.zipCode,
                price: item.monthlyRent ?? item.minRent ?? item.price,
                bedrooms: item.beds,
                bathrooms: item.bathrooms,
                type: item.propertyType,
                sqft: item.sqft,
                status: item.statusText || "For Rent",
                source:
                  item.source ||
                  (item.sourceId ? "Rylestate property database" : "Apify rental feed"),
                sourceId: item.sourceId || item.zpid,
                availableDate: item.availableDate,
                amenities: item.amenities,
                detailHref: `/rentals/${encodeURIComponent(item.sourceId || item.zpid)}`,
              })),
            );
            setTotal(Number(body.totalCount ?? rows.length));
            setPageCount(
              Math.max(1, Math.ceil(Number(body.totalCount ?? rows.length) / rentalPageSize)),
            );
            setLiveRentalLoading(body.apifySearch?.status === "running");
          };
          const fetchRentalResponse = async () => {
            const response = await fetch(`/api/rentals?${params}`, {
              signal: controller.signal,
              cache: "no-store",
            });
            const body = (await response.json()) as RentalResponse;
            if (!response.ok)
              throw new Error(body.error?.message ?? "Rental listings could not be loaded.");
            applyRentalResponse(body);
            return body;
          };
          let body = await fetchRentalResponse();
          // Show Mongo results immediately, then refresh the page as the live scrape completes.
          setBusy(false);
          for (
            let attempt = 0;
            body.apifySearch?.status === "running" && attempt < 36;
            attempt += 1
          ) {
            await new Promise((resolve) => window.setTimeout(resolve, 2500));
            if (controller.signal.aborted) break;
            body = await fetchRentalResponse();
          }
          return;
        }

        if (search.category === "buy") {
          const params = new URLSearchParams({
            pageNum: String(page),
            resultsPerPage: String(PAGE_SIZE),
            type: "sale",
          });
          const location = search.q?.trim() ?? "";
          if (/^\d{5}(?:-\d{4})?$/.test(location)) params.set("zip", location);
          else if (stateCodeFor(location)) params.set("state", stateCodeFor(location)!);
          else if (location.includes(",")) {
            const [city, state] = location.split(",").map((part) => part.trim());
            if (city) params.set("city", city);
            if (state && stateCodeFor(state)) params.set("state", stateCodeFor(state)!);
            else if (state) params.set("area", state);
          } else if (location) params.set("area", location);
          if (search.minPrice) params.set("minPrice", search.minPrice);
          if (search.maxPrice) params.set("maxPrice", search.maxPrice);
          if (search.bedrooms) params.set("minBedrooms", search.bedrooms);
          if (search.bathrooms) params.set("minBathrooms", search.bathrooms);
          if (search.propertyType) params.set("propertyType", search.propertyType);
          const response = await fetch(`/api/properties?${params}`, { signal: controller.signal });
          const body = (await response.json()) as BuyResponse;
          if (!response.ok)
            throw new Error(body.error?.message ?? "Sale listings could not be loaded.");
          const rows = Array.isArray(body.listings) ? body.listings : [];
          setListings(
            rows.map((item: RepliersRow) => {
              const address = item.address ?? {};
              const id = `${item.boardId ? `${item.boardId}~` : ""}${item.mlsNumber ?? item.id}`;
              return {
                id,
                title:
                  repliersAddress(item) ||
                  item.address?.display ||
                  item.details?.propertyType ||
                  "Home for sale",
                image: photoOf(item.images),
                address: repliersAddress(item) || address.display,
                city: address.city || item.city,
                state: address.state,
                zipCode: address.zip,
                price: Number(item.listPrice ?? item.price) || undefined,
                bedrooms: item.details?.numBedrooms,
                bathrooms: item.details?.numBathrooms,
                type: item.details?.propertyType,
                sqft: item.details?.sqft,
                status: item.status || "For Sale",
                source: item.office?.brokerageName || item.listOfficeName || "Repliers MLS",
                detailHref: `/properties/${encodeURIComponent(id)}`,
              };
            }),
          );
          setTotal(Number(body.count ?? rows.length));
          setPageCount(Math.max(1, Number(body.numPages ?? 1)));
          return;
        }

        const all: IntelRecord[] = [];
        let cursor = "";
        do {
          const params = new URLSearchParams({ pageSize: "1000" });
          if (cursor) params.set("cursor", cursor);
          const response = await fetch(`/api/live-intelligence?${params}`, {
            signal: controller.signal,
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.error || "Property listings could not be loaded.");
          if (Array.isArray(body.properties)) all.push(...body.properties);
          cursor = typeof body.nextCursor === "string" ? body.nextCursor : "";
        } while (cursor && !controller.signal.aborted);
        const term = search.q?.trim().toLowerCase() ?? "";
        const matching = all.filter((item) => {
          const haystack = [
            item.title,
            item.address,
            item.location,
            item.city,
            item.state,
            item.zipCode,
            item.propertyType,
            item.dealCategory,
            item.foreclosureStatus,
            ...(item.tags ?? []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (term) {
            const stateCode = stateCodeFor(term);
            if (stateCode) {
              if (item.state?.toUpperCase() !== stateCode) return false;
            } else {
              const tokens = term.split(/[\s,]+/).filter(Boolean);
              if (
                !tokens.every(
                  (token) =>
                    haystack.includes(token) ||
                    (stateCodeFor(token) != null &&
                      item.state?.toUpperCase() === stateCodeFor(token)),
                )
              )
                return false;
            }
          }
          if (search.minPrice && (item.price == null || item.price < Number(search.minPrice)))
            return false;
          if (search.maxPrice && (item.price == null || item.price > Number(search.maxPrice)))
            return false;
          if (search.bedrooms && (item.bedrooms == null || item.bedrooms < Number(search.bedrooms)))
            return false;
          if (
            search.bathrooms &&
            (item.bathrooms == null || item.bathrooms < Number(search.bathrooms))
          )
            return false;
          if (
            search.propertyType &&
            !item.propertyType?.toLowerCase().includes(search.propertyType.toLowerCase())
          )
            return false;
          if (search.category === "foreclosure")
            return (
              /foreclos/i.test(`${item.dealCategory ?? ""} ${item.foreclosureStatus ?? ""}`) &&
              item.listingType !== "auction"
            );
          if (search.category === "auction")
            return Boolean(item.auctionDate && Date.parse(item.auctionDate) >= Date.now());
          return (
            item.isInvestment === true ||
            /investment/i.test(`${item.dealCategory ?? ""} ${(item.tags ?? []).join(" ")}`)
          );
        });
        const pageItems = matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        setListings(
          pageItems.map((item) => ({
            id: item.id || item.sourceId || "",
            title: item.title || item.propertyType || "Property listing",
            image: photoOf(item.images),
            address: item.address || undefined,
            city: item.city || undefined,
            state: item.state || undefined,
            zipCode: item.zipCode || undefined,
            price: item.price ?? undefined,
            bedrooms: item.bedrooms ?? undefined,
            bathrooms: item.bathrooms ?? undefined,
            type: item.propertyType || undefined,
            sqft: item.buildingArea ?? undefined,
            status:
              item.status ||
              (search.category === "auction" ? "Upcoming auction" : "Active listing"),
            source: item.source || "Rylestate property database",
            sourceId: item.sourceId || undefined,
            detailHref: `/property/${encodeURIComponent(item.id || item.sourceId || "")}`,
          })),
        );
        setTotal(matching.length);
        setPageCount(Math.max(1, Math.ceil(matching.length / PAGE_SIZE)));
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Listings could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [search, page]);

  const countLabel = useMemo(() => `${total.toLocaleString()} matching properties`, [total]);
  return (
    <PageShell
      title={categoryTitles[search.category]}
      description={`Browse actual ${search.category} listings across the United States.`}
    >
      <section className="container-page py-12 md:py-16" aria-labelledby="property-search-title">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary-light">
          {search.category} listings
        </p>
        <h1
          id="property-search-title"
          className="mt-2 text-3xl font-bold text-foreground md:text-5xl"
        >
          {categoryTitles[search.category]}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          {busy ? "Loading actual listings…" : countLabel}
        </p>
        {!busy && search.category === "rent" && liveRentalCount > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {liveRentalCount.toLocaleString()} live Zillow rentals loaded
            {liveRentalUnits != null
              ? ` · Zillow reports ${liveRentalUnits.toLocaleString()} available units in this search`
              : ""}
          </p>
        ) : null}
        {!busy && search.category === "rent" && liveRentalLoading ? (
          <p className="mt-2 text-sm text-slate-400" role="status">
            Loading more live rentals for this location…
          </p>
        ) : null}
        {search.q || search.minPrice || search.maxPrice || search.bedrooms || search.bathrooms ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {search.q ? (
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                Location: {search.q}
              </span>
            ) : null}
            {search.minPrice ? (
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                Min ${Number(search.minPrice).toLocaleString()}
              </span>
            ) : null}
            {search.maxPrice ? (
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                Max ${Number(search.maxPrice).toLocaleString()}
              </span>
            ) : null}
            {search.bedrooms ? (
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                {search.bedrooms}+ beds
              </span>
            ) : null}
            {search.bathrooms ? (
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                {search.bathrooms}+ baths
              </span>
            ) : null}
          </div>
        ) : null}
        {busy ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-96 animate-pulse rounded-2xl bg-elevated" />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground"
          >
            {error}
          </div>
        ) : listings.length === 0 && liveRentalLoading ? (
          <div
            className="mt-8 rounded-2xl border border-border bg-card p-10 text-center"
            role="status"
          >
            <h2 className="text-xl font-bold">Searching rentals in {search.q || "your area"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Showing matching saved listings as they load. Checking live rental inventory…
            </p>
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
            <h2 className="text-xl font-bold">No matching properties found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try changing your location or widening your price and home filters.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <a href={listing.detailHref} className="block">
                  <ListingCardPhoto src={listing.image} alt={listing.title} />
                  <div className="p-5">
                    <p className="text-xl font-bold">
                      {money(listing.price)}
                      {search.category === "rent" && listing.price ? (
                        <span className="text-sm font-medium text-muted-foreground">/mo</span>
                      ) : null}
                    </p>
                    <h2 className="mt-2 text-base font-bold text-foreground">{listing.title}</h2>
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      {[listing.address, listing.city, listing.state, listing.zipCode]
                        .filter(Boolean)
                        .join(", ") || "Address unavailable"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {listing.bedrooms != null ? (
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="h-4 w-4" />
                          {listing.bedrooms} beds
                        </span>
                      ) : null}
                      {listing.bathrooms != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          {listing.bathrooms} baths
                        </span>
                      ) : null}
                      {listing.sqft != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          {listing.sqft.toLocaleString()} sqft
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {listing.type || "Property type unavailable"} ·{" "}
                      {listing.status || "Status unavailable"}
                    </p>
                    {listing.availableDate ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Available {listing.availableDate}
                      </p>
                    ) : null}
                    {listing.amenities?.length ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {listing.amenities.join(", ")}
                      </p>
                    ) : null}
                    <p className="mt-3 text-xs text-muted-foreground">
                      Source: {listing.source || "Source unavailable"}
                    </p>
                  </div>
                </a>
                <a
                  href={listing.detailHref}
                  className="mx-5 mb-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
                >
                  View Property Details <ArrowUpRight className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
        )}
        {!busy && !error && pageCount > 1 ? (
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 py-2 text-sm text-muted-foreground">
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}

function ListingCardPhoto({ src, alt }: { src?: string | undefined; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="aspect-[4/3] bg-elevated">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid h-full place-items-center text-sm text-muted-foreground">
          Photo unavailable
        </div>
      )}
    </div>
  );
}
