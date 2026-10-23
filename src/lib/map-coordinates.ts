import type { Property } from "@/types/property";

export type ExplicitCoordinates = { latitude: number; longitude: number };

/** Return only coordinates supplied on the record or by its source geocoder. */
export function explicitCoordinates(property: Property): ExplicitCoordinates | undefined {
  const details = property.sourceDetails ?? {};
  const latitude = property.latitude ?? Number(details["geocodeLat"]);
  const longitude = property.longitude ?? Number(details["geocodeLng"]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return undefined;
  if (latitude === 0 && longitude === 0) return undefined;
  return { latitude, longitude };
}
