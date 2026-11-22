import { useEffect, useMemo, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { applyOsirisProjection } from "@/lib/osiris-map-projection";
import type { Property } from "@/types/property";

export type MapView = "3D" | "2D";
export type BaseStyle = "dark" | "satellite";
type MapProperty = Property & {
  previousPrice?: number | null;
  createdAt?: string | null;
};

const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_LABELS =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_STYLE = {
  version: 8 as const,
  projection: { type: "globe" as const },
  sky: {
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 7, 0],
  },
  sources: {
    "satellite-imagery": {
      type: "raster" as const,
      tiles: [ESRI_IMAGERY],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
    "satellite-labels": {
      type: "raster" as const,
      tiles: [ESRI_LABELS],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Labels and boundaries © Esri",
    },
  },
  layers: [
    {
      id: "satellite-imagery-layer",
      type: "raster" as const,
      source: "satellite-imagery",
      paint: {
        "raster-brightness-max": 0.78,
        "raster-saturation": -0.28,
        "raster-contrast": 0.08,
        "raster-fade-duration": 250,
      },
    },
    {
      id: "satellite-labels-layer",
      type: "raster" as const,
      source: "satellite-labels",
      paint: { "raster-opacity": 0.82, "raster-fade-duration": 250 },
    },
  ],
} as unknown as NonNullable<maplibregl.MapOptions["style"]>;

const EMPTY_FEATURES: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: [],
};

function isRecent(value?: string | null) {
  if (!value) return false;
  const age = Date.now() - Date.parse(value);
  return age >= 0 && age < 14 * 86400000;
}

function propertyColor(property: MapProperty) {
  const status = `${property.status ?? ""} ${property.dealCategory ?? ""}`.toLowerCase();
  if (/auction/.test(status) || property.auctionDate) return "#ff8d3f";
  if (property.previousPrice != null && property.previousPrice > property.priceUsd)
    return "#f08bc8";
  if (isRecent(property.createdAt)) return "#50dce8";
  if (/under contract|contract/.test(status)) return "#568cff";
  if (/pending/.test(status)) return "#f1c45e";
  if (/sold|closed/.test(status)) return "#ff594f";
  if (/for sale|active|published|available/.test(status)) return "#26d986";
  return "#50dce8";
}

function toFeatureCollection(properties: MapProperty[], selectedId?: string) {
  return {
    type: "FeatureCollection" as const,
    features: properties.flatMap((property) => {
      const { latitude, longitude } = property;
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude == null ||
        longitude == null ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      )
        return [];
      return [
        {
          type: "Feature" as const,
          id: property.id,
          geometry: { type: "Point" as const, coordinates: [longitude, latitude] as [number, number] },
          properties: {
            id: property.id,
            color: propertyColor(property),
            selected: property.id === selectedId,
            title: property.address || property.title,
          },
        },
      ];
    }),
  };
}

function installPropertyLayers(map: MapLibreMap, data: ReturnType<typeof toFeatureCollection>) {
  if (!map.getSource("property-inventory")) {
    map.addSource("property-inventory", {
      type: "geojson",
      data: EMPTY_FEATURES,
      cluster: true,
      clusterRadius: 32,
      clusterMaxZoom: 5,
    });
    map.addLayer({
      id: "property-cluster-halo",
      type: "circle",
      source: "property-inventory",
      filter: ["has", "point_count"],
      paint: {
        "circle-radius": ["step", ["get", "point_count"], 8, 50, 10, 250, 12],
        "circle-color": "#071510",
        "circle-opacity": 0.95,
        "circle-blur": 0.65,
      },
    });
    map.addLayer({
      id: "property-clusters",
      type: "circle",
      source: "property-inventory",
      filter: ["has", "point_count"],
      paint: {
        "circle-radius": ["step", ["get", "point_count"], 4, 50, 5, 250, 6],
        "circle-color": "#55e2b1",
        "circle-opacity": 0.95,
        "circle-stroke-color": "#06100d",
        "circle-stroke-width": 1.5,
      },
    });
    map.addLayer({
      id: "property-marker-glow",
      type: "circle",
      source: "property-inventory",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 5, 5, 7, 12, 10],
        "circle-color": ["get", "color"],
        "circle-opacity": 0.27,
        "circle-blur": 0.8,
      },
    });
    map.addLayer({
      id: "property-marker-selected",
      type: "circle",
      source: "property-inventory",
      filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "selected"], true]],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 7, 5, 9, 12, 12],
        "circle-color": "#ffffff",
        "circle-opacity": 0.05,
        "circle-stroke-color": ["get", "color"],
        "circle-stroke-width": 1.5,
        "circle-stroke-opacity": 0.9,
      },
    });
    map.addLayer({
      id: "property-marker-dot",
      type: "circle",
      source: "property-inventory",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 5, 3, 12, 4.5],
        "circle-color": ["get", "color"],
        "circle-opacity": 1,
        "circle-stroke-color": "#06100d",
        "circle-stroke-width": 1.25,
      },
    });
  }
  (map.getSource("property-inventory") as GeoJSONSource).setData(data);
}

export function OsirisPropertyMap({
  properties,
  selectedId,
  mode,
  baseStyle,
  onSelect,
  onMapReady,
}: {
  properties: MapProperty[];
  selectedId?: string | undefined;
  mode: MapView;
  baseStyle: BaseStyle;
  onSelect?: (id: string) => void;
  onMapReady?: (map: MapLibreMap | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const activeStyleRef = useRef<BaseStyle | null>(null);
  const styleReadyRef = useRef(false);
  const propsRef = useRef({ properties, selectedId, mode, baseStyle, onSelect, onMapReady });
  propsRef.current = { properties, selectedId, mode, baseStyle, onSelect, onMapReady };
  const featureData = useMemo(() => toFeatureCollection(properties, selectedId), [properties, selectedId]);
  const featureDataRef = useRef(featureData);
  featureDataRef.current = featureData;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    maplibregl.setWorkerUrl(mapLibreWorkerUrl);
    const map = new maplibregl.Map({
      container,
      style: propsRef.current.baseStyle === "satellite" ? SATELLITE_STYLE : DARK_STYLE,
      center: [-98.35, 39.5],
      zoom: 1.65,
      minZoom: 1.2,
      maxZoom: 19,
      maxPitch: 75,
      attributionControl: { compact: true },
      renderWorldCopies: false,
      canvasContextAttributes: { powerPreference: "high-performance", antialias: true },
    });
    mapRef.current = map;
    activeStyleRef.current = propsRef.current.baseStyle;
    map.on("error", (event) => {
      // MapLibre reports style, worker, and tile failures through this event.
      console.error("Live Intelligence map resource failed", event.error);
    });
    map.addControl(
      new maplibregl.NavigationControl({ showZoom: true, showCompass: true, visualizePitch: true }),
      "top-right",
    );

    const onStyleLoad = () => {
      styleReadyRef.current = true;
      applyOsirisProjection(map, propsRef.current.mode === "3D" ? "globe" : "mercator");
      map.setSky({
        "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 7, 0],
      });
      installPropertyLayers(map, featureDataRef.current);
      map.resize();
    };
    map.on("style.load", onStyleLoad);
    map.on("click", (event: maplibregl.MapMouseEvent) => {
      const hits = map.queryRenderedFeatures(event.point, {
        layers: ["property-clusters", "property-marker-dot", "property-marker-selected"],
      });
      const hit = hits[0];
      if (!hit) return;
      const coords = (hit.geometry as GeoJSON.Point).coordinates;
      if (coords.length < 2 || coords[0] == null || coords[1] == null) return;
      const center: [number, number] = [coords[0], coords[1]];
      if (hit.properties?.["cluster_id"] !== undefined) {
        const source = map.getSource("property-inventory") as GeoJSONSource;
        void source
          .getClusterExpansionZoom(Number(hit.properties["cluster_id"]))
          .then((zoom) => map.easeTo({ center, zoom, duration: 850 }))
          .catch((error: unknown) => console.warn("Could not expand property cluster", error));
      } else if (typeof hit.properties?.["id"] === "string") {
        propsRef.current.onSelect?.(hit.properties["id"]);
      }
    });
    const pointerTargets = ["property-clusters", "property-marker-dot", "property-marker-selected"];
    for (const layer of pointerTargets) {
      map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
    }
    map.on("load", () => {
      map.resize();
      propsRef.current.onMapReady?.(map);
    });

    let frame = 0;
    let lastFrame = 0;
    let stoppedByUser = false;
    const spin = (time: number) => {
      if (time - lastFrame >= 32 && !map.isMoving() && map.getZoom() <= 2.2 && propsRef.current.mode === "3D") {
        const elapsed = lastFrame ? time - lastFrame : 0;
        const center = map.getCenter();
        center.lng += (0.45 * elapsed) / 1000;
        map.setCenter(center);
        lastFrame = time;
      }
      if (!stoppedByUser && propsRef.current.mode === "3D" && map.getZoom() <= 2.2) {
        frame = requestAnimationFrame(spin);
      }
    };
    const startSpin = () => {
      cancelAnimationFrame(frame);
      if (!stoppedByUser && propsRef.current.mode === "3D" && map.getZoom() <= 2.2)
        frame = requestAnimationFrame(spin);
    };
    const stopSpin = () => {
      stoppedByUser = true;
      cancelAnimationFrame(frame);
    };
    map.on("load", startSpin);
    map.on("dragstart", stopSpin);
    map.on("zoomstart", stopSpin);

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      map.remove();
      mapRef.current = null;
      propsRef.current.onMapReady?.(null);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    installPropertyLayers(map, featureData);
  }, [featureData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!styleReadyRef.current) {
      map.once("style.load", () => {
        applyOsirisProjection(map, propsRef.current.mode === "3D" ? "globe" : "mercator");
      });
      return;
    }
    applyOsirisProjection(map, mode === "3D" ? "globe" : "mercator");
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeStyleRef.current === baseStyle) return;
    activeStyleRef.current = baseStyle;
    styleReadyRef.current = false;
    map.setStyle(baseStyle === "satellite" ? SATELLITE_STYLE : DARK_STYLE, { diff: false });
  }, [baseStyle]);

  return <div className="osiris-property-map" ref={containerRef} aria-label="Interactive property map" />;
}
