import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { JAPAN_CENTER } from "@/data/place-coordinates";
import { formatUsd } from "@/data/properties";
import { explicitCoordinates } from "@/lib/map-coordinates";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";

const FOCUS_ZOOM = 14;
const OVERVIEW_ZOOM = 5;
const US_CENTER = { latitude: 39.5, longitude: -98.35 };
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const compactUsd = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(amount);

function markerHtml(property: Property, metric: "price" | "rent" | "yield", active: boolean) {
  const price = property.priceUsd > 0 ? property.priceUsd : undefined;
  const rent =
    property.monthlyRentEstimate && property.monthlyRentEstimate > 0
      ? property.monthlyRentEstimate
      : undefined;
  const amount =
    metric === "price"
      ? price
      : metric === "rent"
        ? rent
        : price && rent
          ? ((rent * 12) / price) * 100
          : undefined;
  const label =
    amount === undefined
      ? "N/A"
      : metric === "yield"
        ? `${amount.toFixed(1)}%`
        : compactUsd(amount);
  const cls =
    property.dealCategory?.toLowerCase().includes("foreclosure") ||
    property.propertyType?.toLowerCase().includes("foreclosure")
      ? "foreclosure"
      : "standard";
  return `<span class="map-price-pill map-price-${cls}${active ? " map-price-active" : ""}">${escapeHtml(label)}<span class="map-price-sr">${metric === "rent" ? " estimated monthly rent" : metric === "yield" ? " estimated gross yield" : " reported price"}</span></span>`;
}

function popupHtml(property: Property) {
  const address = property.address || property.title;
  const place = [
    property.city || property.location,
    property.state || property.prefecture,
    property.zipCode,
  ]
    .filter(Boolean)
    .join(", ");
  const image = property.images[0];
  const priceLabel = property.auctionDate
    ? "reported auction price"
    : property.sourceDetails?.["sourceProvider"] === "Repliers"
      ? "MLS asking price"
      : "reported source price";
  const price =
    property.priceUsd > 0
      ? `<p class="property-map-popup-price">${escapeHtml(formatUsd(property.priceUsd))} <small>${priceLabel}</small></p>`
      : '<p class="property-map-popup-price">Price unavailable</p>';
  const bedBath = [
    property.bedrooms != null ? `${property.bedrooms} bd` : "",
    property.bathrooms != null ? `${property.bathrooms} ba` : "",
    property.floorArea ? `${property.floorArea.toLocaleString()} sq ft` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const detailHref =
    property.sourceDetails?.["sourceProvider"] === "Repliers"
      ? `/properties/${encodeURIComponent(property.sourceDetails["repliersId"] ?? property.id)}`
      : `/property/${encodeURIComponent(property.id)}`;
  return `<div class="property-map-popup">
    ${image ? `<img class="property-map-popup-image" src="${escapeHtml(image)}" alt="${escapeHtml(address)}" loading="lazy" />` : ""}
    <p class="property-map-popup-title">${escapeHtml(address)}</p><p class="property-map-popup-location">${escapeHtml(place)}</p>
    ${price}${bedBath ? `<p class="property-map-popup-location">${escapeHtml(bedBath)}</p>` : ""}
    <p class="property-map-popup-location">${escapeHtml(property.dealCategory || property.propertyType || "Property listing")}${property.status ? ` · ${escapeHtml(property.status)}` : ""}</p>
    ${property.estimatedMarketValue ? `<p class="property-map-popup-location">Est. market value ${escapeHtml(formatUsd(property.estimatedMarketValue))}</p>` : ""}
    ${property.monthlyRentEstimate ? `<p class="property-map-popup-location">Est. rent ${escapeHtml(formatUsd(property.monthlyRentEstimate))}/mo</p>` : ""}
    ${property.auctionDate ? `<p class="property-map-popup-location">Auction date ${escapeHtml(property.auctionDate)}</p>` : ""}
    ${property.lastCheckedAt ? `<p class="property-map-popup-location">Last checked ${escapeHtml(property.lastCheckedAt)}</p>` : ""}
    <div class="property-map-popup-actions"><a class="property-map-popup-link" href="${detailHref}">View Property</a><button type="button" class="property-map-popup-compare" data-compare-id="${escapeHtml(property.id)}">Compare</button></div>
    ${property.sourceUrl ? `<a class="property-map-source" href="${escapeHtml(property.sourceUrl)}" target="_blank" rel="noopener noreferrer">View source listing</a>` : ""}
  </div>`;
}

export function PropertyMap({
  properties,
  focusId,
  market = "japan",
  className,
  metric = "price",
  onSelect,
  onCompare,
  onMapReady,
}: {
  properties: Property[];
  focusId?: string | undefined;
  market?: "japan" | "us";
  className?: string | undefined;
  metric?: "price" | "rent" | "yield" | undefined;
  onSelect?: ((id: string) => void) | undefined;
  onCompare?: ((property: Property) => void) | undefined;
  onMapReady?: ((map: LeafletMap | null) => void) | undefined;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const selectedRef = useRef(focusId);
  const propertiesRef = useRef(properties);
  const metricRef = useRef(metric);
  const callbacksRef = useRef({ onSelect, onCompare, onMapReady });
  selectedRef.current = focusId;
  propertiesRef.current = properties;
  metricRef.current = metric;
  callbacksRef.current = { onSelect, onCompare, onMapReady };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let map: LeafletMap | null = null;
    let resizeObserver: ResizeObserver | undefined;
    const setup = async () => {
      const { default: L } = await import("leaflet");
      (globalThis as typeof globalThis & { L?: typeof L }).L = L;
      await import("leaflet.markercluster");
      if (cancelled || !containerRef.current) return;
      const div = containerRef.current as HTMLElement & { _leaflet_id?: number };
      if (div._leaflet_id) delete div._leaflet_id;
      const start = market === "us" ? US_CENTER : JAPAN_CENTER;
      map = L.map(div, { zoomControl: false, scrollWheelZoom: true }).setView(
        [start.latitude, start.longitude],
        OVERVIEW_ZOOM,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const group =
        typeof L.markerClusterGroup === "function"
          ? L.markerClusterGroup({
              showCoverageOnHover: false,
              maxClusterRadius: 48,
              spiderfyOnMaxZoom: true,
              disableClusteringAtZoom: 16,
            })
          : L.layerGroup();
      const markers = new Map<string, Marker>();
      const icon = (property: Property, active: boolean) =>
        L.divIcon({
          className: "property-marker",
          html: markerHtml(property, metricRef.current, active),
          iconSize: [86, 34],
          iconAnchor: [43, 31],
          popupAnchor: [0, -28],
        });
      for (const property of propertiesRef.current) {
        const coords = explicitCoordinates(property);
        if (!coords) continue;
        const marker = L.marker([coords.latitude, coords.longitude], {
          icon: icon(property, property.id === selectedRef.current),
          title: property.title,
          riseOnHover: true,
        });
        marker.bindPopup(popupHtml(property), { maxWidth: 320, closeButton: true });
        marker.on("click", () => callbacksRef.current.onSelect?.(property.id));
        marker.on("popupopen", (event) => {
          const button = event.popup
            .getElement()
            ?.querySelector<HTMLButtonElement>("[data-compare-id]");
          if (!button) return;
          L.DomEvent.disableClickPropagation(button);
          const compare = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            callbacksRef.current.onCompare?.(property);
          };
          button.addEventListener("click", compare, { once: true });
          event.popup.once("remove", () => button.removeEventListener("click", compare));
        });
        markers.set(property.id, marker);
        group.addLayer(marker);
      }
      map.addLayer(group);
      mapRef.current = map;
      callbacksRef.current.onMapReady?.(map);
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => map?.invalidateSize({ pan: false }));
        resizeObserver.observe(container);
      }
      const positions = [...markers.values()];
      if (positions.length > 1) {
        const bounds = L.featureGroup(positions).getBounds();
        if (bounds.isValid()) map.fitBounds(bounds.pad(0.12), { maxZoom: 11 });
      } else if (positions.length === 1) map.setView(positions[0]!.getLatLng(), 10);
      requestAnimationFrame(() => map?.invalidateSize());
      const focus = (id?: string) => {
        if (!id || !map) return;
        const marker = markers.get(id);
        const property = propertiesRef.current.find((p) => p.id === id);
        const coords = property && explicitCoordinates(property);
        if (!marker || !coords) return;
        markers.forEach((m, markerId) => {
          const item = propertiesRef.current.find((p) => p.id === markerId);
          if (item) m.setIcon(icon(item, markerId === id));
        });
        const reveal = () => {
          map?.flyTo([coords.latitude, coords.longitude], FOCUS_ZOOM, { duration: 0.65 });
          marker.openPopup();
        };
        if (
          "zoomToShowLayer" in group &&
          typeof (group as typeof group & { zoomToShowLayer?: unknown }).zoomToShowLayer ===
            "function"
        ) {
          (
            group as typeof group & { zoomToShowLayer: (m: Marker, cb: () => void) => void }
          ).zoomToShowLayer(marker, reveal);
        } else reveal();
      };
      window.setTimeout(() => focus(selectedRef.current), 0);
      (container as HTMLElement & { __mapFocus?: (id?: string) => void }).__mapFocus = focus;
    };
    void setup();
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      callbacksRef.current.onMapReady?.(null);
      delete (container as HTMLElement & { __mapFocus?: (id?: string) => void }).__mapFocus;
      map?.remove();
      mapRef.current = null;
      map = null;
    };
  }, [market, properties, metric]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      // Marker labels are refreshed by the parent when the metric changes.
      map.invalidateSize();
    };
    update();
  }, [metric]);
  useEffect(() => {
    const container = containerRef.current as
      (HTMLDivElement & { __mapFocus?: (id?: string) => void }) | null;
    container?.__mapFocus?.(focusId);
  }, [focusId, properties]);
  return (
    <div
      ref={containerRef}
      className={cn(
        "property-map h-[min(70vh,780px)] min-h-[420px] w-full overflow-hidden rounded-2xl",
        className,
      )}
      role="region"
      aria-label="Interactive property map"
    />
  );
}
