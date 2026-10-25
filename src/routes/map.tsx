import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import {
  Bath,
  BedDouble,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Square,
  X,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyMap } from "@/components/map/PropertyMap";
import { CompareToggle, usePropertyComparison } from "@/components/property/PropertyComparison";
import { SubscribeForMore } from "@/components/property/SubscribeForMore";
import { properties } from "@/data/properties";
import { regions } from "@/data/regions";
import { usListings } from "@/data/us-listings";
import { fromProperty } from "@/lib/property-comparison";
import { explicitCoordinates } from "@/lib/map-coordinates";
import { canonicalLink } from "@/lib/seo";
import type { Property } from "@/types/property";

export const Route = createFileRoute("/map")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { id?: string | undefined; market?: "japan" | "us" | undefined } => ({
    id: typeof search["id"] === "string" && search["id"].length > 0 ? search["id"] : undefined,
    market: search["market"] === "us" ? "us" : search["market"] === "japan" ? "japan" : undefined,
  }),
  head: ({ match }) => ({
    meta: [
      { title: "Interactive Property Investment Map | Rylestate" },
      {
        name: "description",
        content:
          "Search and compare available property listings on an interactive map. Explore US opportunities and Japanese homes with source-reported property details.",
      },
      { property: "og:title", content: "Interactive Property Investment Map | Rylestate" },
      {
        property: "og:description",
        content: "Search property listings on an interactive map with filters and source details.",
      },
      ...(match.search.id || match.search.market
        ? [{ name: "robots", content: "noindex,follow" }]
        : []),
    ],
    links: [canonicalLink("/map")],
  }),
  component: MapPage,
});

function uniqueListings(market: "japan" | "us") {
  const seen = new Set<string>();
  return (market === "us" ? usListings : properties).filter((property) => {
    const key = property.sourcePropertyId || property.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
const LISTINGS = { japan: uniqueListings("japan"), us: uniqueListings("us") };
type MlsRecord = Record<string, unknown>;
const obj = (value: unknown): MlsRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as MlsRecord) : {};
const str = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const positive = (value: unknown) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const coordinate = (value: unknown) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const httpUrl = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};
function normalizeMls(raw: MlsRecord): Property | undefined {
  const address = obj(raw["address"]);
  const details = obj(raw["details"]);
  const mlsId = str(raw["mlsNumber"] ?? raw["id"]);
  if (!mlsId) return undefined;
  const street = [address["streetNumber"], address["streetName"], address["streetSuffix"]]
    .map(str)
    .filter(Boolean)
    .join(" ");
  const city = str(address["city"]) ?? str(raw["city"]);
  const state = str(address["state"]);
  const zip = str(address["zip"]);
  const title =
    str(address["display"]) ??
    [street, city, state, zip].filter(Boolean).join(", ") ??
    `MLS listing ${mlsId}`;
  const lat = coordinate(raw["latitude"] ?? address["latitude"] ?? obj(raw["map"])["latitude"]);
  const longitude = coordinate(
    raw["longitude"] ?? address["longitude"] ?? obj(raw["map"])["longitude"],
  );
  const sourceUrl = httpUrl(raw["sourceUrl"]);
  const bedrooms = positive(details["numBedrooms"]);
  const bathrooms = positive(details["numBathrooms"]);
  const floorArea = positive(details["sqft"]);
  const propertyType = str(details["propertyType"]);
  const status = str(raw["status"]);
  const images = Array.isArray(raw["images"])
    ? raw["images"].flatMap((image) => {
        const path =
          typeof image === "string" ? image : str(obj(image)["url"] ?? obj(image)["path"]);
        if (!path) return [];
        try {
          const url = /^https?:\/\//i.test(path)
            ? new URL(path)
            : new URL(path.replace(/^\/+/, ""), "https://cdn.repliers.io/");
          if (!["https:", "http:"].includes(url.protocol)) return [];
          if (url.hostname === "cdn.repliers.io" && !url.searchParams.has("class"))
            url.searchParams.set("class", "medium");
          return [url.toString()];
        } catch {
          return [];
        }
      })
    : [];
  return {
    id: `repliers-${mlsId}`,
    sourcePropertyId: mlsId,
    title,
    ...(street ? { address: street } : {}),
    location: [city, state].filter(Boolean).join(", ") || "Location unavailable",
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    ...(zip ? { zipCode: zip } : {}),
    prefecture: state || "United States",
    regionSlug: "us",
    prefectureSlug: (state || "us").toLowerCase(),
    categorySlug: "mls-listing",
    priceUsd: positive(raw["listPrice"] ?? raw["price"]) ?? 0,
    ...(sourceUrl ? { sourceUrl } : {}),
    addedDaysAgo: 0,
    images,
    tags: ["MLS listing"],
    extraTags: 0,
    ...(bedrooms !== undefined ? { bedrooms } : {}),
    ...(bathrooms !== undefined ? { bathrooms } : {}),
    ...(floorArea !== undefined ? { floorArea } : {}),
    ...(propertyType ? { propertyType } : {}),
    dealCategory: "MLS listing",
    ...(status ? { status } : {}),
    amenity: "",
    description: "Current MLS listing",
    ...(lat !== undefined ? { latitude: lat } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    sourceDetails: { sourceProvider: "Repliers", repliersId: mlsId },
  };
}
const text = (p: Property) =>
  [p.title, p.address, p.city, p.state, p.zipCode, p.location]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
const grossYield = (p: Property) =>
  p.priceUsd > 0 && (p.monthlyRentEstimate ?? 0) > 0
    ? ((p.monthlyRentEstimate! * 12) / p.priceUsd) * 100
    : undefined;
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function MapPage() {
  const { id, market } = Route.useSearch();
  const activeMarket = market ?? "japan";
  const isUs = activeMarket === "us";
  const base = LISTINGS[activeMarket];
  const [mlsListings, setMlsListings] = useState<Property[]>([]);
  const [mlsState, setMlsState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [mlsError, setMlsError] = useState("");
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [minBeds, setMinBeds] = useState("");
  const [minBaths, setMinBaths] = useState("");
  const [category, setCategory] = useState("all");
  const [minYield, setMinYield] = useState("");
  const [metric, setMetric] = useState<"price" | "rent" | "yield">("price");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedId, setSelectedId] = useState(id);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const comparison = usePropertyComparison();
  const combinedBase = useMemo(() => {
    if (!isUs) return base;
    const seen = new Set(base.map((p) => p.sourcePropertyId || p.id));
    return [...base, ...mlsListings.filter((p) => !seen.has(p.sourcePropertyId || p.id))];
  }, [base, isUs, mlsListings]);
  const types = useMemo(
    () =>
      [
        ...new Set(combinedBase.map((p) => p.propertyType).filter((x): x is string => Boolean(x))),
      ].sort(),
    [combinedBase],
  );
  const categories = useMemo(
    () =>
      [
        ...new Set(
          combinedBase
            .map((p) => p.dealCategory || p.tags[0])
            .filter((x): x is string => Boolean(x)),
        ),
      ].sort(),
    [combinedBase],
  );
  const filtered = useMemo(
    () =>
      combinedBase.filter((p) => {
        const price = p.priceUsd > 0 ? p.priceUsd : undefined;
        const yieldValue = grossYield(p);
        if (query.trim() && !text(p).includes(query.trim().toLowerCase())) return false;
        if (minPrice && (price === undefined || price < Number(minPrice))) return false;
        if (maxPrice && (price === undefined || price > Number(maxPrice))) return false;
        if (propertyType !== "all" && p.propertyType !== propertyType) return false;
        if (minBeds && (p.bedrooms == null || p.bedrooms < Number(minBeds))) return false;
        if (minBaths && (p.bathrooms == null || p.bathrooms < Number(minBaths))) return false;
        if (category !== "all" && (p.dealCategory || p.tags[0]) !== category) return false;
        if (minYield && (yieldValue == null || yieldValue < Number(minYield))) return false;
        return true;
      }),
    [combinedBase, query, minPrice, maxPrice, propertyType, minBeds, minBaths, category, minYield],
  );
  const visibleListings = useMemo(
    () => (isUs ? filtered.slice(0, 20) : filtered),
    [filtered, isUs],
  );
  const hasMoreUsListings = isUs && filtered.length > visibleListings.length;
  const mappable = useMemo(
    () => visibleListings.filter((p) => explicitCoordinates(p)),
    [visibleListings],
  );
  const clear = () => {
    setQuery("");
    setMinPrice("");
    setMaxPrice("");
    setPropertyType("all");
    setMinBeds("");
    setMinBaths("");
    setCategory("all");
    setMinYield("");
  };
  const recenter = () => {
    if (!map) return;
    const points = mappable
      .map((p) => explicitCoordinates(p))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    if (points.length)
      map.fitBounds(
        points.map((p) => [p.latitude, p.longitude]),
        { padding: [40, 40], maxZoom: 11 },
      );
  };
  const focusSelected = () => {
    if (!map || !selectedId) return;
    const selected = mappable.find((p) => p.id === selectedId);
    const coords = selected ? explicitCoordinates(selected) : undefined;
    if (coords) map.flyTo([coords.latitude, coords.longitude], 14, { duration: 0.6 });
  };
  const selectProperty = (property: Property) => setSelectedId(property.id);
  const loadMls = async () => {
    if (mlsState === "loading" || mlsState === "loaded") return;
    setMlsState("loading");
    setMlsError("");
    try {
      const response = await fetch("/api/properties?pageNum=1&resultsPerPage=48");
      const body = obj(await response.json());
      if (!response.ok)
        throw new Error(str(obj(body["error"])["message"]) || "MLS listings could not be loaded.");
      setMlsListings(
        (Array.isArray(body["listings"]) ? body["listings"] : [])
          .map((item) => normalizeMls(obj(item)))
          .filter((p): p is Property => Boolean(p)),
      );
      setMlsState("loaded");
    } catch (error) {
      setMlsState("error");
      setMlsError(error instanceof Error ? error.message : "MLS listings could not be loaded.");
    }
  };
  return (
    <PageShell
      title={isUs ? "US property investment map" : "Japan property map"}
      description={
        isUs
          ? "Explore locally available US property opportunities on a searchable, filterable map."
          : "Explore Japanese property listings on the map."
      }
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-2" aria-label="Choose listing country">
          <Link
            to="/map"
            search={{ market: "japan" }}
            className={`rounded-full border px-4 py-2 text-sm ${!isUs ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}
          >
            Japan
          </Link>
          <Link
            to="/map"
            search={{ market: "us" }}
            className={`rounded-full border px-4 py-2 text-sm ${isUs ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}
          >
            United States
          </Link>
        </nav>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {isUs && hasMoreUsListings
            ? `Showing ${visibleListings.length} of ${filtered.length} matches · ${mappable.length} mapped`
            : `${filtered.length} matches · ${mappable.length} mapped`}
        </div>
      </div>
      <section
        className="mb-4 rounded-2xl border border-border bg-card p-3 shadow-sm"
        aria-label="Property filters"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <label className="relative sm:col-span-2">
            <span className="sr-only">Search address, city or ZIP</span>
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Address, city or ZIP"
            />
          </label>
          <input
            aria-label="Minimum price"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min price"
          />
          <input
            aria-label="Maximum price"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price"
          />
          <select
            aria-label="Property type"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option value="all">All property types</option>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            aria-label="Listing category"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input
            aria-label="Minimum bedrooms"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            type="number"
            min="0"
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            placeholder="Min beds"
          />
          <input
            aria-label="Minimum bathrooms"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            type="number"
            min="0"
            value={minBaths}
            onChange={(e) => setMinBaths(e.target.value)}
            placeholder="Min baths"
          />
          {isUs && (
            <input
              aria-label="Minimum gross rental yield"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              type="number"
              min="0"
              step="0.1"
              value={minYield}
              onChange={(e) => setMinYield(e.target.value)}
              placeholder="Min yield %"
            />
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Marker metric</span>
            {(["price", "rent", "yield"] as const).map((item) => (
              <button
                key={item}
                disabled={item !== "price" && !isUs}
                onClick={() => setMetric(item)}
                className={`rounded-md px-2.5 py-1.5 capitalize ${metric === item ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
              >
                {item === "rent" ? "Est. rent" : item === "yield" ? "Gross yield" : "Price"}
              </button>
            ))}
          </div>
          <button
            onClick={clear}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        </div>
      </section>
      {isUs && (
        <section
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
          aria-label="MLS listings"
        >
          <div>
            <p className="text-sm font-semibold">Repliers MLS listings</p>
            <p className="text-xs text-muted-foreground">
              Loads up to 48 current listings through the existing server API. Local foreclosure
              listings remain available independently.
            </p>
            {mlsError && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {mlsError}
              </p>
            )}
            {mlsState === "loaded" && (
              <p className="mt-1 text-xs text-muted-foreground">
                {mlsListings.length} MLS listings loaded; only listings with valid coordinates are
                mapped.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void loadMls()}
            disabled={mlsState === "loading" || mlsState === "loaded"}
            className="min-h-10 rounded-lg border border-border bg-background px-4 text-sm font-semibold hover:border-primary/50 disabled:opacity-60"
          >
            {mlsState === "loading"
              ? "Loading MLS…"
              : mlsState === "loaded"
                ? "MLS loaded"
                : mlsState === "error"
                  ? "Retry MLS"
                  : "Load MLS listings"}
          </button>
        </section>
      )}
      {hasMoreUsListings && <SubscribeForMore className="mb-4" />}
      <div
        className={`grid gap-4 ${sidebarOpen ? "lg:grid-cols-[minmax(280px,350px)_minmax(0,1fr)]" : "grid-cols-1"}`}
      >
        {sidebarOpen && (
          <aside
            className="max-h-[min(75vh,820px)] overflow-y-auto rounded-2xl border border-border bg-card p-3"
            aria-label="Property listings"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">
                Listings{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({visibleListings.length}
                  {hasMoreUsListings ? ` of ${filtered.length}` : ""})
                </span>
              </h2>
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-label="Hide listings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {!visibleListings.length ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="font-medium">No properties match these filters.</p>
                <button className="mt-2 text-sm text-primary" onClick={clear}>
                  Clear filters
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {visibleListings.map((p) => {
                  const coords = explicitCoordinates(p);
                  return (
                    <li key={p.sourcePropertyId || p.id}>
                      <article
                        onClick={() => coords && selectProperty(p)}
                        onKeyDown={(event) => {
                          if (coords && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault();
                            selectProperty(p);
                          }
                        }}
                        role={coords ? "button" : undefined}
                        tabIndex={coords ? 0 : undefined}
                        aria-pressed={coords ? selectedId === p.id : undefined}
                        className={`rounded-xl border p-3 transition ${selectedId === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"} ${coords ? "cursor-pointer" : ""}`}
                      >
                        {p.images[0] && (
                          <img
                            src={p.images[0]}
                            alt={p.address || p.title}
                            loading="lazy"
                            className="mb-3 h-36 w-full rounded-lg object-cover"
                          />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="line-clamp-2 text-sm font-semibold">
                              {p.address || p.title}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {[p.city || p.location, p.state || p.prefecture, p.zipCode]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-primary">
                            {p.priceUsd > 0 ? money(p.priceUsd) : "Price n/a"}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {p.bedrooms != null && (
                            <span className="inline-flex items-center gap-1">
                              <BedDouble className="h-3.5 w-3.5" />
                              {p.bedrooms} bd
                            </span>
                          )}
                          {p.bathrooms != null && (
                            <span className="inline-flex items-center gap-1">
                              <Bath className="h-3.5 w-3.5" />
                              {p.bathrooms} ba
                            </span>
                          )}
                          {p.floorArea != null && (
                            <span className="inline-flex items-center gap-1">
                              <Square className="h-3.5 w-3.5" />
                              {p.floorArea.toLocaleString()} sqft
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {p.dealCategory || p.propertyType || p.tags[0] || "Property"}
                          {p.status ? ` · ${p.status}` : ""}
                          {grossYield(p) != null
                            ? ` · Est. gross yield ${grossYield(p)!.toFixed(1)}%`
                            : ""}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Link
                            to={
                              p.sourceDetails?.["sourceProvider"] === "Repliers"
                                ? "/properties/$id"
                                : "/property/$id"
                            }
                            params={{ id: p.sourceDetails?.["repliersId"] ?? p.id }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-semibold text-primary hover:underline"
                          >
                            View property
                          </Link>
                          <span onClick={(e) => e.stopPropagation()}>
                            <CompareToggle property={fromProperty(p)} />
                          </span>
                        </div>
                        {!coords && (
                          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                            Map location unavailable
                          </p>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
            {!isUs && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Browse regions
                </p>
                {regions
                  .filter((r) => r.count > 0)
                  .map((r) => (
                    <Link
                      key={r.slug}
                      to="/region/$slug"
                      params={{ slug: r.slug }}
                      className="flex justify-between py-1.5 text-sm hover:text-primary"
                    >
                      <span>{r.name}</span>
                      <span>{r.count.toLocaleString()}</span>
                    </Link>
                  ))}
              </div>
            )}
          </aside>
        )}
        <section className="relative min-w-0" aria-label="Map and map controls">
          <div className="absolute left-3 top-3 z-[500] flex flex-wrap gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg border border-border bg-card/95 px-3 py-2 text-sm font-medium shadow"
            >
              {sidebarOpen ? "Hide listings" : "Show listings"}
            </button>
            <button
              onClick={recenter}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/95 px-3 py-2 text-sm shadow"
            >
              <LocateFixed className="h-4 w-4" />
              Recenter
            </button>
            <button
              onClick={focusSelected}
              disabled={!selectedId}
              className="rounded-lg border border-border bg-card/95 px-3 py-2 text-sm shadow disabled:opacity-50"
            >
              Selected
            </button>
            <div className="flex overflow-hidden rounded-lg border border-border bg-card/95 shadow">
              <button
                onClick={() => map?.zoomIn()}
                aria-label="Zoom in"
                className="grid h-10 w-10 place-items-center hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => map?.zoomOut()}
                aria-label="Zoom out"
                className="grid h-10 w-10 place-items-center border-l border-border hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <PropertyMap
            properties={mappable}
            focusId={selectedId}
            market={activeMarket}
            metric={metric}
            onSelect={setSelectedId}
            onCompare={(p) => comparison.toggle(fromProperty(p))}
            onMapReady={setMap}
          />
          <div className="pointer-events-none absolute bottom-4 left-3 z-[500] rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow">
            <p className="mb-1 font-semibold">Map legend</p>
            <p>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
              Property listing
            </p>
            <p>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
              Foreclosure opportunity
            </p>
            <p className="mt-1 text-muted-foreground">Cluster numbers group nearby listings</p>
          </div>
          {!mappable.length && (
            <div className="absolute inset-x-5 bottom-20 z-[500] rounded-xl border border-amber-300 bg-card/95 p-3 text-sm shadow">
              No filtered listings have reliable coordinates yet. Listings remain available in the
              sidebar until precise coordinates are supplied.
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
