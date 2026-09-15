import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { JAPAN_CENTER } from "@/data/place-coordinates";
import { formatUsd } from "@/data/properties";
import { coordinatesForProperty } from "@/lib/property-coords";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";

const FOCUS_ZOOM = 14;
const OVERVIEW_ZOOM = 5;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(property: Property) {
  return `
    <div class="property-map-popup">
      <p class="property-map-popup-title">${escapeHtml(property.title)}</p>
      <p class="property-map-popup-location">${escapeHtml(property.location)}</p>
      <p class="property-map-popup-price">${escapeHtml(formatUsd(property.priceUsd))}</p>
      <a class="property-map-popup-link" href="/property/${encodeURIComponent(property.id)}">View Listing</a>
    </div>
  `;
}

export function PropertyMap({
  properties,
  focusId,
  className,
}: {
  properties: Property[];
  focusId?: string | undefined;
  className?: string | undefined;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const clusterRef = useRef<{ zoomToShowLayer: (marker: Marker, cb?: () => void) => void } | null>(
    null,
  );
  const focusFnRef = useRef<(id?: string) => void>(() => {});
  const focusIdRef = useRef(focusId);
  const propertiesRef = useRef(properties);

  focusIdRef.current = focusId;
  propertiesRef.current = properties;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let map: LeafletMap | null = null;

    const setup = async () => {
      const leafletModule = await import("leaflet");
      const L = leafletModule.default;
      (globalThis as typeof globalThis & { L?: typeof L }).L = L;
      await import("leaflet.markercluster");
      if (cancelled || !containerRef.current) return;

      const leftoverId = (containerRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id;
      if (leftoverId) {
        delete (containerRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id;
      }

      const makeIcon = (selected: boolean) =>
        L.divIcon({
          className: selected ? "property-marker property-marker-active" : "property-marker",
          html: '<span class="property-marker-dot" aria-hidden="true"></span>',
          iconSize: [28, 36],
          iconAnchor: [14, 34],
          popupAnchor: [0, -28],
        });

      map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      }).setView([JAPAN_CENTER.latitude, JAPAN_CENTER.longitude], OVERVIEW_ZOOM);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const clusterGroup =
        typeof L.markerClusterGroup === "function"
          ? L.markerClusterGroup({
              showCoverageOnHover: false,
              maxClusterRadius: 48,
              spiderfyOnMaxZoom: true,
              disableClusteringAtZoom: 16,
            })
          : L.layerGroup();

      const markers = new Map<string, Marker>();
      for (const property of propertiesRef.current) {
        const { latitude, longitude } = coordinatesForProperty(property);
        const selected = property.id === focusIdRef.current;
        const marker = L.marker([latitude, longitude], {
          icon: makeIcon(selected),
          title: property.title,
          riseOnHover: true,
        });
        marker.bindPopup(popupHtml(property), { maxWidth: 280 });
        marker.on("click", () => {
          markers.forEach((m, id) => m.setIcon(makeIcon(id === property.id)));
        });
        markers.set(property.id, marker);
        clusterGroup.addLayer(marker);
      }

      map.addLayer(clusterGroup);
      mapRef.current = map;
      markersRef.current = markers;
      clusterRef.current = clusterGroup as {
        zoomToShowLayer: (marker: Marker, cb?: () => void) => void;
      };

      const focus = (id = focusIdRef.current) => {
        if (!id || !map) return;
        const property = propertiesRef.current.find((item) => item.id === id);
        const marker = markers.get(id);
        if (!property || !marker) return;
        const { latitude, longitude } = coordinatesForProperty(property);
        markers.forEach((m, markerId) => m.setIcon(makeIcon(markerId === id)));
        const reveal = () => {
          map?.flyTo([latitude, longitude], FOCUS_ZOOM, { duration: 0.85 });
          marker.openPopup();
        };
        if ("zoomToShowLayer" in clusterGroup && typeof clusterGroup.zoomToShowLayer === "function") {
          clusterGroup.zoomToShowLayer(marker, reveal);
          return;
        }
        reveal();
      };
      focusFnRef.current = focus;

      requestAnimationFrame(() => {
        map?.invalidateSize();
        focus();
      });
    };

    void setup();

    return () => {
      cancelled = true;
      clusterRef.current = null;
      markersRef.current = new Map();
      mapRef.current = null;
      focusFnRef.current = () => {};
      map?.remove();
      map = null;
    };
  }, []);

  useEffect(() => {
    if (!focusId || !mapRef.current) return;
    focusFnRef.current(focusId);
  }, [focusId]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "property-map h-[min(70vh,720px)] min-h-80 w-full overflow-hidden rounded-2xl",
        className,
      )}
      role="region"
      aria-label="Property map"
    />
  );
}
