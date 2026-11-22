import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type IntelligenceProperty = Pick<Property, "id" | "title" | "latitude" | "longitude"> &
  Partial<Omit<Property, "id" | "title" | "latitude" | "longitude">> & {
    price?: number | null;
    currency?: string;
    status?: string | null;
    foreclosureStatus?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    listingType?: string | null;
    previousPrice?: number | null;
  };
type ApiResponse = {
  properties?: IntelligenceProperty[];
  fetchedAt?: string;
  dataSource?: "mongodb" | "recorded-snapshot";
  error?: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fetchedAt, setFetchedAt] = useState<string>();
  const [dataSource, setDataSource] = useState<ApiResponse["dataSource"]>("mongodb");
  const [map, setMap] = useState<import("maplibre-gl").Map | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/live-intelligence", {
        headers: { Accept: "application/json" },
      });
      const body = (await response.json()) as ApiResponse;
      if (!response.ok) throw new Error(body.error || "Property inventory could not be loaded.");
      const rows = (body.properties ?? []).filter(
        (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
      );
      setProperties(rows);
      setFetchedAt(body.fetchedAt);
      setDataSource(body.dataSource ?? "mongodb");
      if (selectedId && !rows.some((p) => p.id === selectedId)) setSelectedId(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Property inventory could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible = useMemo(
    () =>
      properties.filter((p) => {
        const text = [p.title, p.address, p.city, p.state, p.zipCode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          (!query.trim() || text.includes(query.trim().toLowerCase())) &&
          layers.some((layer) => enabled[layer.id] && layer.matches(p))
        );
      }),
    [properties, enabled, query],
  );
  const selected = properties.find((p) => p.id === selectedId);
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
    if (map && property.latitude != null && property.longitude != null)
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
            <b>{properties.length.toLocaleString()}</b>
            <span>GEOLOCATED</span>
          </div>
          <div>
            <b>{visible.length.toLocaleString()}</b>
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
                placeholder="Search address or market"
              />
            </label>
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
            <div className="intel-side-note">
              <Signal size={14} />
              <span>
                {dataSource === "recorded-snapshot"
                  ? "MongoDB has no mapped listings yet. Showing Rylestate's recorded property snapshot; check dates are listed per property."
                  : "Layer counts reflect stored property fields. An empty layer means no matching verified records are available."}
              </span>
            </div>
            <div className="intel-listing-results">
              <div className="intel-listing-heading">
                <span>PROPERTY LISTINGS</span>
                <span>{visible.length}</span>
              </div>
              {visible.length ? (
                visible.slice(0, 80).map((property) => (
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
              {visible.length > 80 && (
                <small className="intel-listing-limit">
                  Showing 80 of {visible.length.toLocaleString()} mapped listings. Use search to
                  narrow results.
                </small>
              )}
            </div>
            <div className="intel-selected-panel">
              <div className="intel-side-title">
                <div>
                  <MapPin size={15} /> SELECTED PROPERTY
                </div>
              </div>
              {selected ? (
                <>
                  <h3>{selected.address || selected.title}</h3>
                  <p>
                    {[selected.city, selected.state, selected.zipCode].filter(Boolean).join(", ")}
                  </p>
                  <div className="intel-property-meta">
                    <span>{selected.status || "Status not recorded"}</span>
                    {selected.price != null && selected.price > 0 && (
                      <b>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: selected.currency || "USD",
                          maximumFractionDigits: 0,
                        }).format(selected.price)}
                      </b>
                    )}
                  </div>
                  {selected.lastCheckedAt && (
                    <small>
                      LAST SOURCE CHECK · {new Date(selected.lastCheckedAt).toLocaleString()}
                    </small>
                  )}
                  <Link
                    className="intel-details-link"
                    to="/property/$id"
                    params={{ id: selected.id }}
                  >
                    Open property details <ArrowUpRight size={15} />
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
              <Radio size={14} /> {visible.length} mapped records <span>·</span> {baseStyle === "satellite" ? "ESRI" : "CARTO"}
            </div>
          </div>
          <div className="intel-map-frame">
            {loading && properties.length === 0 ? (
              <div className="intel-map-message">
                <LoaderCircle className="animate-spin" /> Loading verified inventory…
              </div>
            ) : error && properties.length === 0 ? (
              <div className="intel-map-message intel-error">
                <p>{error}</p>
                <button onClick={() => void refresh()}>Retry</button>
              </div>
            ) : visible.length ? (
              <OsirisPropertyMap
                properties={visible.map(asProperty)}
                selectedId={selectedId}
                mode={mode}
                baseStyle={baseStyle}
                onSelect={setSelectedId}
                onMapReady={setMap}
              />
            ) : (
              <div className="intel-map-message">
                <MapPin />
                No properties match the selected layers with recorded coordinates.
              </div>
            )}
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
