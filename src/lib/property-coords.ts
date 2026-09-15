import {
  JAPAN_CENTER,
  PLACE_COORDINATES,
  PREFECTURE_COORDINATES,
  type LatLng,
} from "@/data/place-coordinates";
import type { Property } from "@/types/property";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+prefecture$/i, "")
    .replace(/\s+town$/i, "")
    .replace(/\s+/g, " ")
    .trim();

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = Math.imul(31, hash) + id.charCodeAt(i);
  }
  return Math.abs(hash);
}

/** Small deterministic offset so listings in the same city do not stack. */
function offsetForId(id: string): LatLng {
  const hash = hashId(id);
  const lat = ((hash % 1000) / 1000 - 0.5) * 0.012;
  const lng = (((hash >> 9) % 1000) / 1000 - 0.5) * 0.012;
  return { latitude: lat, longitude: lng };
}

export function coordinatesForPlace(
  location: string,
  prefecture: string,
): LatLng {
  const city = normalize(location.split(",")[0] ?? location);
  const pref = normalize(prefecture);
  const exact = PLACE_COORDINATES[`${city}|${pref}`];
  if (exact) return exact;
  const prefectureFallback = PREFECTURE_COORDINATES[pref];
  if (prefectureFallback) return prefectureFallback;
  return JAPAN_CENTER;
}

export function coordinatesForProperty(
  property: Pick<Property, "id" | "location" | "prefecture" | "latitude" | "longitude">,
): LatLng {
  if (
    typeof property.latitude === "number" &&
    Number.isFinite(property.latitude) &&
    typeof property.longitude === "number" &&
    Number.isFinite(property.longitude)
  ) {
    return { latitude: property.latitude, longitude: property.longitude };
  }

  const base = coordinatesForPlace(property.location, property.prefecture);
  const offset = offsetForId(property.id);
  return {
    latitude: Number((base.latitude + offset.latitude).toFixed(6)),
    longitude: Number((base.longitude + offset.longitude).toFixed(6)),
  };
}

export function withCoordinates(property: Property): Property {
  const coords = coordinatesForProperty(property);
  return {
    ...property,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}
