import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Layers3,
  LoaderCircle,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  Signal,
  X,
} from "lucide-react";
import { OsirisPropertyMap, type BaseStyle } from "@/components/map/OsirisPropertyMap";
import type { Property } from "@/types/property";

type IntelligenceProperty = Pick<Property, "id" | "title"> &
  Partial<Omit<Property, "id" | "title">> & {
    latitude?: number | null;
    longitude?: number | null;
    price?: number | null;
    currency?: string;
    status?: string | null;
    foreclosureStatus?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    listingType?: string | null;
    previousPrice?: number | null;
    source?: string | null;
    geocodingStatus?: string | null;
    geocodingPrecision?: string | null;
  };
type ApiResponse = {
  properties?: IntelligenceProperty[];
  total?: number;
  nextCursor?: string | null;
  fetchedAt?: string;
  dataSource?: "mongodb" | "recorded-snapshot";
  error?: string;
};
type IntelligenceDetail = Omit<IntelligenceProperty, "images"> & {
  features?: string[];
  nearbyPlaces?: string[];
  amenities?: string[];
  garage?: string | number | boolean | null;
  parking?: string | number | boolean | null;
  condition?: string | null;
  construction?: string | null;
  yearBuilt?: number | null;
  landArea?: number | null;
  buildingArea?: number | null;
  images?: Array<string | { url: string; altText?: string | null; sortOrder?: number }>;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  recordCreatedAt?: string | null;
  lastCheckedAt?: string | null;
  geocoding?: { status?: string; provider?: string; precision?: string; attemptedAt?: string; error?: string } | null;
  recordedAvailabilityChecks?: Array<{ firstSeenAt?: string; lastSeenAt?: string; updatedAt?: string }>;
  recordedAvailabilityEvents?: Array<{ type: string; date?: string; previousValue?: unknown; currentValue?: unknown }>;
};
type Layer = {
  id: string;
  label: string;
  color: string;
  matches: (property: IntelligenceProperty) => boolean;
};

const isRecent = (value?: string | null) => {
  if (!value) return false;
  const age = Date.now() - Date.parse(value);
  return age >= 0 && age < 14 * 86400000;
};
const includes = (value: unknown, pattern: RegExp) =>
  typeof value === "string" && pattern.test(value);
const hasCoordinates = (
  property: IntelligenceProperty,
): property is IntelligenceProperty & { latitude: number; longitude: number } =>
  typeof property.latitude === "number" &&
  Number.isFinite(property.latitude) &&
  property.latitude >= -90 &&
  property.latitude <= 90 &&
  typeof property.longitude === "number" &&
  Number.isFinite(property.longitude) &&
  property.longitude >= -180 &&
  property.longitude <= 180;
const isOtherStatus = (property: IntelligenceProperty) => {
  const status = (property.status ?? "").toLowerCase();
  return ![
    "published",
    "active",
    "for sale",
    "pending",
    "sold",
    "under contract",
    "contract",
  ].includes(status) &&
    !includes(status, /under contract|contract/i) &&
    !property.auctionDate &&
    property.listingType?.toLowerCase() !== "auction" &&
    !includes(property.foreclosureStatus, /auction/i);
};
const layers: Layer[] = [
  {
    id: "available",
    label: "Available",
    color: "#65e6b5",
    matches: (p) => ["published", "active", "for sale"].includes((p.status ?? "").toLowerCase()),
  },
  {
    id: "pending",
    label: "Pending",
    color: "#f6c66a",
    matches: (p) => p.status?.toLowerCase() === "pending",
  },
  {
    id: "contract",
    label: "Under Contract",
    color: "#75b9ff",
    matches: (p) =>
      includes(p.status, /under contract|contract/i) ||
      includes(p.foreclosureStatus, /under contract|contract/i),
  },
  {
    id: "sold",
    label: "Sold",
    color: "#b19aff",
    matches: (p) => p.status?.toLowerCase() === "sold",
  },
  {
    id: "auctions",
    label: "Auctions",
    color: "#ff8d76",
    matches: (p) =>
      p.listingType?.toLowerCase() === "auction" ||
      Boolean(p.auctionDate) ||
      includes(p.foreclosureStatus, /auction/i),
  },
  {
    id: "reduced",
    label: "Price Reduced",
    color: "#f08bc8",
    matches: (p) =>
      p.previousPrice != null && (p.price ?? 0) > 0 && p.previousPrice > (p.price ?? 0),
  },
  {
    id: "recent",
    label: "Recently Listed",
    color: "#8fe5ee",
    matches: (p) => isRecent(p.createdAt),
  },
  {
    id: "other",
    label: "Other / Inactive",
    color: "#a9b7be",
    matches: isOtherStatus,
  },
];

function asProperty(
  p: IntelligenceProperty,
): Property & { previousPrice?: number | null; createdAt?: string | null } {
  return {
    id: p.id,
    title: p.title,
    location: p.location || [p.city, p.state].filter(Boolean).join(", "),
    prefecture: p.state || "United States",
    regionSlug: "united-states",
    prefectureSlug: "united-states",
    categorySlug: "property",
    priceUsd: p.price ?? 0,
    addedDaysAgo: p.createdAt
      ? Math.max(0, Math.floor((Date.now() - Date.parse(p.createdAt)) / 86400000))
      : 0,
    images: p.images?.length ? p.images : ["/placeholder.svg"],
    tags: [],
    extraTags: 0,
    amenity: "",
    description: p.description || "",
    ...(p.latitude != null ? { latitude: p.latitude } : {}),
    ...(p.longitude != null ? { longitude: p.longitude } : {}),
    ...(p.address ? { address: p.address } : {}),
    ...(p.city ? { city: p.city } : {}),
    ...(p.state ? { state: p.state } : {}),
    ...(p.zipCode ? { zipCode: p.zipCode } : {}),
    ...(p.bedrooms != null ? { bedrooms: p.bedrooms } : {}),
    ...(p.bathrooms != null ? { bathrooms: p.bathrooms } : {}),
    ...(p.floorArea != null ? { floorArea: p.floorArea } : {}),
    ...(p.propertyType ? { propertyType: p.propertyType } : {}),
    ...(p.auctionDate ? { auctionDate: p.auctionDate } : {}),
    ...(p.status ? { status: p.status } : {}),
    ...(p.dealCategory || p.foreclosureStatus
      ? { dealCategory: p.dealCategory || p.foreclosureStatus! }
      : {}),
    ...(p.lastCheckedAt ? { lastCheckedAt: p.lastCheckedAt } : {}),
    ...(p.sourceUrl ? { sourceUrl: p.sourceUrl } : {}),
    ...(p.sourceDetails ? { sourceDetails: p.sourceDetails } : {}),
    ...(p.previousPrice != null ? { previousPrice: p.previousPrice } : {}),
    ...(p.createdAt ? { createdAt: p.createdAt } : {}),
  };
}

export const Route = createFileRoute("/live-intelligence")({
  head: () => ({
    meta: [
      { title: "Live Property Intelligence | Rylestate" },
      {
        name: "description",
        content:
          "Explore Rylestate property availability and verified listing updates on an interactive map.",
      },
    ],
  }),
  component: LiveIntelligencePage,
});

function LiveIntelligencePage() {
  const [properties, setProperties] = useState<IntelligenceProperty[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(layers.map((l) => [l.id, true])),
  );
  const [panelOpen, setPanelOpen] = useState(true);
  const [mode, setMode] = useState<"3D" | "2D">("3D");
  const [baseStyle, setBaseStyle] = useState<BaseStyle>("satellite");
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [bedroomsFilter, setBedroomsFilter] = useState("");
  const [bathroomsFilter, setBathroomsFilter] = useState("");
  const [foreclosureOnly, setForeclosureOnly] = useState(false);
  const [listingPage, setListingPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fetchedAt, setFetchedAt] = useState<string>();
  const [dataSource, setDataSource] = useState<ApiResponse["dataSource"]>("mongodb");
  const [map, setMap] = useState<import("maplibre-gl").Map | null>(null);
  const [totalInventory, setTotalInventory] = useState(0);
  const [selectedDetail, setSelectedDetail] = useState<IntelligenceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const selectedPanelRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef(selectedId);
  const inventoryRequestRef = useRef<AbortController | null>(null);
  selectedIdRef.current = selectedId;

  const refresh = useCallback(async () => {
    inventoryRequestRef.current?.abort();
    const controller = new AbortController();
    inventoryRequestRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const rows: IntelligenceProperty[] = [];
      let cursor: string | undefined;
      let source: ApiResponse["dataSource"] = "mongodb";
      let fetchedAt: string | undefined;
      let total = 0;
      do {
        const url = new URL("/api/live-intelligence", window.location.origin);
        url.searchParams.set("pageSize", "500");
        if (cursor) url.searchParams.set("cursor", cursor);
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const body = (await response.json()) as ApiResponse;
        if (!response.ok) throw new Error(body.error || "Property inventory could not be loaded.");
        rows.push(...(body.properties ?? []));
        source = body.dataSource ?? source;
        fetchedAt = body.fetchedAt ?? fetchedAt;
        total = body.total ?? rows.length;
        cursor = body.nextCursor ?? undefined;
      } while (cursor);
      if (controller.signal.aborted) return;
      setProperties(rows);
      setTotalInventory(total);
      setFetchedAt(fetchedAt);
      setDataSource(source);
      setListingPage(0);
      if (selectedIdRef.current && !rows.some((p) => p.id === selectedIdRef.current))
        setSelectedId(undefined);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Property inventory could not be loaded.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5 * 60 * 1000);
    return () => {
      window.clearInterval(timer);
      inventoryRequestRef.current?.abort();
    };
  }, [refresh]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      setDetailError("");
      return;
    }
    const controller = new AbortController();
    setSelectedDetail(null);
    setDetailLoading(true);
    setDetailError("");
    void fetch(`/api/live-intelligence/${encodeURIComponent(selectedId)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as { property?: IntelligenceDetail; error?: string };
        if (!response.ok || !body.property)
          throw new Error(body.error || "Full property details could not be loaded.");
        setSelectedDetail(body.property);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setDetailError(cause instanceof Error ? cause.message : "Property details could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !panelOpen) return;
    const frame = window.requestAnimationFrame(() => {
      selectedPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId, panelOpen]);

  useEffect(() => {
    setListingPage(0);
  }, [query, minPrice, maxPrice, propertyTypeFilter, bedroomsFilter, bathroomsFilter, foreclosureOnly, enabled]);

  const visible = useMemo(
    () =>
      properties.filter((p) => {
        const text = [p.title, p.address, p.city, p.state, p.zipCode, p.location]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const minimum = minPrice ? Number(minPrice) : undefined;
        const maximum = maxPrice ? Number(maxPrice) : undefined;
        const beds = bedroomsFilter ? Number(bedroomsFilter) : undefined;
        const baths = bathroomsFilter ? Number(bathroomsFilter) : undefined;
        return (
          (!query.trim() || text.includes(query.trim().toLowerCase())) &&
          layers.some((layer) => enabled[layer.id] && layer.matches(p)) &&
          (minimum === undefined || (p.price ?? 0) >= minimum) &&
          (maximum === undefined || (p.price ?? 0) <= maximum) &&
          (!propertyTypeFilter || p.propertyType?.toLowerCase().includes(propertyTypeFilter.toLowerCase())) &&
          (beds === undefined || (p.bedrooms ?? -1) >= beds) &&
          (baths === undefined || (p.bathrooms ?? -1) >= baths) &&
          (!foreclosureOnly || Boolean(p.auctionDate || includes(p.foreclosureStatus, /foreclos|auction/i)))
        );
      }),
    [properties, enabled, query, minPrice, maxPrice, propertyTypeFilter, bedroomsFilter, bathroomsFilter, foreclosureOnly],
  );
  const geolocatedCount = properties.filter(hasCoordinates).length;
  const visibleOnMap = visible.filter(hasCoordinates);
  const selected = properties.find((p) => p.id === selectedId);
  const selectedProperty = selected ? { ...selected, ...selectedDetail } : undefined;
  const listingPageSize = 80;
  const pageCount = Math.max(1, Math.ceil(visible.length / listingPageSize));
  const pageListings = visible.slice(listingPage * listingPageSize, (listingPage + 1) * listingPageSize);
  const layerCount = (id: string) => {
    const layer = layers.find((candidate) => candidate.id === id);
    return layer ? properties.filter(layer.matches).length : 0;
  };
  const events = useMemo(
    () =>
      properties
        .filter((p) => p.lastCheckedAt)
        .sort((a, b) => Date.parse(b.lastCheckedAt!) - Date.parse(a.lastCheckedAt!))
        .slice(0, 8),
    [properties],
  );
  const timestamp = fetchedAt
    ? new Date(fetchedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "—";
  const focus = (property: IntelligenceProperty) => {
    setSelectedId(property.id);
    if (map && hasCoordinates(property))
      map.easeTo({ center: [property.longitude, property.latitude], zoom: 13, duration: 850 });
  };

  return (
    <section className="intel-page">
      <div className="intel-topbar">
        <div className="intel-brand">
          <span className="intel-mark">R</span>
          <div>
            <p>
              RYLESTATE <span>/ INTELLIGENCE</span>
            </p>
            <small>PROPERTY MONITORING GRID</small>
          </div>
        </div>
        <div className="intel-live">
          <span className="intel-live-dot" /> INVENTORY SYNC{" "}
          <b>
            {loading
              ? "SYNCING"
              : error
                ? "DEGRADED"
                : dataSource === "recorded-snapshot"
                  ? "SNAPSHOT"
                  : "CONNECTED"}
          </b>
        </div>
        <button
          className="intel-icon-btn"
          onClick={() => void refresh()}
          aria-label="Refresh property data"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={17} />
        </button>
      </div>
      <div className="intel-heading">
        <div>
          <div className="intel-eyebrow">
            <Activity size={13} /> MARKET AWARENESS · UNITED STATES
          </div>
          <h1>Live Intelligence</h1>
          <p>Explore mapped property inventory and its latest recorded source checks.</p>
        </div>
        <div className="intel-heading-stats">
          <div>
            <b>{totalInventory.toLocaleString()}</b>
            <span>INVENTORY</span>
          </div>
          <div>
            <b>{geolocatedCount.toLocaleString()}</b>
            <span>GEOLOCATED</span>
          </div>
          <div>
            <b>{visibleOnMap.length.toLocaleString()}</b>
            <span>ON MAP</span>
          </div>
          <div>
            <b>{timestamp}</b>
            <span>DATA FETCHED</span>
          </div>
        </div>
      </div>
      <div className="intel-workspace">
        {panelOpen && (
          <aside className="intel-sidebar">
            <div className="intel-side-title">
              <div>
                <Layers3 size={15} /> PROPERTY LAYERS
              </div>
              <button onClick={() => setPanelOpen(false)} aria-label="Collapse layers">
                <X size={15} />
              </button>
            </div>
            <label className="intel-search">
              <Search size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search address, city, or ZIP"
              />
            </label>
            <details className="intel-advanced-filters">
              <summary>PRICE, TYPE &amp; PROPERTY FILTERS</summary>
              <div className="intel-filter-grid">
                <label>Min price<input inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="$0" /></label>
                <label>Max price<input inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="No max" /></label>
                <label>Property type<input value={propertyTypeFilter} onChange={(event) => setPropertyTypeFilter(event.target.value)} placeholder="Any type" /></label>
                <label>Bedrooms<input inputMode="numeric" value={bedroomsFilter} onChange={(event) => setBedroomsFilter(event.target.value)} placeholder="Any" /></label>
                <label>Bathrooms<input inputMode="numeric" value={bathroomsFilter} onChange={(event) => setBathroomsFilter(event.target.value)} placeholder="Any" /></label>
                <label className="intel-filter-check"><input type="checkbox" checked={foreclosureOnly} onChange={(event) => setForeclosureOnly(event.target.checked)} /> Auction / foreclosure</label>
              </div>
            </details>
            <div className="intel-layer-list">
              {layers.map((layer) => (
                <label key={layer.id} className="intel-layer">
                  <span className="intel-layer-name">
                    <i
                      style={{ background: layer.color, boxShadow: `0 0 11px ${layer.color}70` }}
                    />
                    {layer.label}
                  </span>
                  <span className="intel-layer-count">
                    {properties.filter(layer.matches).length}
                  </span>
                  <input
                    type="checkbox"
                    checked={enabled[layer.id]}
                    onChange={() => setEnabled((v) => ({ ...v, [layer.id]: !v[layer.id] }))}
                    aria-label={`Toggle ${layer.label} layer`}
                  />
                </label>
              ))}
            </div>
            <div className="intel-inventory-stats" aria-label="Inventory status counts">
              <span>All <b>{totalInventory.toLocaleString()}</b></span>
              <span>Available <b>{layerCount("available").toLocaleString()}</b></span>
              <span>Pending <b>{layerCount("pending").toLocaleString()}</b></span>
              <span>Auctions <b>{layerCount("auctions").toLocaleString()}</b></span>
              <span>Sold <b>{layerCount("sold").toLocaleString()}</b></span>
              <span>Recent <b>{layerCount("recent").toLocaleString()}</b></span>
              <span>Reduced <b>{layerCount("reduced").toLocaleString()}</b></span>
              <span>Unmapped <b>{(properties.length - geolocatedCount).toLocaleString()}</b></span>
            </div>
            <div className="intel-side-note">
              <Signal size={14} />
              <span>
                {dataSource === "recorded-snapshot"
                  ? "Showing Rylestate's recorded inventory snapshot because live MongoDB data is empty or unavailable. Snapshot data does not update until MongoDB reconnects."
                  : "Layer counts reflect stored property fields. An empty layer means no matching verified records are available."}
              </span>
            </div>
            <div className="intel-listing-results">
              <div className="intel-listing-heading">
                <span>PROPERTY LISTINGS</span>
                <span>{visible.length}</span>
              </div>
              {visible.length ? (
                pageListings.map((property) => (
                  <button
                    key={property.id}
                    className={`intel-listing-row ${selectedId === property.id ? "selected" : ""}`}
                    onClick={() => focus(property)}
                    type="button"
                  >
                    <span className="intel-listing-pin" />
                    <span className="intel-listing-copy">
                      <b>{property.address || property.title}</b>
                      <small>
                        {[property.city, property.state].filter(Boolean).join(", ") ||
                          property.location ||
                          "United States"}
                      </small>
                      <small>
                        {property.status || "Status not recorded"}
                        {property.lastCheckedAt &&
                          ` · checked ${new Date(property.lastCheckedAt).toLocaleDateString()}`}
                      </small>
                      {!hasCoordinates(property) && (
                        <small className="intel-no-location">
                          {property.geocodingStatus === "failed"
                            ? "Map location unavailable · geocoding failed"
                            : "Map location unavailable"}
                        </small>
                      )}
                      {hasCoordinates(property) && property.geocodingPrecision === "RANGE_INTERPOLATED" && (
                        <small className="intel-no-location">Approximate map location · interpolated address</small>
                      )}
                    </span>
                    <span className="intel-listing-price">
                      {property.price && property.price > 0
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: property.currency || "USD",
                            maximumFractionDigits: 0,
                          }).format(property.price)
                        : "—"}
                    </span>
                  </button>
                ))
              ) : (
                <p className="intel-listings-empty">
                  {loading ? "Loading listings…" : "No listings in the selected layers."}
                </p>
              )}
              {visible.length > listingPageSize && (
                <div className="intel-listing-pagination">
                  <button type="button" onClick={() => setListingPage((page) => Math.max(0, page - 1))} disabled={listingPage === 0}>Previous</button>
                  <span>{listingPage + 1} / {pageCount}</span>
                  <button type="button" onClick={() => setListingPage((page) => Math.min(pageCount - 1, page + 1))} disabled={listingPage + 1 >= pageCount}>Next</button>
                </div>
              )}
            </div>
            <div className="intel-selected-panel" ref={selectedPanelRef} aria-live="polite">
              <div className="intel-side-title">
                <div>
                  <MapPin size={15} /> SELECTED PROPERTY
                </div>
              </div>
              {selectedProperty ? (
                <>
                  <h3>{selectedProperty.title}</h3>
                  <p>
                    {[selectedProperty.address, selectedProperty.city, selectedProperty.state, selectedProperty.zipCode].filter(Boolean).join(", ")}
                  </p>
                  <div className="intel-property-meta">
                    <span>{selectedProperty.status || "Status not recorded"}</span>
                    {selectedProperty.price != null && selectedProperty.price > 0 && (
                      <b>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: selectedProperty.currency || "USD",
                          maximumFractionDigits: 0,
                        }).format(selectedProperty.price)}
                      </b>
                    )}
                  </div>
                  {detailLoading && <small className="intel-detail-loading">Loading full listing record…</small>}
                  {detailError && <small className="intel-detail-error">{detailError}</small>}
                  <dl className="intel-detail-grid">
                    {[
                      ["Property type", selectedProperty.propertyType],
                      ["Bedrooms", selectedProperty.bedrooms],
                      ["Bathrooms", selectedProperty.bathrooms],
                      ["Building area", selectedProperty.buildingArea ?? selectedProperty.floorArea],
                      ["Lot size", selectedProperty.landArea],
                      ["Year built", selectedProperty.yearBuilt],
                      ["Garage", selectedProperty.garage],
                      ["Parking", selectedProperty.parking],
                      ["Condition", selectedProperty.condition],
                      ["Construction", selectedProperty.construction],
                      ["Listing type", selectedProperty.listingType],
                      ["Auction date", selectedProperty.auctionDate],
                      ["Original source", selectedProperty.source],
                      ["Listed", selectedProperty.createdAt],
                      ["Updated", selectedProperty.updatedAt],
                      ["Record created", selectedProperty.recordCreatedAt],
                    ].filter(([, value]) => value != null && value !== "").map(([label, value]) => (
                      <div key={String(label)}><dt>{label}</dt><dd>{String(value)}</dd></div>
                    ))}
                  </dl>
                  {selectedDetail?.images?.length ? (
                    <div className="intel-property-gallery" aria-label="Property photographs">
                      {selectedDetail.images.map((image, index) => {
                        const imageUrl = typeof image === "string" ? image : image.url;
                        return <img key={`${imageUrl}-${index}`} src={imageUrl} alt={typeof image === "string" ? `${selectedProperty.title} photograph ${index + 1}` : image.altText || `${selectedProperty.title} photograph ${index + 1}`} loading="lazy" />;
                      })}
                    </div>
                  ) : null}
                  {selectedDetail?.description && <p className="intel-property-description">{selectedDetail.description}</p>}
                  {selectedDetail?.features?.length ? <p className="intel-property-features"><b>Features:</b> {selectedDetail.features.join(" · ")}</p> : null}
                  {selectedDetail?.amenities?.length ? <p className="intel-property-features"><b>Amenities:</b> {selectedDetail.amenities.join(" · ")}</p> : null}
                  {selectedDetail?.nearbyPlaces?.length ? <p className="intel-property-features"><b>Nearby:</b> {selectedDetail.nearbyPlaces.join(" · ")}</p> : null}
                  {selectedProperty.sourceUrl && <a className="intel-source-link" href={selectedProperty.sourceUrl} target="_blank" rel="noreferrer">Original listing source ↗</a>}
                  {selectedDetail?.recordedAvailabilityChecks?.length ? (
                    <div className="intel-recorded-checks">
                      <b>RECORDED SOURCE CHECKS</b>
                      {selectedDetail.recordedAvailabilityChecks.map((check, index) => (
                        <span key={`${check.lastSeenAt ?? check.updatedAt ?? index}`}>
                          {check.lastSeenAt ? `Last seen ${new Date(check.lastSeenAt).toLocaleString()}` : "Check recorded"}
                          {check.firstSeenAt ? ` · first seen ${new Date(check.firstSeenAt).toLocaleDateString()}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {selectedDetail?.recordedAvailabilityEvents?.length ? (
                    <div className="intel-recorded-checks">
                      <b>RECORDED LISTING CHANGES</b>
                      {selectedDetail.recordedAvailabilityEvents.map((event, index) => (
                        <span key={`${event.type}-${event.date ?? index}`}>
                          {event.type.replaceAll("_", " ")} {event.date ? `· ${new Date(event.date).toLocaleString()}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {(selectedProperty.lastCheckedAt || selectedDetail?.geocoding?.status) && (
                    <small>
                      {selectedProperty.lastCheckedAt && `LAST SOURCE CHECK · ${new Date(selectedProperty.lastCheckedAt).toLocaleString()}`}
                      {selectedDetail?.geocoding?.status && ` · ${selectedDetail.geocoding.precision === "RANGE_INTERPOLATED" ? "APPROXIMATE MAP LOCATION" : "GEOCODING"} ${selectedDetail.geocoding.status.toUpperCase()}${selectedDetail.geocoding.precision ? ` (${selectedDetail.geocoding.precision})` : ""}`}
                    </small>
                  )}
                  <Link
                    className="intel-details-link"
                    to="/property/$id"
                    params={{ id: selectedProperty.id }}
                  >
                    View Full Listing <ArrowUpRight size={15} />
                  </Link>
                </>
              ) : (
                <p className="intel-empty">
                  Select a marker or a listing to inspect its source availability record.
                </p>
              )}
            </div>
          </aside>
        )}
        <div className={`intel-map-area ${panelOpen ? "" : "intel-map-expanded"}`}>
          <div className="intel-map-toolbar">
            {!panelOpen && (
              <button onClick={() => setPanelOpen(true)}>
                <Layers3 size={15} /> Layers
              </button>
            )}
            <div className="intel-map-switch" aria-label="Map projection">
              <button className={mode === "3D" ? "active" : ""} onClick={() => setMode("3D")}>
                3D GLOBE
              </button>
              <button className={mode === "2D" ? "active" : ""} onClick={() => setMode("2D")}>
                2D MAP
              </button>
            </div>
            <div className="intel-map-switch intel-style-switch" aria-label="Map style">
              <button
                className={baseStyle === "dark" ? "active" : ""}
                onClick={() => setBaseStyle("dark")}
              >
                DARK
              </button>
              <button
                className={baseStyle === "satellite" ? "active" : ""}
                onClick={() => setBaseStyle("satellite")}
              >
                SAT
              </button>
            </div>
            <div className="intel-map-status">
              <Radio size={14} /> {visibleOnMap.length} mapped / {visible.length} matching <span>·</span> {baseStyle === "satellite" ? "ESRI" : "CARTO"}
            </div>
          </div>
          <div className="intel-map-frame">
            <OsirisPropertyMap
              properties={visibleOnMap.map(asProperty)}
              selectedId={selectedId}
              mode={mode}
              baseStyle={baseStyle}
              onSelect={(id) => {
                setSelectedId(id);
                setPanelOpen(true);
                const index = visible.findIndex((property) => property.id === id);
                if (index >= 0) setListingPage(Math.floor(index / listingPageSize));
              }}
              onMapReady={setMap}
            />
            {loading && properties.length === 0 ? (
              <div className="intel-map-message intel-map-status-overlay">
                <LoaderCircle className="animate-spin" /> Loading verified inventory…
              </div>
            ) : error && properties.length === 0 ? (
              <div className="intel-map-message intel-error intel-map-status-overlay">
                <p>{error}</p>
                <button onClick={() => void refresh()}>Retry</button>
              </div>
            ) : !visibleOnMap.length ? (
              <div className="intel-map-message intel-map-status-overlay">
                <MapPin />
                {visible.length
                  ? "Matching listings have no recorded coordinates and remain available in the property list."
                  : "No properties match the selected filters."}
              </div>
            ) : null}
            <div className="intel-map-crosshair" aria-hidden="true">
              +
            </div>
            <div className="intel-map-legend">
              <span>
                <i /> PROPERTY LOCATION
              </span>
              <span>
                <Clock3 size={12} /> RECORDED CHECKS
              </span>
            </div>
          </div>
          <div className="intel-ticker">
            <div className="intel-ticker-label">
              <span className="intel-live-dot" /> SOURCE ACTIVITY
            </div>
            <div className="intel-ticker-track">
              {events.length ? (
                events.map((p) => (
                  <div className="intel-ticker-item" key={p.id}>
                    <b>{p.status?.toUpperCase() || "LISTING"}</b>
                    <span>{p.address || p.title}</span>
                    <time>
                      {new Date(p.lastCheckedAt!).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                ))
              ) : (
                <div className="intel-ticker-item">
                  <span>
                    {loading
                      ? "Loading source check records…"
                      : "No source check timestamps are recorded for this inventory."}
                  </span>
                </div>
              )}
            </div>
          </div>
          {error && properties.length > 0 && (
            <div className="intel-inline-error">Latest refresh failed: {error}</div>
          )}
        </div>
      </div>
      <div className="intel-footnote">
        <span>
          <Clock3 size={13} /> Inventory fetched {timestamp}
        </span>
        <span>Status timestamps are shown only when recorded by the listing source.</span>
      </div>
    </section>
  );
}
